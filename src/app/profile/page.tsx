
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import type { UserAccount } from '@/types/user'; // Keep UserAccount type

export default function ProfilePage() {
  const router = useRouter();
  // No need to store userAccount state if we redirect immediately
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      if (storedData) {
        try {
          const parsedData: Omit<UserAccount, 'password'> = JSON.parse(storedData);
          // Basic validation
          if (parsedData && parsedData.mobile) {
            // User is logged in, redirect immediately
            window.location.href = 'http://abc.xyz';
            // Keep loading true to prevent rendering anything before redirect
            return;
          } else {
            // Invalid data, clear and redirect to login
            localStorage.removeItem('userAccount');
            router.replace('/login');
          }
        } catch (e) {
          console.error("Error parsing user account data on profile page", e);
          localStorage.removeItem('userAccount');
          router.replace('/login');
        }
      } else {
        // No stored data, redirect to login
        router.replace('/login');
      }
      setIsLoading(false); // Set loading false only if not redirecting externally
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userAccount');
      localStorage.removeItem('pendingMobile'); // Clean up any potential leftovers
      router.push('/login'); // Redirect to login after logout
    }
  };

  // Show loading state while checking session or redirecting
  // This component might not render if the user is logged in due to immediate redirect
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  // This part might only be reached briefly if the redirect fails or if localStorage is cleared manually
  // Kept minimal structure for completeness, but ideally the redirect handles everything.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
            {/* Minimal fallback content */}
           <Avatar className="h-24 w-24 mb-4">
             <AvatarFallback>
               <UserIcon className="h-12 w-12" />
             </AvatarFallback>
           </Avatar>
           <CardTitle className="text-2xl font-bold">Profile</CardTitle>
           <CardDescription>Please login again.</CardDescription>
         </CardHeader>
         <CardContent className="flex flex-col items-center space-y-4">
           <p>Your session may have expired.</p>
           <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs">
             <LogOut className="mr-2 h-4 w-4" /> Logout & Login
           </Button>
         </CardContent>
       </Card>
    </div>
  );
}
