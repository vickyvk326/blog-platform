import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: refreshToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date()) return null;

  // Optional: generate new access token
  const accessToken = jwt.sign({ sub: session.user.id, email: session.user.email }, process.env.JWT_SECRET!, {
    expiresIn: '15m',
  });

  const { password, ...safeUser } = session.user;

  return { ...safeUser, accessToken };
}

export async function invalidateSession(sessionToken: string) {
  await prisma.session.delete({ where: { sessionToken } });
}

export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function isSessionValid(sessionToken: string) {
  const session = await prisma.session.findUnique({ where: { sessionToken } });
  if (!session || session.expires < new Date()) return false;
  return true;
}

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;
