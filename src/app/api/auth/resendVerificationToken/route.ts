import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/next/errors';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logger = await getLogger();
    const { email } = await request.json();
    logger.info(`Resend verification token for ${email}`);

    const verificationToken = randomUUID();

    const verificationLink = `https://localhost:3000/verify?token=${verificationToken}`;

    await prisma.verificationToken.create({
      data: {
        email: email,
        token: verificationToken,
        expires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return NextResponse.json({ message: 'Verification token sent successfully', verificationLink });
  } catch (err) {
    return await handleApiError(err);
  }
}
