
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Keep for internal routing
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
import { Phone, Lock, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase'; // Import Firestore instance
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Import Firestore functions

const profileImages = [
  { id: '1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/21.png', name: 'Avatar 1' },
  { id: '2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/2.png', name: 'Avatar 2' },
  { id: '3', url: 'https://picsum.photos/200/200?random=1', name: 'Avatar 3', aiHint: 'abstract pattern' }, // Placeholder
  { id: '4', url: 'https://picsum.photos/200/200?random=2', name: 'Avatar 4', aiHint: 'nature landscape' }, // Placeholder
  { id: '5', url: 'https://picsum.photos/200/200?random=3', name: 'Avatar 5', aiHint: 'geometric shapes' }, // Placeholder
];

// Signup function to save user data to Firestore
// WARNING: Storing plain text passwords is highly insecure!
// In a real application, you MUST hash passwords securely (e.g., using bcrypt) before storing.
const signupUser = async (data: any): Promise<{ success: boolean; message?: string; userData?: any }> => {
  try {
    const userDocRef = doc(db, 'users', data.mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: false, message: "Mobile number already registered." };
    }

    // Prepare data for Firestore (excluding profileImage ID, storing URL and name)
    const userDataToSave = {
      name: data.name,
      mobile: data.mobile,
      password: data.password, // INSECURE - HASH IN PRODUCTION
      profileImageUrl: data.profileImageUrl,
      profileImageName: data.profileImageName,
      createdAt: new Date(), // Add a timestamp
    };

    await setDoc(userDocRef, userDataToSave);
    console.log("User signed up and data saved to Firestore:", userDataToSave);

    // Don't return password to client
    const { password: _, ...userDataForClient } = userDataToSave;
    return { success: true, userData: userDataForClient };

  } catch (error) {
    console.error("Error signing up user in Firestore:", error);
    return { success: false, message: "Signup failed due to a server error." };
  }
};


const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }),
});

export default function SignupPage() {
  const router = useRouter(); // Keep for internal routing (e.g., back to login)
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true); // State to manage auth check

  // Check if user is already logged in
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userData');
      let isLoggedIn = false;
      if (storedData) {
         try {
            const parsedData = JSON.parse(storedData);
            if (parsedData && parsedData.mobile) {
               isLoggedIn = true;
            } else {
               localStorage.removeItem('userData'); // Clear invalid data
            }
         } catch (e) {
            console.error("Error parsing user data on signup page", e);
            localStorage.removeItem('userData'); // Clear corrupted data
         }
      }

       if (isLoggedIn) {
            // User is logged in, redirect to the external site
            window.location.href = 'http://abc.xyz';
       } else {
         setIsCheckingAuth(false); // Finished checking, user is not logged in, allow form rendering
       }
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      mobile: initialMobile,
      password: '',
      profileImage: '',
    },
  });

   // Update mobile in form if query param changes
  React.useEffect(() => {
    let mobileToSet = initialMobile;
    // Also check local storage if query param is missing
    if (!mobileToSet && typeof window !== 'undefined') {
      const storedMobile = localStorage.getItem('pendingMobile');
      if (storedMobile) {
          mobileToSet = storedMobile;
      }
    }
    if (mobileToSet) {
       form.setValue('mobile', mobileToSet);
    }
  }, [initialMobile, form]); // Rerun if initialMobile changes or form instance is new

  React.useEffect(() => {
     form.register('profileImage'); // Ensure profileImage is registered
  }, [form]);


  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    form.setValue('profileImage', imageId, { shouldValidate: true });
     form.clearErrors('profileImage'); // Clear error when selected
  };


  async function onSubmit(data: z.infer<typeof FormSchema>) {
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

    const signupData = {
        ...data,
        profileImageUrl: selectedImageData.url, // Send the URL
        profileImageName: selectedImageData.name, // Send the name
    };


    try {
        const { success, message, userData } = await signupUser(signupData);
        if (success && userData) {
            toast({
                title: "Signup Successful",
                description: "Your account has been created.",
            });
            // Store user data in localStorage
             if (typeof window !== 'undefined') {
               localStorage.setItem('userData', JSON.stringify(userData));
               localStorage.removeItem('pendingMobile'); // Clean up temp storage
               // Redirect to external site after successful signup
               window.location.href = 'http://abc.xyz';
             }
            // router.push('/profile'); // Replaced with external redirect
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
     // setIsLoading(false) handled in failure cases; success redirects
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
            Choose a profile picture and fill in your details.
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
                      opts={{
                        align: "start",
                        loop: false, // Don't loop for selection
                      }}
                      className="w-full max-w-xs"
                    >
                      <CarouselContent>
                        {profileImages.map((image) => (
                          <CarouselItem key={image.id} className="basis-1/3 md:basis-1/3">
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
                          // Disable if mobile is pre-filled from previous step (query param or localStorage)
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
