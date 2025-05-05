'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, LogOut, Plus, Baby } from 'lucide-react'; // Import icons
import type { UserAccount, Profile } from '@/types/user'; // Import shared types

// Helper function to get the first letter of a name, handling potential emojis or multi-char graphemes
const getInitials = (name: string) => {
    if (!name) return 'P'; // Default fallback
    // Use Array.from to handle multi-byte characters correctly
    const firstChar = Array.from(name)[0];
    return firstChar ? firstChar.toUpperCase() : 'P';
};

// Truncate long names for display under avatars
const truncateName = (name: string, maxLength = 10) => { // Increased max length slightly
    if (!name) return '';
    const chars = Array.from(name); // Handle multi-byte characters
    return chars.length > maxLength ? `${chars.slice(0, maxLength).join('')}...` : name;
};


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userAccount, setUserAccount] = React.useState<Omit<UserAccount, 'password' | 'createdAt'> | null>(null); // Store only necessary client-side data
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        setIsLoading(true);
        const storedData = localStorage.getItem('userAccount');
        if (storedData) {
          try {
            const parsedData: Omit<UserAccount, 'password'> = JSON.parse(storedData); // Parse without password
            // Validate data structure
            if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles)) {
              if (isMounted) setUserAccount(parsedData);
            } else {
              console.error("Incomplete user account data found in localStorage.");
              throw new Error("Incomplete user account data found.");
            }
          } catch (e) {
            console.error("Failed to parse or validate user account data from localStorage", e);
            if (isMounted) {
              toast({
                title: "Session Error",
                description: "Could not load user data. Please log in again.",
                variant: "destructive",
              });
              localStorage.removeItem('userAccount');
              localStorage.removeItem('selectedProfile'); // Clear selected profile too
              router.push('/login');
            }
          } finally {
            if (isMounted) setIsLoading(false);
          }
        } else {
          if (isMounted) {
            toast({
              title: "Not Logged In",
              description: "Please log in or sign up to view profiles.",
              variant: "destructive",
            });
            router.push('/login');
          }
        }
      } else {
        if (isMounted) setIsLoading(false); // Not in browser environment
      }
    };

    loadUserData();

    // Listen for changes in localStorage (e.g., after profile edit/add/delete)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userAccount') {
        console.log("Detected localStorage change for userAccount, reloading profiles...");
        loadUserData(); // Reload data if account changes
      }
       if (event.key === 'selectedProfile' && event.newValue === null) {
          // Optional: If selected profile is explicitly removed elsewhere, reload may be needed
          // loadUserData();
       }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, toast]);

  const handleProfileSelect = (profile: Profile) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedProfile', JSON.stringify(profile));
        toast({ title: `Switched to ${profile.name}`, description: "Redirecting..." });

        if (profile.id === 'kids') {
            // Redirect Kids profile to a specific URL
            window.location.href = 'http://abc.xyz/kids'; // Updated Kids redirect URL
        } else {
            // Redirect regular profiles to the main site
            window.location.href = 'http://abc.xyz';
        }
    }
  };


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userAccount');
      localStorage.removeItem('selectedProfile');
      localStorage.removeItem('pendingMobile');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading profiles...</div>;
  }

  if (!userAccount || !userAccount.profiles) {
    return <div className="flex min-h-screen items-center justify-center">No profile data available. Redirecting...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-3xl text-center">
             <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Who's Watching?</h1>

             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mb-10">
                {/* Display existing profiles */}
                {userAccount.profiles.map((profile) => (
                    <div
                        key={profile.id}
                        className="flex flex-col items-center text-center cursor-pointer group"
                        onClick={() => handleProfileSelect(profile)}
                    >
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-4 border-transparent group-hover:border-primary transition-colors duration-200 ease-in-out">
                            <AvatarImage src={profile.profileImageUrl} alt={profile.profileImageName} data-ai-hint="user avatar"/>
                            <AvatarFallback className="text-3xl sm:text-4xl font-semibold bg-muted">
                                {profile.id === 'kids' ? <Baby className="h-10 w-10 sm:h-12 sm:w-12 text-primary"/> : getInitials(profile.name)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="mt-2 text-sm sm:text-base text-foreground w-full px-1">{truncateName(profile.name)}</p>
                    </div>
                ))}

             </div>

             <Button onClick={handleLogout} variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
               <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout from Account ({userAccount.mobile})
            </Button>

        </div>
    </div>
  );
}
