
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import type { UserAccount, Profile } from '@/types/user';

export default function ProfilePage() {
  const router = useRouter();
  const [userAccount, setUserAccount] = React.useState<Omit<UserAccount, 'password'> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      if (storedData) {
        try {
          const parsedData: Omit<UserAccount, 'password'> = JSON.parse(storedData);
          // Basic validation
          if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles) && parsedData.profiles.length > 0) {
            setUserAccount(parsedData);
          } else {
            // Invalid data, redirect to login
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
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userAccount');
      localStorage.removeItem('pendingMobile'); // Clean up any potential leftovers
      router.push('/login'); // Redirect to login after logout
    }
  };

  if (isLoading || !userAccount) {
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  // Assuming the first profile is the main user profile
  const mainProfile: Profile | undefined = userAccount.profiles[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
             <AvatarImage src={mainProfile?.profileImageUrl} alt={mainProfile?.profileImageName} data-ai-hint="user avatar" />
            <AvatarFallback>
               <UserIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-bold">{mainProfile?.name || 'User Profile'}</CardTitle>
          <CardDescription>Mobile: {userAccount.mobile}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p>Welcome to your profile!</p>
          {/* Add more profile details or settings here if needed */}
          <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
