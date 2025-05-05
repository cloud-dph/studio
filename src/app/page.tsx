
'use client'; // Needed to access localStorage and window

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Use Next.js router

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(true); // Keep loading state

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount'); // Check for user account info
      let isLoggedIn = false;

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Basic validation: Check if it has mobile and profiles array
          if (parsedData && parsedData.mobile && Array.isArray(parsedData.profiles)) {
            isLoggedIn = true;
          } else {
            // Invalid data, clear it
            localStorage.removeItem('userAccount');
          }
        } catch (e) {
          console.error("Error parsing user account data from localStorage on root page", e);
          localStorage.removeItem('userAccount'); // Clear corrupted data
        }
      }

      if (isLoggedIn) {
        // User is logged in (has account data), redirect straight to content
         window.location.href = 'http://abc.xyz';
      } else {
        // User is not logged in, redirect to login page
        router.replace('/login');
      }

      // No need to set isLoading to false as redirection should happen.
      // If redirection fails, the loading state remains, preventing content flash.
    }
  }, [router]); // Add router to dependency array

  // Render a loading state while checking localStorage and attempting redirection
  // This prevents a flash of content before redirection.
  return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
}

