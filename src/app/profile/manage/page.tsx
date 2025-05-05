
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, ArrowLeft, Baby } from 'lucide-react';
import type { UserAccount, Profile } from '@/types/user';

// Helper function to get the first letter of a name
const getInitials = (name: string) => {
    if (!name) return 'P';
    const firstChar = Array.from(name)[0];
    return firstChar ? firstChar.toUpperCase() : 'P';
};

// Truncate long names for display under avatars
const truncateName = (name: string, maxLength = 10) => {
    if (!name) return '';
    const chars = Array.from(name);
    return chars.length > maxLength ? `${chars.slice(0, maxLength).join('')}...` : name;
};

const MAX_PROFILES = 5; // Example: Limit to 5 profiles (including Kids)

export default function ManageProfilesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [userAccount, setUserAccount] = React.useState<Omit<UserAccount, 'password' | 'createdAt'> | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        let isMounted = true;
        const loadUserData = () => {
            if (typeof window !== 'undefined') {
                setIsLoading(true);
                const storedData = localStorage.getItem('userAccount');
                if (storedData) {
                    try {
                        const parsedData: Omit<UserAccount, 'password'> = JSON.parse(storedData);
                        if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles)) {
                            if (isMounted) setUserAccount(parsedData);
                        } else {
                            throw new Error("Incomplete user account data found.");
                        }
                    } catch (e) {
                        console.error("Failed to parse user account data", e);
                        if (isMounted) {
                            toast({ title: "Session Error", description: "Could not load data. Please log in again.", variant: "destructive" });
                            localStorage.removeItem('userAccount');
                            localStorage.removeItem('selectedProfile');
                            router.push('/login');
                        }
                    } finally {
                        if (isMounted) setIsLoading(false);
                    }
                } else {
                    if (isMounted) {
                        toast({ title: "Not Logged In", description: "Please log in to manage profiles.", variant: "destructive" });
                        router.push('/login');
                    }
                }
            } else {
                 if (isMounted) setIsLoading(false);
            }
        };

        loadUserData();

         // Listen for changes in localStorage
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'userAccount') {
                console.log("Detected localStorage change for userAccount on manage page, reloading...");
                loadUserData();
            }
        };
        window.addEventListener('storage', handleStorageChange);


        return () => {
            isMounted = false;
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [router, toast]);

    const handleEditProfile = (profileId: string) => {
        if (profileId === 'kids') {
            toast({title: "Info", description: "Kids profile settings are managed elsewhere or fixed."});
            // Optionally, redirect to a specific Kids settings page if it exists
            // router.push('/profile/kids-settings');
            return;
        }
        router.push(`/profile/edit?profileId=${profileId}`);
    };

    const handleAddProfile = () => {
        if (userAccount && userAccount.profiles.length >= MAX_PROFILES) {
             toast({ title: "Profile Limit Reached", description: `You can only have up to ${MAX_PROFILES} profiles.`, variant: "destructive" });
             return;
        }
        router.push('/profile/add');
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center">Loading profile manager...</div>;
    }

    if (!userAccount || !userAccount.profiles) {
        return <div className="flex min-h-screen items-center justify-center">Error loading profiles. Redirecting...</div>;
    }

     const canAddProfile = userAccount.profiles.length < MAX_PROFILES;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-3xl text-center">
                <div className="flex items-center justify-center relative mb-8">
                     <Button variant="ghost" size="icon" onClick={() => router.push('/profile')} className="absolute left-0 top-1/2 -translate-y-1/2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Manage Profiles</h1>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10"></div> {/* Spacer */}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mb-10">
                    {/* Display existing profiles for editing */}
                    {userAccount.profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className="flex flex-col items-center text-center cursor-pointer group relative"
                            onClick={() => handleEditProfile(profile.id)}
                        >
                            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-4 border-transparent group-hover:border-gray-500 transition-colors duration-200 ease-in-out relative">
                                <AvatarImage src={profile.profileImageUrl} alt={profile.profileImageName} className="opacity-60 group-hover:opacity-40 transition-opacity"/>
                                <AvatarFallback className="text-3xl sm:text-4xl font-semibold bg-muted opacity-60 group-hover:opacity-40 transition-opacity">
                                     {profile.id === 'kids' ? <Baby className="h-10 w-10 sm:h-12 sm:w-12 text-primary"/> : getInitials(profile.name)}
                                </AvatarFallback>
                                {/* Edit Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Pencil className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                </div>
                            </Avatar>
                            <p className="mt-2 text-sm sm:text-base text-foreground w-full px-1">{truncateName(profile.name)}</p>
                        </div>
                    ))}

                    {/* Add Profile Button */}
                     {canAddProfile && (
                         <div
                            className="flex flex-col items-center text-center cursor-pointer group"
                            onClick={handleAddProfile}
                         >
                             <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-4 border-transparent group-hover:border-muted-foreground transition-colors duration-200 ease-in-out flex items-center justify-center bg-muted/30 hover:bg-muted/50">
                                 <Plus className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground group-hover:text-foreground" />
                             </Avatar>
                            <p className="mt-2 text-sm sm:text-base text-foreground">Add Profile</p>
                         </div>
                     )}
                </div>

                <Button variant="outline" onClick={() => router.push('/profile')}>
                    Done Managing
                </Button>
            </div>
        </div>
    );
}
