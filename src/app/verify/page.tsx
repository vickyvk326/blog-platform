import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { verifyEmail } from '@/services/auth.service';
import { CircleAlertIcon, MessageSquareWarningIcon } from 'lucide-react';
import Link from 'next/link';

export default async function Page({ searchParams }: { searchParams: { token?: string } | null }) {
  const token = searchParams?.token;
  if (!token) throw new Error('No token');
  try {
    await verifyEmail(token);
  } catch (err) {
    return (
      <div className='container mt-5 py-10 grid grid-cols-1 gap-6 mx-auto'>
        <Card className='w-max-[400px] mx-auto p-5'>
          <CircleAlertIcon size={24} className='text-destructive mx-auto' />
          <h1 className='text-2xl font-bold'>Error Verifying Token</h1>
          <p className='text-md text-muted-foreground'>
            {err.message || 'There was an error verifying your token.'} Please try again.
          </p>
          <Link href='/login'>
            <Button asChild className='mt-5 w-full'>
              Log In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  return (
    <div className='container mt-5 py-10 grid grid-cols-1 gap-6 mx-auto'>
      <Card className='w-max-[400px] mx-auto p-5'>
        <h1 className='text-2xl font-bold'>Account Verified</h1>
        <p className='text-muted-foreground'>Your account has been verified. You can now log in.</p>
        <Link href='/login' className='text-priary border-2 border-primary'>
          Log In
        </Link>
      </Card>
    </div>
  );
}
