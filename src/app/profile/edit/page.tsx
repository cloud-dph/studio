'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Profile images - Should ideally be fetched or defined globally if used elsewhere
const profileImages = [
  { id: '1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/21.png', name: 'Avatar 1' },
  { id: '2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/2.png', name: 'Avatar 2' },
  { id: '3', url: 'https://picsum.photos/200/200?random=1', name: 'Avatar 3', aiHint: 'abstract pattern' },
  { id: '4', url: 'https://picsum.photos/200/200?random=2', name: 'Avatar 4', aiHint: 'nature landscape' },
  { id: '5', url: 'https://picsum.photos/200/200?random=3', name: 'Avatar 5', aiHint: 'geometric shapes' },
];

interface UserData {
  name: string;
  mobile: string;
  profileImageUrl: string;
  profileImageName: string;
}

// Function to update user data in Firestore
const updateUser = async (mobile: string, data: Partial<Pick<UserData, 'name' | 'profileImageUrl' | 'profileImageName'>>): Promise<{ success: boolean; message?: string; updatedData?: UserData }> => {
  try {
    const userDocRef = doc(db, 'users', mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return { success: false, message: "User not found." };
    }

    const existingData = userDocSnap.data() as UserData;

    // Construct the data to be updated in Firestore
    // Only include fields that are actually being passed in `data` and have changed
    const firestoreUpdateData: Partial<Omit<UserData, 'mobile'>> = {};
    if (data.name !== undefined && data.name !== existingData.name) {
        firestoreUpdateData.name = data.name;
    }
    if (data.profileImageUrl !== undefined && data.profileImageUrl !== existingData.profileImageUrl) {
        firestoreUpdateData.profileImageUrl = data.profileImageUrl;
        // Always update name if URL changes, ensure data.profileImageName is passed
        firestoreUpdateData.profileImageName = data.profileImageName ?? 'Avatar';
    }


    // Only update if there are actual changes to send
    if (Object.keys(firestoreUpdateData).length > 0) {
         await updateDoc(userDocRef, firestoreUpdateData);
         console.log("User data updated in Firestore:", firestoreUpdateData);
    } else {
        console.log("No changes detected, skipping Firestore update.");
        // Still return success true if no changes, but with a specific message
         return { success: true, message: "No changes to save.", updatedData: existingData };
    }

    // Construct the full updated user data to return and store locally
    // Merge existing data with the changes that were sent to Firestore
    const updatedUserData = { ...existingData, ...firestoreUpdateData, mobile }; // Ensure mobile is included

    return { success: true, updatedData: updatedUserData }; // Return the merged data

  } catch (error) {
    console.error("Error updating user in Firestore:", error);
    return { success: false, message: "Profile update failed due to a server error." };
  }
};


// Form Schema - Mobile is not part of the schema as it's not editable
const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }), // Represents the selected image ID
});

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentUserData, setCurrentUserData] = React.useState<UserData | null>(null);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      profileImage: '',
    },
  });

 // Load current user data and initialize form
 React.useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const loadData = () => {
      if (typeof window !== 'undefined') {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData: UserData = JSON.parse(storedData);
            if (parsedData && parsedData.mobile) {
              if (isMounted) {
                setCurrentUserData(parsedData);
                const currentImage = profileImages.find(img => img.url === parsedData.profileImageUrl);
                const currentImageId = currentImage?.id || '';
                form.reset({ // Use reset to update default values and form state
                  name: parsedData.name,
                  profileImage: currentImageId,
                });
                setSelectedImage(currentImageId); // Ensure selectedImage state matches
              }
            } else {
              throw new Error("Invalid user data structure.");
            }
          } catch (e) {
            console.error("Failed to load user data for editing", e);
            if (isMounted) {
                toast({ title: "Error", description: "Could not load profile data. Please log in again.", variant: "destructive" });
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
      isMounted = false; // Cleanup function sets flag to false
    };
  }, [router, toast, form]); // form added to dependency array for reset


  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    form.setValue('profileImage', imageId, { shouldValidate: true });
    form.clearErrors('profileImage');
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!currentUserData || !currentUserData.mobile) {
      toast({ title: "Error", description: "User information is missing.", variant: "destructive" });
      return;
    }
    if (!selectedImage) {
        form.setError('profileImage', { type: 'manual', message: 'Please select a profile image.' });
        return;
    }

    setIsLoading(true);

    const selectedImageData = profileImages.find(img => img.id === selectedImage);
    if (!selectedImageData) {
        toast({ title: "Error", description: "Selected profile image not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    // Prepare data for the updateUser function
    const updateData: Partial<Pick<UserData, 'name' | 'profileImageUrl' | 'profileImageName'>> = {
        name: data.name,
        profileImageUrl: selectedImageData.url,
        profileImageName: selectedImageData.name, // Include the name associated with the selected image
    };

    try {
        const { success, message, updatedData } = await updateUser(currentUserData.mobile, updateData);

        if (success && updatedData) {
             toast({
                title: message === "No changes to save." ? "No Changes" : "Profile Updated",
                description: message || "Your profile has been successfully updated.",
            });
            // Update localStorage ONLY if there was an actual update or initial load
            if (message !== "No changes to save." && typeof window !== 'undefined') {
               localStorage.setItem('userData', JSON.stringify(updatedData));
            }
            // Only redirect if changes were made or it wasn't the "no changes" case
            if (message !== "No changes to save.") {
                 router.push('/profile'); // Redirect back to profile view
            } else {
                 setIsLoading(false); // Stop loading if no changes were made
            }
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
     // setIsLoading(false) is handled within the try/catch/finally blocks now
  }

  if (!currentUserData) {
     return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
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
                    Update your avatar and name.
                </CardDescription>
            </div>
            <div className="w-8"></div> {/* Spacer to balance the back button */}
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
                      className="w-full max-w-xs"
                    >
                      <CarouselContent>
                        {profileImages.map((image) => (
                          <CarouselItem key={image.id} className="basis-1/3">
                            <div className="p-1">
                              <Card
                                className={cn(
                                    "cursor-pointer overflow-hidden transition-all",
                                    selectedImage === image.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-border hover:ring-primary/50"
                                )}
                                onClick={() => handleImageSelect(image.id)}
                              >
                                <CardContent className="flex aspect-square items-center justify-center p-0">
                                   <Image
                                    src={image.url}
                                    alt={image.name}
                                    width={200}
                                    height={200}
                                    className="object-cover"
                                    data-ai-hint={image.aiHint}
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
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your name" {...field} className="pl-10" disabled={isLoading}/>
                       </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             {/* Display Mobile Number (Read-only) */}
              <FormItem>
                 <FormLabel>Mobile Number</FormLabel>
                 <FormControl>
                     <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="tel"
                            value={currentUserData.mobile}
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
