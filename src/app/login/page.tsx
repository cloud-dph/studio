'use client';

import * as React from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Mock check if user exists - replace with actual API call
const checkUserExists = async (mobile: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Simple check (e.g., if mobile number ends with '123')
  return mobile.endsWith('123');
};


const FormSchema = z.object({
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mobile: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    try {
      const userExists = await checkUserExists(data.mobile);
      if (userExists) {
        router.push(`/login/password?mobile=${data.mobile}`);
      } else {
        router.push(`/signup?mobile=${data.mobile}`);
      }
    } catch (error) {
      console.error("Error checking user:", error);
      toast({
        title: "Error",
        description: "Could not verify mobile number. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // No need to setIsLoading(false) here as navigation occurs
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
