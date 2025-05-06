
'use client'; // Needed to access localStorage and window

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Use Next.js router

export default function Home() {
  const router = useRouter();
  // Keep loading state true initially to prevent flashing content
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userAccount'); // Check for user account info
      let isLoggedIn = false;

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Basic validation: Check if it has mobile
          if (parsedData && parsedData.mobile) {
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
        // User is logged in (has account data), redirect to external site
        window.location.href = 'http://abc.xyz';
        // Keep loading true while redirecting externally
      } else {
        // User is not logged in, redirect to login page
        router.replace('/login');
        // Set loading false after initiating internal redirect
        setIsLoading(false);
      }
    }
  }, [router]); // Add router to dependency array

  // Render a loading state while checking localStorage and attempting redirection
  // This prevents a flash of content before redirection.
  // If redirecting externally, this loading state persists until the browser navigates away.
  if (isLoading) {
      return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  // Fallback content (shouldn't normally be reached if logic is correct)
  return <div className="flex min-h-screen items-center justify-center">Redirecting...</div>;

}
