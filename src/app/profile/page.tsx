'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Code } from 'lucide-react';

interface UserData {
  name: string;
  mobile: string;
  profileImageUrl: string;
  profileImageName: string;
}

// Function to fetch file content (replace with actual implementation if needed)
async function getFileContent(filePath: string): Promise<string> {
  // In a real app, this would fetch content from the server
  // For this demo, we return placeholder or error message
  console.warn(`Fetching file content for ${filePath} is not implemented in this demo.`);
  return `/* Content for ${filePath} would be displayed here in a real application. */`;

  // Example of how it *could* work if you had an API endpoint:
  // try {
  //   const response = await fetch(`/api/get-code?path=${encodeURIComponent(filePath)}`);
  //   if (!response.ok) {
  //     throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  //   }
  //   return await response.text();
  // } catch (error) {
  //   console.error(`Error fetching ${filePath}:`, error);
  //   return `// Error loading file: ${filePath}\n${error instanceof Error ? error.message : String(error)}`;
  // }
}


const codeFiles = [
  'src/app/page.tsx',
  'src/app/layout.tsx',
  'src/app/login/page.tsx',
  'src/app/login/password/page.tsx',
  'src/app/signup/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/globals.css',
  'src/components/ui/button.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/carousel.tsx',
  'src/components/ui/avatar.tsx',
  'tailwind.config.ts',
];

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [codeContents, setCodeContents] = React.useState<Record<string, string>>({});
   const [isLoadingCode, setIsLoadingCode] = React.useState(true);

  React.useEffect(() => {
    // Prevent server-side execution
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        try {
           setUserData(JSON.parse(storedData));
        } catch (e) {
             console.error("Failed to parse user data from localStorage", e);
             toast({
                title: "Error",
                description: "Could not load user data.",
                variant: "destructive",
            });
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
    }
  }, [router, toast]);

  React.useEffect(() => {
     // Prevent server-side execution
    if (typeof window !== 'undefined' && userData) {
      const fetchAllCode = async () => {
        setIsLoadingCode(true);
        const contents: Record<string, string> = {};
        for (const file of codeFiles) {
          contents[file] = await getFileContent(file);
        }
        setCodeContents(contents);
        setIsLoadingCode(false);
      };
      fetchAllCode();
    }
  }, [userData]); // Fetch code only when userData is available


  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('userData');
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push('/login');
    }
  };


  if (!userData) {
    // Render loading state or null while checking localStorage
    return <div className="flex min-h-screen items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Card className="w-full shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
           <div className="flex flex-col sm:flex-row items-center gap-4">
             <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={userData.profileImageUrl} alt={userData.profileImageName} data-ai-hint="user avatar"/>
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
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Code className="h-5 w-5" />
              Application Code Snippets
            </h3>
            <Separator className="mb-4" />
            {isLoadingCode ? (
              <p>Loading code snippets...</p>
            ) : (
              <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-secondary/50">
                {codeFiles.map((file) => (
                  <div key={file} className="mb-6">
                    <h4 className="font-mono text-sm font-semibold mb-2 text-primary">{file}</h4>
                    <pre className="text-xs bg-background p-3 rounded-md overflow-auto">
                      <code>{codeContents[file] || `// Could not load content for ${file}`}</code>
                    </pre>
                     <Separator className="my-4" />
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
