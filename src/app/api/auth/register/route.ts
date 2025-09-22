import { getLogger } from '@/lib/logger';
import { handleApiError } from '@/lib/next/errors';
import { registerFormSchema } from '@/lib/schema';
import { register } from '@/services/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const logger = await getLogger();

    const registerData = registerFormSchema.parse(await request.json());

    logger.info('Registering user', registerData);

    const user = await register(registerData.name, registerData.email, registerData.password);

    return NextResponse.json({ message: 'User registered successfully', ...user }, { status: 201 });
  } catch (error) {
    return await handleApiError(error);
  }
}
