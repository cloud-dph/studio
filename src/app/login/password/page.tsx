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

// Mock authentication function - replace with actual API call
const authenticateUser = async (mobile: string, password: string): Promise<boolean> => {
   // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Simple check (e.g., password is 'password123')
  return password === 'password123';
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

  // Redirect if mobile number is missing
  React.useEffect(() => {
    if (!mobile) {
      toast({
        title: "Error",
        description: "Mobile number not provided.",
        variant: "destructive",
      });
      router.push('/login');
    }
  }, [mobile, router, toast]);


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
        const isAuthenticated = await authenticateUser(mobile, data.password);

        if (isAuthenticated) {
             // Store user session info if needed (e.g., localStorage, context)
             // For now, just redirecting
             window.location.href = 'http://abc.xyz'; // External redirect
        } else {
             toast({
                title: "Login Failed",
                description: "Incorrect password. Please try again.",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    } catch (error) {
        console.error("Authentication error:", error);
         toast({
            title: "Error",
            description: "An error occurred during login. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  if (!mobile) {
    // Render nothing or a loading indicator while redirecting
    return null;
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
            <Button variant="link" onClick={() => router.push(`/signup?mobile=${mobile}`)} className="text-primary">
              Don't have an account? Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
