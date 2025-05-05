
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from '@/components/ui/card'; // Alias to avoid naming conflict
import { Phone, Lock, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import type { UserAccount, Profile } from '@/types/user'; // Import shared types

// Default placeholder avatar URL
const defaultAvatarUrl = 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/19.png';
const defaultAvatarName = 'Default Avatar';

// Signup function to save user account with a single initial profile to Firestore
const signupUser = async (data: z.infer<typeof FormSchema>): Promise<{ success: boolean; message?: string; userAccount?: Omit<UserAccount, 'password'> }> => {
  try {
    const userDocRef = doc(db, 'users', data.mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return { success: false, message: "Mobile number already registered." };
    }

    // Create the first (and only) user profile
    const initialProfile: Profile = {
        id: uuidv4(), // Generate unique ID
        name: data.name.trim(),
        profileImageUrl: defaultAvatarUrl, // Use default avatar
        profileImageName: defaultAvatarName,
    };

    // Prepare user account data for Firestore
    const userAccountData: UserAccount = {
      mobile: data.mobile,
      password: data.password, // INSECURE - HASH IN PRODUCTION
      profiles: [initialProfile], // Store only the single profile
      createdAt: Timestamp.now(), // Use Firestore Timestamp for server-side timestamp
    };

    await setDoc(userDocRef, userAccountData);
    console.log("User signed up and data saved to Firestore:", userAccountData.mobile);

    // Prepare data to return to client (and store in localStorage) - excluding password
    // Convert Firestore Timestamp to Date for client-side consistency if needed, or keep as is
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
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }).max(20, {message: 'Name cannot exceed 20 characters.'}),
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  // profileImage field removed
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
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
            }
         } catch (e) {
            console.error("Error parsing user account data on signup page", e);
            localStorage.removeItem('userAccount');
         }
      }

       if (isLoggedIn) {
            // User is logged in, redirect straight to content
            window.location.href = 'http://abc.xyz';
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
      // profileImage default removed
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


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);

    try {
        // Pass validated form data to signup function
        const { success, message, userAccount } = await signupUser(data);

        if (success && userAccount) {
            toast({
                title: "Signup Successful",
                description: "Your account has been created.",
            });
            // Store user account data (without password) in localStorage
             if (typeof window !== 'undefined') {
               localStorage.setItem('userAccount', JSON.stringify(userAccount));
               localStorage.removeItem('pendingMobile'); // Clean up temp storage

               // Redirect straight to content after successful signup
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

   // Show loading indicator while checking auth status or redirecting
  if (isCheckingAuth) {
      return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg"> {/* Adjusted max-width */}
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
           <CardDescriptionComponent className="text-center text-muted-foreground">
            Fill in your details to get started.
          </CardDescriptionComponent>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Selection Removed */}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
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

