'use client'; // Needed to access localStorage

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          // Basic validation to ensure it looks like user data
          if (parsedData && parsedData.mobile && parsedData.name) {
            router.replace('/profile'); // User is logged in, go to profile
            return; // Exit early
          } else {
             // Invalid data, clear it
             localStorage.removeItem('userData');
          }
        } catch (e) {
          console.error("Error parsing user data from localStorage", e);
          localStorage.removeItem('userData'); // Clear corrupted data
        }
      }
      // If no valid data found, proceed to login
      router.replace('/login');
    }
  }, [router]);

   // Render a loading state or null while checking localStorage and redirecting
   // This prevents a flash of content if the root page had any UI
   if (isLoading) {
     // Optional: You can show a global loading spinner here
     // For now, returning null is fine as redirection happens quickly
     // You might want a basic loading indicator for better UX
     return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
   }

   // This part should ideally not be reached due to redirects
   return null;
}
