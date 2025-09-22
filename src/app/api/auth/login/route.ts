import { COOKIE_OPTIONS } from '@/constants/auth';
import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/next/errors';
import { loginFormSchema } from '@/lib/schema';
import { login } from '@/services/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logger = await getLogger();
    const loginData = loginFormSchema.parse(await request.json());
    logger.info('Logging in user', loginData);
    const loginResponseData = await login(loginData.email, loginData.password);
    const { refreshToken, ...safeLoginResponse } = loginResponseData;
    const response = NextResponse.json({ message: 'User logged in successfully', ...safeLoginResponse });
    response.cookies.set('refreshToken', refreshToken, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    return await handleApiError(err);
  }
}

export type loginResponse =
  | {
      accessToken: string;
      user: {
        email: string;
        name: string;
        image: string | null;
        id: string;
        createdAt: Date;
      };
    }
  | {
      code: string;
      message: string;
      details: unknown;
      timestamp: string;
    };
