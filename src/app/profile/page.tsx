
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
// Removed unused ScrollArea import
import { useToast } from '@/hooks/use-toast';
import { Pencil, LogOut } from 'lucide-react'; // Import LogOut icon

interface UserData {
  name: string;
  mobile: string;
  profileImageUrl: string;
  profileImageName: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); // Track loading state

  // Effect to load user data from localStorage on component mount or update
  React.useEffect(() => {
    let isMounted = true; // Flag to handle async operations after unmount

    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        setIsLoading(true); // Start loading
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            // Validate the structure of the parsed data
            if (parsedData && parsedData.name && parsedData.mobile && parsedData.profileImageUrl && parsedData.profileImageName) {
               if (isMounted) setUserData(parsedData);
            } else {
              console.error("Incomplete user data found in localStorage.");
              throw new Error("Incomplete user data found.");
            }
          } catch (e) {
            console.error("Failed to parse or validate user data from localStorage", e);
             if (isMounted) {
                 toast({
                    title: "Session Error",
                    description: "Could not load user data. Please log in again.",
                    variant: "destructive",
                 });
                localStorage.removeItem('userData'); // Clear invalid data
                router.push('/login');
             }
          } finally {
             if (isMounted) setIsLoading(false); // End loading after processing
          }
        } else {
           // No user data found in localStorage
           if (isMounted) {
            toast({
              title: "Not Logged In",
              description: "Please log in or sign up to view your profile.",
              variant: "destructive",
            });
            router.push('/login');
            // No need to set isLoading(false) here as redirection will happen
          }
        }
      } else {
         // Should not happen in a browser environment, but handle defensively
         if (isMounted) setIsLoading(false);
      }
    };

    loadUserData();

    // Listen for storage changes to potentially update profile if edited in another tab
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'userData') {
            console.log("Detected localStorage change for userData, reloading profile...");
            loadUserData(); // Reload data if 'userData' changes
        }
    };
    window.addEventListener('storage', handleStorageChange);


    // Cleanup function
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, toast]); // Dependencies: router and toast


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        localStorage.removeItem('pendingMobile'); // Clean up any pending mobile state
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    }
  };


  if (isLoading) {
    // Render a loading indicator while fetching/validating data
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  if (!userData) {
    // This state should ideally be brief as the useEffect handles redirection
    // but provides a fallback UI just in case.
     return <div className="flex min-h-screen items-center justify-center">No profile data available. Redirecting...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="w-full shadow-lg overflow-hidden rounded-lg border border-border">
        <CardHeader className="bg-card p-6 border-b border-border">
           <div className="flex flex-col sm:flex-row items-center gap-4">
             <Avatar className="h-20 w-20 border-2 border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={userData.profileImageUrl} alt={userData.profileImageName || 'User Avatar'} data-ai-hint="user avatar"/>
                <AvatarFallback className="text-2xl font-semibold">
                    {userData.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
             <div className="text-center sm:text-left flex-grow">
                <CardTitle className="text-3xl font-bold text-foreground">{userData.name}</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                    Mobile: {userData.mobile}
                </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:ml-auto gap-2 mt-4 sm:mt-0">
                 <Button variant="outline" onClick={() => router.push('/profile/edit')}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
                <Button onClick={handleLogout} variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                   <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </div>
           </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mt-2"> {/* Reduced top margin */}
             <h3 className="text-xl font-semibold mb-3 text-foreground"> {/* Adjusted margin */}
              Welcome Back!
            </h3>
             <Separator className="mb-4" />
             <p className="text-foreground/90">This is your profile page, {userData.name}. You can edit your details or log out.</p>
             {/* Add more profile details or sections here as needed */}
             {/* Example:
             <div className="mt-6">
                <h4 className="font-medium text-foreground">Account Details</h4>
                <p className="text-muted-foreground text-sm">Created: [Show creation date if available]</p>
             </div>
             */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
