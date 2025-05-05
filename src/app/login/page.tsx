
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Use Next.js router
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions

// Check if user account exists in Firestore
const checkUserExists = async (mobile: string): Promise<boolean> => {
  try {
    const userDocRef = doc(db, 'users', mobile); // Use mobile number as document ID
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists();
  } catch (error) {
    console.error("Error checking user existence in Firestore:", error);
    // Handle error appropriately, maybe re-throw or return false
    throw new Error("Failed to check user existence.");
  }
};


const FormSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
});

export default function LoginPage() {
  const router = useRouter(); // Use Next.js router
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true); // State to manage auth check

  // Check if user is already logged in (has an account stored)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount'); // Check for userAccount
      let isLoggedIn = false;
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Basic validation
          if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles)) {
            isLoggedIn = true;
          } else {
            localStorage.removeItem('userAccount'); // Clear invalid data
          }
        } catch (e) {
          console.error("Error parsing user account data on login page", e);
          localStorage.removeItem('userAccount'); // Clear corrupted data
        }
      }

      if (isLoggedIn) {
        // User is logged in, redirect straight to content
        window.location.href = 'http://abc.xyz';
      } else {
        setIsCheckingAuth(false); // Finished checking, user is not logged in, allow form rendering
      }
    }
  }, [router]); // Add router to dependency array


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mobile: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      // Store mobile number temporarily for other pages
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingMobile', data.mobile);
      }

      const userExists = await checkUserExists(data.mobile);
      if (userExists) {
        // Use router for internal navigation to password page
        router.push(`/login/password?mobile=${data.mobile}`);
      } else {
        // Use router for internal navigation to signup page
        router.push(`/signup?mobile=${data.mobile}`);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not verify mobile number. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      // Clear temporary mobile number on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingMobile');
      }
    }
    // No need to setIsLoading(false) here as navigation occurs
  }

  // Show loading indicator while checking auth status or redirecting
  if (isCheckingAuth) {
      return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login or Sign Up</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

