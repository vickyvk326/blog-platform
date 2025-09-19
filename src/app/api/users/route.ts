import { NextResponse } from 'next/server';
import { getUsers } from '@/app/service/user.service';
import { handleApiError, withErrorHandling } from '@/lib/next/errors';

export async function GET() {
  try {
    const users = await withErrorHandling(getUsers);
    return NextResponse.json(users);
  } catch (error) {
    await handleApiError(error);
  }
}
