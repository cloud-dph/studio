
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Edit } from 'lucide-react';
import type { UserAccount } from '@/types/user';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Omit password and potentially sensitive fields for profile display
type ProfileData = Omit<UserAccount, 'password' | 'createdAt'> & {
    createdAt?: Date | string; // Allow for processed date
};


export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount');
      if (storedData) {
        try {
          const parsedData: UserAccount = JSON.parse(storedData);
           // Basic validation
          if (parsedData && parsedData.mobile && parsedData.name && parsedData.profilePictureUrl) {
             // Convert createdAt if it's a string or Timestamp format from potential storage variations
             let displayCreatedAt: string | undefined;
             if (parsedData.createdAt) {
                 try {
                    const date = new Date(parsedData.createdAt instanceof Timestamp ? parsedData.createdAt.toDate() : parsedData.createdAt);
                    displayCreatedAt = date.toLocaleDateString();
                 } catch (dateError) {
                    console.warn("Could not parse createdAt date:", dateError);
                 }
             }

             const profileData: ProfileData = {
                mobile: parsedData.mobile,
                name: parsedData.name,
                profilePictureUrl: parsedData.profilePictureUrl,
                // createdAt is optional in ProfileData, only set if valid
                ...(displayCreatedAt && { createdAt: displayCreatedAt }),
             };
            setProfile(profileData);
            setIsLoading(false); // Data loaded, stop loading
          } else {
            // Invalid or incomplete data, clear and redirect
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
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userAccount');
      localStorage.removeItem('pendingMobile'); // Clean up potential leftovers
      router.push('/login'); // Redirect to login after logout
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit'); // Navigate to edit profile page
  };


  if (isLoading) {
    // Show skeleton loaders while fetching data
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-10 w-full max-w-xs" />
            </CardContent>
        </Card>
        </div>
    );
  }

  if (!profile) {
    // Should ideally be handled by redirect, but added as fallback
    return <div className="flex min-h-screen items-center justify-center">Redirecting to login...</div>;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       <Card className="w-full max-w-md shadow-lg">
         <CardHeader className="items-center text-center">
           <Avatar className="h-24 w-24 mb-4">
             <AvatarImage src={profile.profilePictureUrl} alt={profile.name} data-ai-hint="profile picture" />
             <AvatarFallback>
               <UserIcon className="h-12 w-12" />
             </AvatarFallback>
           </Avatar>
           <CardTitle className="text-2xl font-bold">{profile.name}</CardTitle>
           <CardDescription>{profile.mobile}</CardDescription>
           {profile.createdAt && (
              <CardDescription className="text-xs text-muted-foreground mt-1">
                 Member since: {profile.createdAt}
              </CardDescription>
           )}
         </CardHeader>
         <CardContent className="flex flex-col items-center space-y-4">
            {/* Add more profile details here if needed */}
            {/* <p>Subscription: Premium</p> */}

           <Button onClick={handleEditProfile} variant="outline" className="w-full max-w-xs">
               <Edit className="mr-2 h-4 w-4" /> Edit Profile
           </Button>
           <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs">
             <LogOut className="mr-2 h-4 w-4" /> Logout
           </Button>
         </CardContent>
       </Card>
    </div>
  );
}
