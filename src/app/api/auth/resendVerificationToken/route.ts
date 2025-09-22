import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/next/errors';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logger = await getLogger();
    const { email } = await request.json();
    logger.info(`Resend verification token for ${email}`);
    
  } catch (err) {
    return await handleApiError(err);
  }
}
