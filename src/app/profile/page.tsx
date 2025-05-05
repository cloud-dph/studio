'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area'; // Kept for potential future use
import { useToast } from '@/hooks/use-toast';
// Removed Code icon and related code fetching logic

interface UserData {
  name: string;
  mobile: string;
  profileImageUrl: string;
  profileImageName: string;
}

// Removed getFileContent and codeFiles


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); // Added loading state

  React.useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        try {
           const parsedData = JSON.parse(storedData);
           // Basic validation of expected fields
           if (parsedData && parsedData.name && parsedData.mobile && parsedData.profileImageUrl) {
             setUserData(parsedData);
           } else {
             throw new Error("Incomplete user data found.");
           }
        } catch (e) {
             console.error("Failed to parse or validate user data from localStorage", e);
             toast({
                title: "Session Error",
                description: "Could not load user data. Please log in again.",
                variant: "destructive",
            });
             localStorage.removeItem('userData'); // Clear invalid data
             router.push('/login');
        }
      } else {
        toast({
          title: "Not Logged In",
          description: "Please log in or sign up to view your profile.",
          variant: "destructive",
        });
        router.push('/login');
      }
       setIsLoading(false); // Mark loading as complete
    }
  }, [router, toast]);

  // Removed useEffect for fetching code


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        localStorage.removeItem('pendingMobile'); // Clean up any pending mobile state
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    }
  };


  if (isLoading || !userData) {
    // Render loading state while checking localStorage or if data is missing
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="w-full shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
           <div className="flex flex-col sm:flex-row items-center gap-4">
             <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={userData.profileImageUrl} alt={userData.profileImageName || 'User Avatar'} data-ai-hint="user avatar"/>
                <AvatarFallback>{userData.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
             <div className="text-center sm:text-left">
                <CardTitle className="text-3xl font-bold">{userData.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                    Mobile: {userData.mobile}
                </CardDescription>
            </div>
            <Button onClick={handleLogout} variant="outline" className="mt-4 sm:mt-0 sm:ml-auto">
                Logout
            </Button>
           </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mt-6">
             <h3 className="text-xl font-semibold mb-4">
              Profile Details
            </h3>
             <Separator className="mb-4" />
             <p>Welcome to your profile page, {userData.name}!</p>
             {/* Add more profile details or sections here as needed */}

             {/* Code snippets section removed */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
