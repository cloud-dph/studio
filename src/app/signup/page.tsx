
'use client';

import * as React from 'react';
import Image from 'next/image'; // Import Next Image
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { Phone, Lock, User, CheckCircle } from 'lucide-react'; // Added CheckCircle
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { UserAccount } from '@/types/user';
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi, // Import CarouselApi type
} from "@/components/ui/carousel"; // Import Carousel components

// Define available profile pictures (use same list as edit profile)
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


// Signup function to save user account to Firestore
const signupUser = async (data: z.infer<typeof FormSchema>): Promise<{ success: boolean; message?: string; userAccount?: Omit<UserAccount, 'password'> }> => {
  try {
    const userDocRef = doc(db, 'users', data.mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: false, message: "Mobile number already registered." };
    }

    // Prepare user account data for Firestore
    const userAccountData: UserAccount = {
      mobile: data.mobile,
      password: data.password, // INSECURE - HASH IN PRODUCTION
      name: data.name.trim(),
      profilePictureUrl: data.profilePictureUrl, // Add profile picture URL
      createdAt: Timestamp.now(),
    };

    await setDoc(userDocRef, userAccountData);
    console.log("User signed up and data saved to Firestore:", userAccountData.mobile);

    // Prepare data to return to client (and store in localStorage) - excluding password
    const { password: _, createdAt, ...accountBase } = userAccountData;
    const accountForClient: Omit<UserAccount, 'password'> = {
        ...accountBase,
        createdAt: createdAt.toDate(), // Convert Timestamp to Date for localStorage
    };

    return { success: true, userAccount: accountForClient };

  } catch (error) {
    console.error("Error signing up user in Firestore:", error);
    return { success: false, message: "Signup failed due to a server error." };
  }
};


const FormSchema = z.object({
  profilePictureUrl: z.string().url({ message: "Please select a profile picture." }),
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }).max(50, {message: 'Name cannot exceed 50 characters.'}),
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>() // State for carousel API

  // Check if user is already logged in
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      let isLoggedIn = false;
      if (storedData) {
         try {
            const parsedData = JSON.parse(storedData);
            if (parsedData && parsedData.mobile) {
               isLoggedIn = true;
            } else {
               localStorage.removeItem('userAccount');
            }
         } catch (e) {
            console.error("Error parsing user account data on signup page", e);
            localStorage.removeItem('userAccount');
         }
      }

       if (isLoggedIn) {
            window.location.href = 'http://abc.xyz';
       } else {
         setIsCheckingAuth(false);
       }
    }
  }, [router]);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      profilePictureUrl: profilePictures[10].url, // Default to the smiley face
      name: '',
      mobile: initialMobile,
      password: '',
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

   // Scroll carousel to default value on mount
   React.useEffect(() => {
      if (carouselApi) {
         const initialIndex = profilePictures.findIndex(p => p.url === form.getValues('profilePictureUrl'));
         if (initialIndex !== -1) {
             carouselApi.scrollTo(initialIndex, true); // Instantly scroll
         }
      }
   }, [carouselApi, form]);


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);

    try {
        const { success, message, userAccount } = await signupUser(data);

        if (success && userAccount) {
            toast({
                title: "Signup Successful",
                description: "Redirecting...",
            });
             if (typeof window !== 'undefined') {
               // Store createdAt as ISO string for consistency
               const dataToStore = { ...userAccount, createdAt: userAccount.createdAt instanceof Date ? userAccount.createdAt.toISOString() : userAccount.createdAt };
               localStorage.setItem('userAccount', JSON.stringify(dataToStore));
               localStorage.removeItem('pendingMobile');
               window.location.href = 'http://abc.xyz';
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

  if (isCheckingAuth) {
      return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-background p-4 pt-12 md:pt-16">
       <h1 className="text-3xl font-bold mb-10 md:mb-16 text-center">Create Account</h1>
       <Form {...form}>
         <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center space-y-8 md:space-y-12">

           {/* Profile Picture Carousel - Similar style to Edit Profile */}
           <FormField
              control={form.control}
              name="profilePictureUrl"
              render={({ field }) => (
                <FormItem className="w-full max-w-xl flex flex-col items-center">
                  <FormControl>
                    <Carousel
                      setApi={setCarouselApi}
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
                                    if (carouselApi) carouselApi.scrollTo(index);
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
                                tabIndex={0}
                             >
                                <Image
                                    src={pic.url}
                                    alt={pic.alt}
                                    width={80}
                                    height={80}
                                    className={cn(
                                        "rounded-full object-cover mx-auto transition-transform duration-300 ease-in-out",
                                        field.value === pic.url ? "scale-110 border-2 border-primary" : "opacity-70 scale-90 hover:opacity-100"
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


            {/* Profile Name Input - Similar style to Edit Profile */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full max-w-xs">
                  <FormLabel className="text-muted-foreground">Profile Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter profile name"
                        {...field}
                        className="text-center text-lg h-12"
                        disabled={isLoading}/>
                       <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
                                !field.value && "hidden"
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

           {/* Mobile and Password Inputs - Kept smaller, below Name */}
            <div className="w-full max-w-xs space-y-4">
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
                            placeholder="Enter 10-digit mobile"
                            className="pl-10 h-10" // Standard height
                            {...field}
                            disabled={isLoading || !!initialMobile || !!(typeof window !== 'undefined' && localStorage.getItem('pendingMobile'))}
                            />
                        </div>
                        </FormControl>
                        <FormMessage />
                         { (initialMobile || (typeof window !== 'undefined' && localStorage.getItem('pendingMobile'))) &&
                           <FormDescription className="text-xs">Mobile number provided from previous step.</FormDescription>
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
                            placeholder="Create password (min. 6 chars)"
                            className="pl-10 h-10" // Standard height
                            {...field}
                            disabled={isLoading}
                            />
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>


            <Button type="submit" className="w-full max-w-xs h-12 text-lg" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-sm">
                <Button variant="link" onClick={() => router.push('/login')} className="text-primary" disabled={isLoading}>
                Already have an account? Log In
                </Button>
            </div>
         </form>
       </Form>
    </div>
  );
}
