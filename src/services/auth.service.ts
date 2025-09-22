import { getAccessToken, getRefreshToken } from '@/lib/jwt';
import { UnauthorizedError } from '@/lib/next/errors';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';

const SALT_ROUNDS = 10;

const login = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) throw new UnauthorizedError('Invalid credentials');

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) throw new UnauthorizedError('Invalid credentials');

  if (!user.emailVerified) throw new UnauthorizedError('Email not verified');

  const { password: _, emailVerified, ...safeUser } = user;

  const accessToken = getAccessToken(user);

  const refreshToken = randomUUID();

  await prisma.session.create({
    data: {
      sessionToken: refreshToken,
      userId: user.id,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user: safeUser };
};

const register = async (name: string, email: string, password: string) => {
  const existingUser = await prisma.user.findFirst({ where: { email } });

  if (existingUser) throw new Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  if (!user) throw new Error('User not created');

  const { password: _, ...safeUser } = user;

  const verificationToken = randomUUID();

  const verificationLink = `https://localhost:3000/verify?token=${verificationToken}`;

  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token: verificationToken,
      expires: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  return { user: safeUser, verificationLink };
};

const verifyEmail = async (token: string) => {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: { token },
  });

  if (!verificationToken) throw new Error('Invalid token');

  if (verificationToken.expires < new Date()) throw new Error('Token expired');

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.email },
  });

  if (!user) throw new Error('User not found');

  await prisma.user.update({
    where: { email: user.email },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

  const { password: _, ...safeUser } = user;
  return { user: safeUser };
};

const resendVerificationToken = async (email: string) => {
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) throw new Error('User not foound');

  const oldVerificationToken = await prisma.verificationToken.findFirst({
    where: { email: user.email },
  });

  if (oldVerificationToken) await prisma.verificationToken.delete({ where: { token: oldVerificationToken.token } });

  const verificationToken = randomUUID();

  const verificationLink = `https://localhost:3000/verify?token=${verificationToken}`;

  await prisma.verificationToken.create({
    data: {
      email: user.email,
      token: verificationToken,
      expires: new Date(Date.now() + 15 * 1000),
    },
  });

  return { verificationLink };
};

type loginData = Awaited<ReturnType<typeof login>>;

type registerData = Awaited<ReturnType<typeof register>>;

export { login, register, verifyEmail, resendVerificationToken, type loginData, type registerData };
