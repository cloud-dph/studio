
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { User as UserIcon, Save, ArrowLeft, CheckCircle } from 'lucide-react'; // Added CheckCircle
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserAccount } from '@/types/user';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Import CarouselApi type
} from "@/components/ui/carousel";

// Define available profile pictures (same as signup)
const profilePictures = [
  { id: 'dp1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/19.png', alt: 'Profile Picture 1', aiHint: 'abstract pattern' },
  { id: 'dp2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/9.png', alt: 'Profile Picture 2', aiHint: 'geometric design' },
  { id: 'dp3', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/24.png', alt: 'Profile Picture 3', aiHint: 'nature illustration' },
  { id: 'dp4', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/v1/feature/profile/27.png', alt: 'Profile Picture 4', aiHint: 'minimalist graphic' },
  { id: 'dp5', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/8.png', alt: 'Profile Picture 5', aiHint: 'colorful design' },
   // Add more diverse options from the image if needed/possible
  { id: 'dp6', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/4.png', alt: 'Profile Picture 6', aiHint: 'superhero mask' }, // Example based on image
  { id: 'dp7', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/26.png', alt: 'Profile Picture 7', aiHint: 'man portrait' }, // Example based on image
  { id: 'dp8', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/15.png', alt: 'Profile Picture 8', aiHint: 'penguin cartoon' }, // Example based on image
  { id: 'dp9', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/23.png', alt: 'Profile Picture 9', aiHint: 'woman portrait' }, // Example based on image
  { id: 'dp10', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/10.png', alt: 'Profile Picture 10', aiHint: 'helmet character' }, // Example based on image
  // Selected icon from image (slightly larger)
  { id: 'dp11', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/7.png', alt: 'Profile Picture 11', aiHint: 'smiley face gradient' }, // Example based on image (center one)
  { id: 'dp12', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/6.png', alt: 'Profile Picture 12', aiHint: 'panda cartoon' }, // Example based on image
  { id: 'dp13', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/1.png', alt: 'Profile Picture 13', aiHint: 'woman cartoon' }, // Example based on image
  { id: 'dp14', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/25.png', alt: 'Profile Picture 14', aiHint: 'man mustache' }, // Example based on image
  { id: 'dp15', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/17.png', alt: 'Profile Picture 15', aiHint: 'lion cub' }, // Example based on image
  { id: 'dp16', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/13.png', alt: 'Profile Picture 16', aiHint: 'panther mask' }, // Example based on image
];


// Update function to save changes to Firestore
const updateUserProfile = async (mobile: string, data: z.infer<typeof FormSchema>): Promise<{ success: boolean; message?: string; updatedUserAccount?: Omit<UserAccount, 'password' | 'createdAt'> }> => {
  try {
    const userDocRef = doc(db, 'users', mobile);

    // Prepare update data
    const updateData: Partial<Pick<UserAccount, 'name' | 'profilePictureUrl'>> = {
        name: data.name.trim(),
        profilePictureUrl: data.profilePictureUrl,
    };

    await updateDoc(userDocRef, updateData);
    console.log("User profile updated in Firestore:", mobile);

     // Fetch the updated document to get consistent data
     const updatedDocSnap = await getDoc(userDocRef);
     if (updatedDocSnap.exists()) {
        const fullData = updatedDocSnap.data() as UserAccount;
        const { password, createdAt, ...accountBase } = fullData;
        // Convert potential Timestamp back to Date for consistency if needed
        const createdAtDate = createdAt && typeof createdAt.toDate === 'function' ? createdAt.toDate() : createdAt;
        return { success: true, updatedUserAccount: { ...accountBase, createdAt: createdAtDate } };
     } else {
        // Should not happen if update was successful
        return { success: false, message: "Failed to retrieve updated profile." };
     }

  } catch (error) {
    console.error("Error updating user profile in Firestore:", error);
    return { success: false, message: "Profile update failed due to a server error." };
  }
};


const FormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }).max(50, {message: 'Name cannot exceed 50 characters.'}),
  profilePictureUrl: z.string().url({ message: "Please select a profile picture." }),
});

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<Omit<UserAccount, 'password'> | null>(null); // Include createdAt potentially as Date
  const [isLoading, setIsLoading] = React.useState(false); // For form submission
  const [isFetching, setIsFetching] = React.useState(true); // For initial data load
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>() // State for carousel API

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      profilePictureUrl: '',
    },
  });

  // Fetch current user data on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      if (storedData) {
        try {
          // Parse and potentially convert timestamp
          const parsedRaw: UserAccount = JSON.parse(storedData);
          let parsedData: Omit<UserAccount, 'password'>;

          if (parsedRaw && parsedRaw.mobile && parsedRaw.name && parsedRaw.profilePictureUrl) {
              const { password, createdAt, ...accountBase } = parsedRaw;
              const createdAtDate = createdAt && typeof createdAt !== 'string' && 'toDate' in createdAt ? createdAt.toDate() : new Date(createdAt as string); // Handle both Timestamp and string/Date
              parsedData = { ...accountBase, createdAt: createdAtDate };

              setCurrentUser(parsedData);
              form.reset({ // Pre-fill the form
                  name: parsedData.name,
                  profilePictureUrl: parsedData.profilePictureUrl,
              });

              // Find the index of the current profile picture to scroll the carousel
               const initialIndex = profilePictures.findIndex(p => p.url === parsedData.profilePictureUrl);
               if (carouselApi && initialIndex !== -1) {
                   carouselApi.scrollTo(initialIndex, true); // Instantly scroll without animation
               }

              setIsFetching(false); // Data loaded
          } else {
              toast({ title: "Error", description: "Could not load profile data.", variant: "destructive" });
              router.replace('/login');
          }
        } catch (e) {
          console.error("Error parsing user data for edit:", e);
          toast({ title: "Error", description: "Session error.", variant: "destructive" });
          localStorage.removeItem('userAccount');
          router.replace('/login');
        }
      } else {
        router.replace('/login'); // Not logged in
      }
    }
  }, [router, toast, form, carouselApi]); // Add carouselApi dependency

  async function onSubmit(data: z.infer<typeof FormSchema>) {
     if (!currentUser?.mobile) {
         toast({ title: "Error", description: "User session not found.", variant: "destructive" });
         return;
     }
    setIsLoading(true);

    try {
      const { success, message, updatedUserAccount } = await updateUserProfile(currentUser.mobile, data);

      if (success && updatedUserAccount) {
        toast({
          title: "Profile Updated",
          description: "Your changes have been saved.",
        });
        // Update localStorage with new data
        if (typeof window !== 'undefined') {
           // Ensure createdAt is stored in a consistent format (ISO string is generally safe)
           const dataToStore = { ...updatedUserAccount, createdAt: updatedUserAccount.createdAt instanceof Date ? updatedUserAccount.createdAt.toISOString() : updatedUserAccount.createdAt };
           localStorage.setItem('userAccount', JSON.stringify(dataToStore));
        }
        router.push('/profile'); // Redirect back to profile page
      } else {
        toast({
          title: "Update Failed",
          description: message || "Could not save changes. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  // Show skeleton while fetching initial data
  if (isFetching) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-16">
        <Skeleton className="h-8 w-40 mb-12" /> {/* Title Skeleton */}
         <div className="flex w-full max-w-xl justify-center items-center space-x-4 mb-12"> {/* Carousel Skeleton */}
            <Skeleton className="h-6 w-6 rounded-full" />
             {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-20 rounded-full" />)}
            <Skeleton className="h-6 w-6 rounded-full" />
         </div>
        <Skeleton className="h-4 w-24 mb-2" /> {/* Label Skeleton */}
        <Skeleton className="h-10 w-full max-w-xs mb-8" /> {/* Input Skeleton */}
        <div className="flex w-full max-w-xs gap-2"> {/* Button Skeletons */}
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-12 md:pt-16">
        <h1 className="text-3xl font-bold mb-10 md:mb-16 text-center">Edit Profile</h1>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center space-y-8 md:space-y-12">

            {/* Profile Picture Carousel */}
            <FormField
                control={form.control}
                name="profilePictureUrl"
                render={({ field }) => (
                <FormItem className="w-full max-w-xl flex flex-col items-center">
                    {/* <FormLabel className="text-center block mb-4 text-muted-foreground">Choose Your Profile Picture</FormLabel> */}
                    <FormControl>
                    <Carousel
                        setApi={setCarouselApi} // Set the carousel API
                        opts={{
                            align: "center",
                            loop: true,
                            slidesToScroll: 1,
                        }}
                        className="w-full"
                        >
                        <CarouselContent className="-ml-1">
                            {profilePictures.map((pic, index) => (
                            <CarouselItem key={pic.id} className="pl-1 basis-1/5 md:basis-1/6 lg:basis-1/7 flex justify-center">
                                <div
                                    className="p-1 cursor-pointer relative"
                                    onClick={() => {
                                        field.onChange(pic.url);
                                        if (carouselApi) carouselApi.scrollTo(index); // Scroll to selected
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            field.onChange(pic.url);
                                            if (carouselApi) carouselApi.scrollTo(index);
                                        }
                                    }}
                                    role="button"
                                    aria-pressed={field.value === pic.url}
                                    tabIndex={0} // Make it focusable
                                >
                                    <Image
                                        src={pic.url}
                                        alt={pic.alt}
                                        width={80} // Slightly larger size
                                        height={80}
                                        className={cn(
                                            "rounded-full object-cover mx-auto transition-transform duration-300 ease-in-out",
                                            field.value === pic.url ? "scale-110 border-2 border-primary" : "opacity-70 scale-90 hover:opacity-100"
                                            // Slightly larger selected state, less opacity for others
                                        )}
                                        data-ai-hint={pic.aiHint}
                                    />
                                    {field.value === pic.url && (
                                        <CheckCircle className="absolute bottom-0 right-0 h-5 w-5 text-primary bg-background rounded-full p-0.5" />
                                    )}
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 md:left-[-40px] top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground" />
                        <CarouselNext className="absolute right-0 md:right-[-40px] top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground" />
                    </Carousel>
                    </FormControl>
                    <FormMessage className="text-center mt-2"/>
                </FormItem>
                )}
            />

            {/* Profile Name Input */}
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                <FormItem className="w-full max-w-xs">
                    <FormLabel className="text-muted-foreground">Profile Name</FormLabel>
                    <FormControl>
                    <div className="relative">
                        {/* <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> */}
                        <Input
                            placeholder="Enter your name"
                            {...field}
                            className="text-center text-lg h-12" // Centered text, larger font, taller input
                            disabled={isLoading}
                        />
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                                !field.value && "hidden" // Hide clear button if input is empty
                            )}
                            onClick={() => form.setValue('name', '')}
                            aria-label="Clear name"
                            disabled={isLoading}
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </Button>
                    </div>
                    </FormControl>
                    <FormMessage className="text-center"/>
                </FormItem>
                )}
            />

            {/* Action Buttons */}
            <div className="flex w-full max-w-xs flex-col sm:flex-row gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full h-12 text-lg" disabled={isLoading}>
                    {/* <ArrowLeft className="mr-2 h-4 w-4" /> */}
                     Cancel
                </Button>
                <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                    {/* <Save className="mr-2 h-4 w-4" /> */}
                     {isLoading ? 'Saving...' : 'Save'}
                </Button>
            </div>
            </form>
        </Form>
    </div>
  );
}
