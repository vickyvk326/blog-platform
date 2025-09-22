'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export default function AccountNotVerifiedDialog({
  email,
  onResend,
}: {
  email: string;
  onResend: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await onResend();
      setMessage('Verification email sent! Check your inbox.');
    } catch (err) {
      setMessage(err.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' className='w-full'>
          Account Not Verified
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Email Not Verified</AlertDialogTitle>
          <AlertDialogDescription>
            Your email <strong>{email}</strong> has not been verified. You can resend the verification link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='flex flex-col gap-2'>
          <Button onClick={handleResend} disabled={loading}>
            {loading ? 'Sending...' : 'Resend Verification Link'}
          </Button>
          {message && <p className='text-sm'>{message}</p>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
