
'use client';

import * as React from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import type { UserAccount } from '@/types/user'; // Import shared types
import { analyzeLoginAttempt, type AnalyzeLoginOutput } from '@/ai/flows/analyze-login-flow'; // Import GenAI flow

// Authenticate user against Firestore data
const authenticateUser = async (mobile: string, password: string): Promise<{ success: boolean; userData?: Omit<UserAccount, 'password'> }> => {
  try {
    const userDocRef = doc(db, 'users', mobile);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const accountData = userDocSnap.data() as UserAccount; // Type cast
      // INSECURE COMPARISON - Replace with hash comparison in production
      if (accountData.password === password) {
        // Prepare data to return (excluding password)
        // Convert Timestamp to Date before storing if it exists
        const { password: _, createdAt, ...accountBase } = accountData;
        let userData: Omit<UserAccount, 'password'>;
        if (createdAt && typeof createdAt.toDate === 'function') {
          userData = { ...accountBase, createdAt: createdAt.toDate() };
        } else {
          // Handle case where createdAt might not be a Timestamp (e.g., already a Date or undefined)
          userData = { ...accountBase, createdAt: createdAt || new Date() };
        }
        return { success: true, userData };
      } else {
        return { success: false }; // Incorrect password
      }
    } else {
      return { success: false }; // User not found
    }
  } catch (error) {
    console.error("Error authenticating user from Firestore:", error);
    throw new Error("Authentication failed.");
  }
};

const FormSchema = z.object({
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function PasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mobile = searchParams.get('mobile');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true); // State to manage auth check

  // Check if user is already logged in
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount'); // Check for userAccount
      let isLoggedIn = false;
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles) && parsedData.profiles.length > 0) { // Validate structure
            isLoggedIn = true;
          } else {
            localStorage.removeItem('userAccount'); // Clear invalid data
          }
        } catch (e) {
          console.error("Error parsing user account data on password page", e);
          localStorage.removeItem('userAccount'); // Clear corrupted data
        }
      }

      if (isLoggedIn) {
        // User is logged in, redirect to profile page
         router.replace('/profile'); // Use internal routing
      } else {
        setIsCheckingAuth(false); // Finished checking, user is not logged in
      }
    }
  }, [router]);

  // Redirect if mobile number is missing
  React.useEffect(() => {
    // Only run this effect if auth check is done and user is not logged in
    if (!isCheckingAuth && !mobile && typeof window !== 'undefined') {
      const storedMobile = localStorage.getItem('pendingMobile');
      if (storedMobile) {
        router.replace(`/login/password?mobile=${storedMobile}`);
      } else {
        toast({
          title: "Error",
          description: "Mobile number not provided.",
          variant: "destructive",
        });
        router.push('/login');
      }
    }
  }, [isCheckingAuth, mobile, router, toast]);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!mobile) return; // Should not happen due to useEffect check
    setIsLoading(true);

    try {
      const { success, userData } = await authenticateUser(mobile, data.password);

      if (success && userData) {
        // Analyze login attempt using GenAI
        let analysisResult: AnalyzeLoginOutput | null = null;
        try {
          analysisResult = await analyzeLoginAttempt({
            mobile: mobile,
            timestamp: new Date().toISOString(),
            // In a real app, gather IP and User Agent here if possible
          });

          console.log("Login Analysis:", analysisResult);

          if (analysisResult.isSuspicious) {
            // Handle suspicious login - e.g., show warning, require MFA, log event
            toast({
              title: "Security Alert",
              description: `Potential suspicious activity detected: ${analysisResult.reason} (Score: ${analysisResult.riskScore.toFixed(2)})`,
              variant: "destructive", // Or a specific 'warning' variant if available
              duration: 7000, // Show for longer
            });
            // Decide if you want to block login or just warn
            // For now, we'll proceed but show the warning
          } else {
            toast({
              title: "Security Check",
              description: `Login analysis complete: ${analysisResult.reason}`,
              duration: 3000,
            });
          }

        } catch (analysisError) {
          console.error("Error analyzing login attempt:", analysisError);
          // Decide if failure to analyze should block login or just be logged
          toast({
            title: "Security Analysis Skipped",
            description: "Could not perform security analysis on this login attempt.",
            variant: "default", // Neutral variant
            duration: 5000,
          });
        }

        // Store user account info (excluding password)
        if (typeof window !== 'undefined') {
          localStorage.setItem('userAccount', JSON.stringify(userData));
          localStorage.removeItem('pendingMobile'); // Clean up temp storage

          // Redirect to profile page after successful login and analysis
          await new Promise(resolve => setTimeout(resolve, analysisResult?.isSuspicious ? 1500 : 500)); // Small delay if needed
          router.push('/profile'); // Use internal routing
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Incorrect mobile number or password. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // setIsLoading(false) might not be needed if redirect always happens
  }

  // Show loading indicator while checking auth status or redirecting
  if (isCheckingAuth) {
    return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }

  if (!mobile && !isCheckingAuth) {
    // Render loading or minimal content while redirecting due to missing mobile
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Enter Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            For mobile number: {mobile}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          placeholder="Enter your password"
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
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => router.push(`/login`)} className="text-primary">
              Use a different mobile number?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
