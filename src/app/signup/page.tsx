'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Phone, Lock, User } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

const profileImages = [
  { id: '1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/21.png', name: 'Avatar 1' },
  { id: '2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/2.png', name: 'Avatar 2' },
  { id: '3', url: 'https://picsum.photos/200/200?random=1', name: 'Avatar 3', aiHint: 'abstract pattern' }, // Placeholder
  { id: '4', url: 'https://picsum.photos/200/200?random=2', name: 'Avatar 4', aiHint: 'nature landscape' }, // Placeholder
  { id: '5', url: 'https://picsum.photos/200/200?random=3', name: 'Avatar 5', aiHint: 'geometric shapes' }, // Placeholder
];

// Mock signup function - replace with actual API call
const signupUser = async (data: any): Promise<boolean> => {
   // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Signing up user:", data);
  // Assume signup is always successful for demo
  return true;
};


const FormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  mobile: z.string().regex(/^\d{10}$/, {
    message: 'Mobile number must be 10 digits.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  profileImage: z.string().min(1, { message: 'Please select a profile image.' }),
});

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);


  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      mobile: initialMobile,
      password: '',
      profileImage: '',
    },
  });

   // Update mobile in form if query param changes
  React.useEffect(() => {
    if (initialMobile) {
      form.setValue('mobile', initialMobile);
    }
  }, [initialMobile, form]);

  React.useEffect(() => {
     form.register('profileImage'); // Ensure profileImage is registered
  }, [form]);


  const handleImageSelect = (imageId: string) => {
    setSelectedImage(imageId);
    form.setValue('profileImage', imageId, { shouldValidate: true });
     form.clearErrors('profileImage'); // Clear error when selected
  };


  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!selectedImage) {
        form.setError('profileImage', { type: 'manual', message: 'Please select a profile image.' });
        return;
    }

    setIsLoading(true);

    const selectedImageData = profileImages.find(img => img.id === selectedImage);

    const signupData = {
        ...data,
        profileImageUrl: selectedImageData?.url, // Send the URL
    };


    try {
        const success = await signupUser(signupData);
        if (success) {
            toast({
                title: "Signup Successful",
                description: "Your account has been created.",
            });
            // Store user data in localStorage for profile page
            localStorage.setItem('userData', JSON.stringify({
                name: data.name,
                mobile: data.mobile,
                profileImageUrl: selectedImageData?.url,
                profileImageName: selectedImageData?.name,
                // Don't store password
            }));
            router.push('/profile');
        } else {
             toast({
                title: "Signup Failed",
                description: "Could not create account. Please try again.",
                variant: "destructive",
            });
             setIsLoading(false);
        }
    } catch (error) {
         console.error("Signup error:", error);
         toast({
            title: "Error",
            description: "An error occurred during signup. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
           <CardDescription className="text-center text-muted-foreground">
            Choose a profile picture and fill in your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                control={form.control}
                name="profileImage"
                render={() => (
                  <FormItem className="flex flex-col items-center">
                    <FormLabel className="mb-2 text-center">Choose your Avatar</FormLabel>
                     <Carousel
                      opts={{
                        align: "start",
                        loop: false, // Don't loop for selection
                      }}
                      className="w-full max-w-xs"
                    >
                      <CarouselContent>
                        {profileImages.map((image) => (
                          <CarouselItem key={image.id} className="basis-1/3 md:basis-1/3">
                            <div className="p-1">
                              <Card
                                className={cn(
                                    "cursor-pointer overflow-hidden transition-all",
                                    selectedImage === image.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "ring-border hover:ring-primary/50"
                                )}
                                onClick={() => handleImageSelect(image.id)}
                              >
                                <CardContent className="flex aspect-square items-center justify-center p-0">
                                   <Image
                                    src={image.url}
                                    alt={image.name}
                                    width={200}
                                    height={200}
                                    className="object-cover"
                                    data-ai-hint={image.aiHint}
                                  />
                                </CardContent>
                              </Card>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-[-1rem] hidden sm:flex" />
                      <CarouselNext className="right-[-1rem] hidden sm:flex" />
                    </Carousel>
                    <FormMessage className="mt-2 text-center" />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Enter your name" {...field} className="pl-10" disabled={isLoading}/>
                       </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter your 10-digit mobile number"
                          className="pl-10"
                          {...field}
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Create a password (min. 6 characters)"
                          className="pl-10"
                          {...field}
                           disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            <Button variant="link" onClick={() => router.push('/login')} className="text-primary">
              Already have an account? Log In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
