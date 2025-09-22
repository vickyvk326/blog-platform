'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegisterFormData, registerFormSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function Page() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const router = useRouter();
  const onSubmit = async (data: RegisterFormData) => {
    console.log('Registering user', data);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      toast.error(`Error: ${responseData.error?.message}`);
      return;
    }

    toast.success(responseData.message);
    router.push('/login');
  };
  return (
    <div className='container bg-secondary rounded-2xl mx-auto mt-10 py-10 px-5 max-w-4xl space-y-6 grid grid-cols-2 min-h-[400px]'>
      {/* Left */}
      <div className='p-6 bg-primary text-primary-foreground rounded-2xl flex flex-col justify-between'>
        <div>
          <Image src='/globe.svg' alt='logo' width={30} height={30} className='self-center' />
        </div>

        <div className='flex flex-col gap-2'>
          <p className='text-4  xl font-medium tracking-tight'>Welcome to Web Automation Toolkit</p>
          <p className='text-xs text-secondary-foreground'>
            where you can build and run automation flows, scrape data, and extract structured tables — all in one place.
          </p>
        </div>

        <Link
          href='/scraper/flow'
          className='border border-primary-foreground text-primary-foreground hover:bg-primary hover:text-primary-foreground 
          py-2 px-4 rounded-2xl
          w-fit self-center'
        >
          Know more
        </Link>
      </div>

      {/* Right */}
      <div className='p-6 flex flex-col justify-between'>
        <h1 className='text-2xl font-medium tracking-tight'>Register a free account</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 mt-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='name' autoComplete='name' {...field} />
                  </FormControl>
                  <FormDescription>This is your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='email' autoComplete='email' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder='password' type='password' autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input placeholder='confirm password' type='password' autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='w-full'>
              Submit
            </Button>
          </form>
        </Form>

        <div className='flex gap-2 mt-3 '>
          <p className='text-xs text-secondary-foreground'>Already have an account?</p>
          <Link href='/login' className='text-xs text-primary hover:underline'>
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
