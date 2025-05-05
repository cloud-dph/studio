
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Phone, Lock, User, Baby } from 'lucide-react'; // Import Baby icon for Kids profile
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { profileImages, kidsProfileImage } from '@/config/profileImages'; // Import from config
import type { UserAccount, Profile } from '@/types/user'; // Import shared types

// Signup function to save user account with initial profiles to Firestore
const signupUser = async (data: z.infer<typeof FormSchema>, selectedImageData: { url: string, name: string }): Promise<{ success: boolean; message?: string; userAccount?: Omit<UserAccount, 'password'> }> => {
  try {
    const userDocRef = doc(db, 'users', data.mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: false, message: "Mobile number already registered." };
    }

    // Create the first user profile
    const initialProfile: Profile = {
        id: uuidv4(), // Generate unique ID
        name: data.name.trim(),
        profileImageUrl: selectedImageData.url,
        profileImageName: selectedImageData.name,
    };

    // Create the default Kids profile
    const kidsProfile: Profile = {
        id: 'kids', // Fixed ID for Kids profile
        name: 'Kids',
        profileImageUrl: kidsProfileImage.url, // Use the specific Kids avatar URL
        profileImageName: kidsProfileImage.name,
    };

    // Prepare user account data for Firestore
    const userAccountData: UserAccount = {
      mobile: data.mobile,
      password: data.password, // INSECURE - HASH IN PRODUCTION
      profiles: [initialProfile, kidsProfile], // Add both profiles
      createdAt: Timestamp.now(), // Use Firestore Timestamp for server-side timestamp
    };

    await setDoc(userDocRef, userAccountData);
    console.log("User signed up and data saved to Firestore:", userAccountData.mobile);

    // Prepare data to return to client (and store in localStorage) - excluding password
    const { password: _, ...accountForClient } = userAccountData;
    return { success: true, userAccount: accountForClient };

  } catch (error) {
    console.error("Error signing up user in Firestore:", error);
    return { success: false, message: "Signup failed due to a server error." };
  }
};


const FormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }).max(20, {message: 'Name cannot exceed 20 characters.'}),
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }), // Represents selected image URL
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = React.useState<string | null>(profileImages[0]?.url || null); // Default to first image URL
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Check if user is already logged in
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      let isLoggedIn = false;
      if (storedData) {
         try {
            const parsedData = JSON.parse(storedData);
            if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles)) {
               isLoggedIn = true;
            } else {
               localStorage.removeItem('userAccount');
               localStorage.removeItem('selectedProfile');
            }
         } catch (e) {
            console.error("Error parsing user account data on signup page", e);
            localStorage.removeItem('userAccount');
            localStorage.removeItem('selectedProfile');
         }
      }

       if (isLoggedIn) {
            // User is logged in, redirect to profile selection
            router.push('/profile');
       } else {
         setIsCheckingAuth(false); // Finished checking, user is not logged in
       }
    }
  }, [router]);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      mobile: initialMobile,
      password: '',
      profileImage: selectedImageUrl || '', // Use state for default
    },
  });

   // Update mobile in form if query param changes or from localStorage
  React.useEffect(() => {
    let mobileToSet = initialMobile;
    if (!mobileToSet && typeof window !== 'undefined') {
      const storedMobile = localStorage.getItem('pendingMobile');
      if (storedMobile) {
          mobileToSet = storedMobile;
      }
    }
    if (mobileToSet) {
       form.setValue('mobile', mobileToSet, { shouldValidate: true });
    }
  }, [initialMobile, form]);

  React.useEffect(() => {
     form.register('profileImage'); // Ensure profileImage is registered
     // Set initial selected image URL if not already set
     if (!selectedImageUrl && profileImages.length > 0) {
         handleImageSelect(profileImages[0].url);
     }
  }, [form, selectedImageUrl]); // Added selectedImageUrl


  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    form.setValue('profileImage', imageUrl, { shouldValidate: true });
    form.clearErrors('profileImage');
  };


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!selectedImageUrl) {
        form.setError('profileImage', { type: 'manual', message: 'Please select a profile image.' });
        return;
    }

    setIsLoading(true);

    const selectedImageData = profileImages.find(img => img.url === selectedImageUrl);
    if (!selectedImageData) {
        toast({ title: "Error", description: "Selected profile image not found.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        // Pass validated form data and selected image data to signup function
        const { success, message, userAccount } = await signupUser(data, selectedImageData);

        if (success && userAccount) {
            toast({
                title: "Signup Successful",
                description: "Your account has been created.",
            });
            // Store user account data (without password) in localStorage
             if (typeof window !== 'undefined') {
               localStorage.setItem('userAccount', JSON.stringify(userAccount));
               localStorage.removeItem('pendingMobile'); // Clean up temp storage
               localStorage.removeItem('selectedProfile'); // Ensure no selected profile initially

               // Redirect to profile selection page after successful signup
               router.push('/profile');
             }
        } else {
             toast({
                title: "Signup Failed",
                description: message || "Could not create account. Please try again.",
                variant: "destructive",
            });
             setIsLoading(false);
        }
    } catch (error) {
         console.error("Signup error:", error);
         toast({
            title: "Error",
            description: "An error occurred during signup. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

   // Show loading indicator while checking auth status or redirecting
  if (isCheckingAuth) {
      return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
           <CardDescription className="text-center text-muted-foreground">
            Choose your first profile picture and fill in your details.
          </CardDescription>
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
                    <FormLabel>Your Name (for first profile)</FormLabel>
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

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter your 10-digit mobile number"
                          className="pl-10"
                          {...field}
                          // Disable if mobile is pre-filled
                          disabled={isLoading || !!initialMobile || !!(typeof window !== 'undefined' && localStorage.getItem('pendingMobile'))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                     { (initialMobile || (typeof window !== 'undefined' && localStorage.getItem('pendingMobile'))) &&
                       <FormDescription>Mobile number provided from previous step.</FormDescription>
                     }
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Create a password (min. 6 characters)"
                          className="pl-10"
                          {...field}
                           disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => router.push('/login')} className="text-primary">
              Already have an account? Log In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

