
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid'; // For generating unique profile IDs
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { User, Phone, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { profileImages } from '@/config/profileImages';
import type { UserAccount, Profile } from '@/types/user';

const MAX_PROFILES = 5; // Sync with manage page

// Function to add a new profile to the user's profiles array in Firestore
const addUserProfile = async (mobile: string, newProfile: Profile): Promise<{ success: boolean; message?: string; updatedAccount?: UserAccount }> => {
  try {
    const userDocRef = doc(db, 'users', mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "User account not found." };
    }

    const accountData = userDocSnap.data() as Omit<UserAccount, 'mobile'>;
    const currentProfiles = accountData.profiles || [];

    // Check profile limit
    if (currentProfiles.length >= MAX_PROFILES) {
         return { success: false, message: `Cannot add more than ${MAX_PROFILES} profiles.` };
    }

    // Add the new profile using arrayUnion
    await updateDoc(userDocRef, {
      profiles: arrayUnion(newProfile)
    });
    console.log("New profile added to Firestore:", newProfile.id);

    // Construct the full updated user account to return
    const updatedAccount: UserAccount = {
        mobile,
        password: accountData.password,
        createdAt: accountData.createdAt,
        profiles: [...currentProfiles, newProfile], // Manually add for return value
    };

    return { success: true, updatedAccount };

  } catch (error) {
    console.error("Error adding user profile in Firestore:", error);
    return { success: false, message: "Adding profile failed due to a server error." };
  }
};

// Form Schema
const FormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }).max(20, { message: 'Name cannot exceed 20 characters.'}),
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }), // Represents the selected image URL
});

export default function AddProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUserAccount, setCurrentUserAccount] = React.useState<UserAccount | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      profileImage: profileImages[0]?.url || '', // Default to the first image URL
    },
  });

 // Load current user account
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
                 const accountForState: UserAccount = {
                    ...parsedAccount,
                    password: '',
                    createdAt: parsedAccount.createdAt || new Date()
                 };
                 setCurrentUserAccount(accountForState);
                  // Check profile limit on load
                  if (accountForState.profiles.length >= MAX_PROFILES) {
                       toast({ title: "Profile Limit Reached", description: `You already have the maximum of ${MAX_PROFILES} profiles.`, variant: "destructive" });
                       router.replace('/profile/manage'); // Redirect back if limit reached
                   }
                   // Set initial selected image URL
                   setSelectedImageUrl(form.getValues('profileImage'));
               }
             } else {
              throw new Error("Invalid user account structure.");
            }
          } catch (e) {
            console.error("Failed to load user account for adding profile", e);
            if (isMounted) {
                toast({ title: "Error", description: `Could not load account data: ${e instanceof Error ? e.message : 'Unknown error'}. Please log in again.`, variant: "destructive" });
                localStorage.removeItem('userAccount');
                localStorage.removeItem('selectedProfile');
                router.push('/login');
            }
          }
        } else {
           if (isMounted) {
                toast({ title: "Not Authorized", description: "Please log in to add a profile.", variant: "destructive" });
                router.push('/login');
            }
        }
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [router, toast, form]); // Added form to dependencies


  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    form.setValue('profileImage', imageUrl, { shouldValidate: true });
    form.clearErrors('profileImage');
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!currentUserAccount || !currentUserAccount.mobile) {
      toast({ title: "Error", description: "User information is missing.", variant: "destructive" });
      return;
    }
    if (!selectedImageUrl) {
        form.setError('profileImage', { type: 'manual', message: 'Please select a profile image.' });
        return;
    }
    // Double check limit before submitting
     if (currentUserAccount.profiles.length >= MAX_PROFILES) {
         toast({ title: "Profile Limit Reached", description: `Cannot add more than ${MAX_PROFILES} profiles.`, variant: "destructive" });
         return;
     }

    setIsLoading(true);

    const selectedImageData = profileImages.find(img => img.url === selectedImageUrl);
    const profileImageName = selectedImageData?.name || 'Avatar'; // Use selected image name or default

    // Create the new profile object
    const newProfile: Profile = {
        id: uuidv4(), // Generate a unique ID for the new profile
        name: data.name.trim(),
        profileImageUrl: selectedImageUrl,
        profileImageName: profileImageName,
        // Add any other default fields for a new profile if needed
    };

    try {
        const { success, message, updatedAccount } = await addUserProfile(currentUserAccount.mobile, newProfile);

        if (success && updatedAccount) {
             toast({
                title: "Profile Added",
                description: `Profile '${newProfile.name}' has been created.`,
            });
            // Update localStorage with the new account data
            if (typeof window !== 'undefined') {
               const { password: _, ...accountToStore } = updatedAccount;
               localStorage.setItem('userAccount', JSON.stringify(accountToStore));
            }
             router.push('/profile/manage'); // Redirect back to manage profiles view
        } else {
             toast({
                title: "Add Failed",
                description: message || "Could not add profile. Please try again.",
                variant: "destructive",
            });
             setIsLoading(false);
        }
    } catch (error) {
         console.error("Add profile error:", error);
         toast({
            title: "Error",
            description: "An error occurred while adding the profile. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  if (!currentUserAccount) {
     return <div className="flex min-h-screen items-center justify-center">Loading add profile...</div>;
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
                <CardTitle className="text-2xl font-bold">Add Profile</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Create a new profile for your account.
                </CardDescription>
            </div>
            <div className="w-10"></div> {/* Spacer */}
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
                    <FormLabel className="mb-2 text-center">Choose an Avatar</FormLabel>
                     <Carousel
                      opts={{ align: "start", loop: false }}
                      className="w-full max-w-xs sm:max-w-sm md:max-w-md"
                    >
                      <CarouselContent>
                        {profileImages.map((image) => (
                          <CarouselItem key={image.url} className="basis-1/3 sm:basis-1/4 md:basis-1/5">
                            <div className="p-1">
                              <Card
                                className={cn(
                                    "cursor-pointer overflow-hidden transition-all aspect-square",
                                    selectedImageUrl === image.url ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-border hover:ring-primary/50"
                                )}
                                onClick={() => handleImageSelect(image.url)}
                              >
                                <CardContent className="flex items-center justify-center p-0 h-full w-full">
                                   <Image
                                    src={image.url}
                                    alt={image.name}
                                    width={100}
                                    height={100}
                                    className="object-cover w-full h-full"
                                    data-ai-hint={image.aiHint}
                                    unoptimized={image.url.includes('picsum')}
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
                            disabled
                        />
                    </div>
                </FormControl>
                 <FormDescription>Profiles are added to this account.</FormDescription>
              </FormItem>

              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? 'Adding Profile...' : 'Add Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
