
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User as UserIcon, Save, ArrowLeft } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserAccount } from '@/types/user';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Define available profile pictures (same as signup)
const profilePictures = [
  { id: 'dp1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/19.png', alt: 'Profile Picture 1', aiHint: 'abstract pattern' },
  { id: 'dp2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/9.png', alt: 'Profile Picture 2', aiHint: 'geometric design' },
  { id: 'dp3', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/24.png', alt: 'Profile Picture 3', aiHint: 'nature illustration' },
  { id: 'dp4', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/v1/feature/profile/27.png', alt: 'Profile Picture 4', aiHint: 'minimalist graphic' },
  { id: 'dp5', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/8.png', alt: 'Profile Picture 5', aiHint: 'colorful design' },
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

     // Fetch the updated document to get consistent data (optional but good practice)
     const updatedDocSnap = await getDoc(userDocRef);
     if (updatedDocSnap.exists()) {
        const fullData = updatedDocSnap.data() as UserAccount;
        const { password, createdAt, ...accountBase } = fullData;
        return { success: true, updatedUserAccount: accountBase };
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
  const [currentUser, setCurrentUser] = React.useState<Omit<UserAccount, 'password' | 'createdAt'> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); // For form submission
  const [isFetching, setIsFetching] = React.useState(true); // For initial data load

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
          const parsedData: Omit<UserAccount, 'password' | 'createdAt'> = JSON.parse(storedData);
          if (parsedData && parsedData.mobile && parsedData.name && parsedData.profilePictureUrl) {
            setCurrentUser(parsedData);
            form.reset({ // Pre-fill the form
              name: parsedData.name,
              profilePictureUrl: parsedData.profilePictureUrl,
            });
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
  }, [router, toast, form]);

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
           // Re-add the potentially converted createdAt from the existing currentUser state if needed
           const dataToStore = { ...updatedUserAccount, createdAt: currentUser.createdAt };
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
             <Skeleton className="h-6 w-3/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
             <div className="space-y-3">
                <Skeleton className="h-4 w-1/4" />
                 <div className="flex flex-wrap gap-4 justify-center">
                     {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}
                 </div>
             </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Edit Profile</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Update your name and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your name" {...field} className="pl-10" disabled={isLoading} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profile Picture Selection */}
              <FormField
                control={form.control}
                name="profilePictureUrl"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose Your Profile Picture</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4 justify-center"
                        disabled={isLoading}
                      >
                        {profilePictures.map((pic) => (
                          <FormItem key={pic.id} className="flex items-center space-x-3 space-y-0 cursor-pointer">
                             <FormControl>
                                <RadioGroupItem value={pic.url} id={pic.id} className="sr-only" />
                             </FormControl>
                             <FormLabel htmlFor={pic.id} className={cn(
                                "rounded-full overflow-hidden border-2 border-transparent transition-all",
                                field.value === pic.url && "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                              )}>
                                <Image
                                    src={pic.url}
                                    alt={pic.alt}
                                    width={64}
                                    height={64}
                                    className="rounded-full object-cover"
                                    data-ai-hint={pic.aiHint}
                                />
                             </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto" disabled={isLoading}>
                     <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                 </Button>
                 <Button type="submit" className="w-full sm:flex-1" disabled={isLoading}>
                     <Save className="mr-2 h-4 w-4" /> {isLoading ? 'Saving...' : 'Save Changes'}
                 </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
