import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/next/errors';
import { verifyEmail } from '@/services/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logger = await getLogger();

    const { token } = await request.json();

    logger.info('Verifying token', token);

    await verifyEmail(token);
    return NextResponse.json({ message: 'Token verified successfully' });
  } catch (err) {
    return await handleApiError(err);
  }
}
