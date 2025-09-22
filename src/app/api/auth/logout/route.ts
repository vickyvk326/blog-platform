import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (refreshToken) {
    await prisma.session.deleteMany({ where: { sessionToken: refreshToken } });
  }

  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('refreshToken');
  return response;
}
