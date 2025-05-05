
'use client'; // Needed to access localStorage and window

import * as React from 'react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userData');
      let isLoggedIn = false;

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Basic validation to ensure it looks like user data
          if (parsedData && parsedData.mobile && parsedData.name) {
            isLoggedIn = true;
          } else {
             // Invalid data, clear it
             localStorage.removeItem('userData');
          }
        } catch (e) {
          console.error("Error parsing user data from localStorage on root page", e);
          localStorage.removeItem('userData'); // Clear corrupted data
        }
      }

      if (isLoggedIn) {
          // User is logged in, redirect to the external site
          window.location.href = 'http://abc.xyz';
          // Keep loading state true to prevent rendering anything before redirect
      } else {
          // User is not logged in, redirect to login page
          // Using window.location.replace for consistency with external redirect logic
          window.location.replace('/login');
          // Keep loading state true
      }

      // Note: We don't set isLoading to false because the page will redirect.
      // If the redirect fails for some reason, the loading state remains.
    }
  }, []); // Empty dependency array ensures this runs only once on mount

   // Render a loading state while checking localStorage and attempting redirection
   // This prevents a flash of content before redirection.
   return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
}
