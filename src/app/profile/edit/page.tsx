'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { User, Phone, ArrowLeft } from 'lucide-react'; // Removed Trash2 icon
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Removed arrayRemove
import { profileImages } from '@/config/profileImages'; // Import from config
import type { UserAccount, Profile } from '@/types/user'; // Import shared types

// Function to update the specific profile within the user's profiles array in Firestore
const updateUserProfile = async (mobile: string, profileId: string, data: Pick<Profile, 'name' | 'profileImageUrl' | 'profileImageName'>): Promise<{ success: boolean; message?: string; updatedAccount?: UserAccount }> => {
    try {
        const userDocRef = doc(db, 'users', mobile);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            return { success: false, message: "User account not found." };
        }

        const accountData = userDocSnap.data() as Omit<UserAccount, 'mobile'>; // Type cast without mobile
        const profiles = accountData.profiles || [];
        const profileIndex = profiles.findIndex(p => p.id === profileId);

        if (profileIndex === -1) {
            return { success: false, message: "Profile not found." };
        }

        const currentProfile = profiles[profileIndex];

        // Check if there are actual changes
        const hasChanges = currentProfile.name !== data.name ||
                           currentProfile.profileImageUrl !== data.profileImageUrl ||
                           currentProfile.profileImageName !== data.profileImageName;

        if (!hasChanges) {
            console.log("No changes detected for this profile, skipping Firestore update.");
            // Return success with the potentially existing account data from snapshot (reconstructed)
            const fullAccount: UserAccount = { mobile, ...accountData };
            return { success: true, message: "No changes to save.", updatedAccount: fullAccount };
        }

        // Create the updated profiles array
        const updatedProfiles = [
            ...profiles.slice(0, profileIndex),
            { ...currentProfile, ...data }, // Update the specific profile
            ...profiles.slice(profileIndex + 1),
        ];

        // Update the entire profiles array in Firestore
        await updateDoc(userDocRef, { profiles: updatedProfiles });
        console.log("User profile updated in Firestore:", profileId);

        // Construct the full updated user account to return
        const updatedAccount: UserAccount = {
            mobile,
            password: accountData.password, // Keep password from original data
            createdAt: accountData.createdAt,
            profiles: updatedProfiles, // Use the updated profiles array
        };

        return { success: true, updatedAccount };

    } catch (error) {
        console.error("Error updating user profile in Firestore:", error);
        return { success: false, message: "Profile update failed due to a server error." };
    }
};

// Form Schema - Mobile is not part of the schema as it's not editable
const FormSchema = z.object({
  name: z.string().min(1, { // Allow 1 character for names like 'A'
    message: 'Name must be at least 1 character.',
  }).max(20, { message: 'Name cannot exceed 20 characters.'}), // Add max length
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }), // Represents the selected image URL
});

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get('profileId'); // Get profileId from query params
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUserAccount, setCurrentUserAccount] = React.useState<UserAccount | null>(null);
  const [profileToEdit, setProfileToEdit] = React.useState<Profile | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      profileImage: '',
    },
  });

  // Load current user account and find the profile to edit
  React.useEffect(() => {
    let isMounted = true;

    const loadData = () => {
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem('userAccount');
        if (storedData) {
          try {
            const parsedAccount: Omit<UserAccount, 'password'> = JSON.parse(storedData);
             if (parsedAccount && parsedAccount.mobile && Array.isArray(parsedAccount.profiles)) {
               if (isMounted) {
                 // Reconstruct UserAccount type for state (even without password)
                 const accountForState: UserAccount = {
                    ...parsedAccount,
                    password: '', // Password not needed client-side for this
                    createdAt: parsedAccount.createdAt || new Date() // Ensure createdAt exists
                 };
                 setCurrentUserAccount(accountForState);

                 if (profileId) {
                   const foundProfile = accountForState.profiles.find(p => p.id === profileId);
                   if (foundProfile) {
                     if (foundProfile.id === 'kids') {
                       // Handle Kids profile specifically - maybe redirect or show different view
                       toast({ title: "Info", description: "Kids profile editing is not available here.", variant: "default" });
                       router.back(); // Go back if trying to edit Kids profile directly
                       return;
                     }
                     setProfileToEdit(foundProfile);
                     form.reset({
                       name: foundProfile.name,
                       profileImage: foundProfile.profileImageUrl,
                     });
                     setSelectedImageUrl(foundProfile.profileImageUrl);
                   } else {
                     throw new Error("Profile ID not found in user account.");
                   }
                 } else {
                   throw new Error("Profile ID is missing from the URL.");
                 }
               }
             } else {
              throw new Error("Invalid user account structure.");
            }
          } catch (e) {
            console.error("Failed to load user account for editing", e);
            if (isMounted) {
                toast({ title: "Error", description: `Could not load profile data: ${e instanceof Error ? e.message : 'Unknown error'}. Please log in again.`, variant: "destructive" });
                localStorage.removeItem('userAccount');
                localStorage.removeItem('selectedProfile');
                router.push('/login');
            }
          }
        } else {
           if (isMounted) {
                toast({ title: "Not Authorized", description: "Please log in to edit your profile.", variant: "destructive" });
                router.push('/login');
            }
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router, toast, form, profileId]); // Added profileId


  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    form.setValue('profileImage', imageUrl, { shouldValidate: true });
    form.clearErrors('profileImage');
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!currentUserAccount || !currentUserAccount.mobile || !profileToEdit || !profileId) {
      toast({ title: "Error", description: "User or profile information is missing.", variant: "destructive" });
      return;
    }
    if (!selectedImageUrl) {
        form.setError('profileImage', { type: 'manual', message: 'Please select a profile image.' });
        return;
    }

    setIsLoading(true);

    const selectedImageData = profileImages.find(img => img.url === selectedImageUrl);
    const profileImageName = selectedImageData?.name || profileToEdit.profileImageName || 'Avatar'; // Fallback to current name

    // Prepare data for the updateUserProfile function
    const updateData: Pick<Profile, 'name' | 'profileImageUrl' | 'profileImageName'> = {
        name: data.name.trim(), // Trim name input
        profileImageUrl: selectedImageUrl,
        profileImageName: profileImageName,
    };

    try {
        const { success, message, updatedAccount } = await updateUserProfile(currentUserAccount.mobile, profileId, updateData);

        if (success && updatedAccount) {
             toast({
                title: message === "No changes to save." ? "No Changes" : "Profile Updated",
                description: message || "Your profile has been successfully updated.",
            });
            // Update localStorage ONLY if there was an actual update
            if (message !== "No changes to save." && typeof window !== 'undefined') {
               // Remove password before saving to localStorage
               const { password: _, ...accountToStore } = updatedAccount;
               localStorage.setItem('userAccount', JSON.stringify(accountToStore));
               // Check if the currently selected profile was the one edited
               const selectedProfileRaw = localStorage.getItem('selectedProfile');
               if(selectedProfileRaw) {
                   try {
                       const selected = JSON.parse(selectedProfileRaw);
                       if(selected.id === profileId) {
                           // Update selected profile in localStorage as well
                           const updatedSelectedProfile = updatedAccount.profiles.find(p => p.id === profileId);
                           if(updatedSelectedProfile) {
                                localStorage.setItem('selectedProfile', JSON.stringify(updatedSelectedProfile));
                           } else {
                               localStorage.removeItem('selectedProfile'); // Should not happen if update was successful
                           }
                       }
                   } catch (e) {
                        console.error("Error updating selected profile in localStorage", e);
                        localStorage.removeItem('selectedProfile');
                   }
               }
            }
             router.push('/profile'); // Redirect back to profile selection view
        } else {
             toast({
                title: "Update Failed",
                description: message || "Could not update profile. Please try again.",
                variant: "destructive",
            });
             setIsLoading(false);
        }
    } catch (error) {
         console.error("Profile update error:", error);
         toast({
            title: "Error",
            description: "An error occurred during the update. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  if (!currentUserAccount || !profileToEdit) {
     return <div className="flex min-h-screen items-center justify-center">Loading profile editor...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
             <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
                 <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-grow text-center">
                <CardTitle className="text-2xl font-bold">Edit Profile</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Update avatar and name for '{profileToEdit.name}'.
                </CardDescription>
            </div>
             <div className="w-10"> {/* Spacer to balance the back button */}
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="profileImage"
                render={() => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="mb-2 text-center">Choose your Avatar</FormLabel>
                     <Carousel
                      opts={{ align: "start", loop: false }}
                      className="w-full max-w-xs sm:max-w-sm md:max-w-md" // Adjust width for responsiveness
                    >
                      <CarouselContent>
                        {profileImages.map((image) => (
                          <CarouselItem key={image.url} className="basis-1/3 sm:basis-1/4 md:basis-1/5"> {/* Adjust basis */}
                            <div className="p-1">
                              <Card
                                className={cn(
                                    "cursor-pointer overflow-hidden transition-all aspect-square", // Ensure square aspect ratio
                                    selectedImageUrl === image.url ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-border hover:ring-primary/50"
                                )}
                                onClick={() => handleImageSelect(image.url)}
                              >
                                <CardContent className="flex items-center justify-center p-0 h-full w-full">
                                   <Image
                                    src={image.url}
                                    alt={image.name}
                                    width={100} // Smaller base size for carousel items
                                    height={100}
                                    className="object-cover w-full h-full" // Cover the container
                                    data-ai-hint={image.aiHint}
                                    unoptimized={image.url.includes('picsum')} // Avoid optimizing placeholder images
                                  />
                                </CardContent>
                              </Card>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-[-1rem] hidden sm:flex" />
                      <CarouselNext className="right-[-1rem] hidden sm:flex" />
                    </Carousel>
                    <FormMessage className="mt-2 text-center" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Name</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter profile name" {...field} className="pl-10" disabled={isLoading}/>
                       </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             {/* Display Mobile Number (Read-only) */}
              <FormItem>
                 <FormLabel>Account Mobile Number</FormLabel>
                 <FormControl>
                     <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="tel"
                            value={currentUserAccount.mobile}
                            className="pl-10 text-muted-foreground"
                            readOnly
                            disabled // Visually indicate it's not editable
                        />
                    </div>
                </FormControl>
                 <FormDescription>Mobile number cannot be changed.</FormDescription>
              </FormItem>

              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
