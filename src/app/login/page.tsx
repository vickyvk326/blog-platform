'use client';

import { useAuth } from '@/components/ClientProvider';
import AccountNotVerifiedDialog from '@/components/login/AccountNotVerifiedDialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginFormData, loginFormSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function Page() {
  const { setUser } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const router = useRouter();

  const [isAccountNotVerifiedModal, setIsAccountNotVerifiedModal] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const responseData = await res.json();
      toast.error(`Error: ${responseData.error?.message}`);
      setIsAccountNotVerifiedModal(responseData.error?.message === 'Email not verified');
      return;
    }

    const responseData = await res.json();
    const { message, ...user } = responseData;
    setUser(user.user);
    toast.success(message);
    router.push('/');
    setIsAccountNotVerifiedModal(false);
  };

  const resendActivationEmail = async () => {
    setIsAccountNotVerifiedModal(false);
    const res = await fetch('/api/auth/resendVerificationToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: form.getValues('email') }),
    });
    const data = await res.json();
    if (data?.message) toast.success(data?.message);
    else toast.error(data?.error?.message || 'Something went wrong');
  };
  return (
    <div>
      <div className='container bg-secondary rounded-2xl mx-auto mt-10 py-10 px-5 max-w-4xl space-y-6 grid grid-auto-flow grid-cols-2 min-h-[400px]'>
        {/* Left */}
        <div className='p-6 flex flex-col justify-between'>
          <h1 className='text-2xl font-medium tracking-tight'>Log in</h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 mt-4'>
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
                      <Input placeholder='password' type='password' autoComplete='current-password' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAccountNotVerifiedModal && (
                <AccountNotVerifiedDialog email={form.getValues('email')} onResend={resendActivationEmail} />
              )}

              <Button type='submit' className='w-full'>
                Submit
              </Button>
            </form>
          </Form>

          <div className='flex gap-2 mt-3 '>
            <p className='text-xs text-secondary-foreground'>Create an account?</p>
            <Link href='/register' className='text-xs text-primary hover:underline'>
              register
            </Link>
          </div>
        </div>

        {/* Right */}
        <div className='p-6 bg-primary text-primary-foreground rounded-2xl flex flex-col justify-between'>
          <div>
            <Image src='/globe.svg' alt='logo' width={30} height={30} className='self-center' />
          </div>

          <div className='flex flex-col gap-2'>
            <p className='text-4  xl font-medium tracking-tight'>Welcome to Web Automation Toolkit</p>
            <p className='text-xs text-secondary-foreground'>
              where you can build and run automation flows, scrape data, and extract structured tables — all in one
              place.
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
      </div>
    </div>
  );
}
