'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Pencil, LogOut, Plus, Baby } from 'lucide-react'; // Import Plus and Baby icons

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
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        setIsLoading(true);
        const storedData = localStorage.getItem('userData');
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
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
                localStorage.removeItem('userData');
                router.push('/login');
             }
          } finally {
             if (isMounted) setIsLoading(false);
          }
        } else {
           if (isMounted) {
            toast({
              title: "Not Logged In",
              description: "Please log in or sign up to view your profile.",
              variant: "destructive",
            });
            router.push('/login');
          }
        }
      } else {
         if (isMounted) setIsLoading(false);
      }
    };

    loadUserData();

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'userData') {
            console.log("Detected localStorage change for userData, reloading profile...");
            loadUserData();
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, toast]);


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        localStorage.removeItem('pendingMobile');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    }
  };

  const handleKidsProfileClick = () => {
    if (typeof window !== 'undefined') {
        window.location.href = 'http://coco.com';
    }
  }

  const handleAddProfileClick = () => {
     // Placeholder for future add profile functionality
     toast({ title: "Info", description: "Add profile functionality not yet implemented." });
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  if (!userData) {
     return <div className="flex min-h-screen items-center justify-center">No profile data available. Redirecting...</div>;
  }

  // Truncate long names for display under avatars
  const truncateName = (name: string, maxLength = 8) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };


  return (
    <div className="container mx-auto max-w-4xl py-8 px-4"> {/* Reduced top padding */}
      {/* Top Section: User Info and Actions */}
      <Card className="w-full shadow-md overflow-hidden rounded-lg border border-border mb-8">
        <CardHeader className="bg-card p-4 sm:p-6 border-b border-border">
           <div className="flex flex-col sm:flex-row items-center gap-4">
             {/* Main User Avatar */}
             <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarImage src={userData.profileImageUrl} alt={userData.profileImageName || 'User Avatar'} data-ai-hint="user avatar"/>
                <AvatarFallback className="text-xl sm:text-2xl font-semibold">
                    {userData.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
             <div className="text-center sm:text-left flex-grow">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">{userData.name}</CardTitle>
                <CardDescription className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Mobile: {userData.mobile}
                </CardDescription>
            </div>
            {/* Action Buttons */}
            <div className="flex flex-row sm:flex-col md:flex-row gap-2 mt-4 sm:mt-0 sm:ml-auto">
                 <Button variant="outline" size="sm" onClick={() => router.push('/profile/edit')}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Profile
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                   <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
                </Button>
            </div>
           </div>
        </CardHeader>
        {/* Can add subscription details or other info in CardContent if needed */}
        {/* <CardContent className="p-4 sm:p-6">
           <p className="text-sm text-muted-foreground">Additional account details...</p>
        </CardContent> */}
      </Card>

      {/* Profiles Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Profiles</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/profile/edit')}> {/* Reuse edit profile link */}
                 <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6">
            {/* Current User Profile */}
            <div className="flex flex-col items-center text-center cursor-pointer group" onClick={() => toast({title: `Selected: ${userData.name}`})}>
                 <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-transparent group-hover:border-primary transition-colors">
                    <AvatarImage src={userData.profileImageUrl} alt={userData.profileImageName} data-ai-hint="user avatar"/>
                    <AvatarFallback className="text-xl sm:text-2xl">
                        {userData.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <p className="mt-2 text-sm text-foreground truncate w-full">{truncateName(userData.name)}</p>
            </div>

            {/* Kids Profile */}
             <div className="flex flex-col items-center text-center cursor-pointer group" onClick={handleKidsProfileClick}>
                 <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-transparent group-hover:border-primary transition-colors bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                     {/* Using Baby icon as placeholder */}
                    <Baby className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </Avatar>
                <p className="mt-2 text-sm text-foreground">Kids</p>
            </div>

             {/* Add Profile */}
            <div className="flex flex-col items-center text-center cursor-pointer group" onClick={handleAddProfileClick}>
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-dashed border-muted-foreground/50 group-hover:border-primary transition-colors bg-muted/30 group-hover:bg-muted/50 flex items-center justify-center">
                    <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground group-hover:text-primary" />
                </Avatar>
                <p className="mt-2 text-sm text-foreground">Add</p>
            </div>

             {/* Placeholder for potential other profiles */}
             {/* Add more profile items here if needed */}

        </div>
      </div>

      {/* Separator */}
       <Separator className="my-8" />

      {/* Placeholder for "Continue Watching" or other sections */}
      <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Continue Watching for {userData.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
             {/* Placeholder cards - replace with actual content */}
             {[1, 2, 3, 4].map((item) => (
                 <Card key={item} className="overflow-hidden shadow">
                    <Image
                         src={`https://picsum.photos/300/170?random=${item}`}
                         alt={`Placeholder ${item}`}
                         width={300}
                         height={170}
                         className="w-full object-cover aspect-video"
                         data-ai-hint="movie scene"
                     />
                     <CardContent className="p-3">
                         <p className="text-sm font-medium truncate">Movie Title {item}</p>
                         <p className="text-xs text-muted-foreground">1h 30m left</p>
                     </CardContent>
                 </Card>
             ))}
          </div>
      </div>

    </div>
  );
}