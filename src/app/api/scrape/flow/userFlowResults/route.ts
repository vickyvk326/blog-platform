import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, NotFoundError } from '@/lib/next/errors';

// GET /api/userFlowResults?userId=abc123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pageNo = searchParams.get('page') || '0';
    const pageSize = searchParams.get('pageSize') || '10';

    if (!userId) throw new NotFoundError('User ID not provided');

    const results = await prisma.userFlowResult.findMany({
      where: { userId },
      orderBy: { id: 'asc' }, // latest first (optional)
      take: pageSize ? parseInt(pageSize) : undefined,
      skip: (pageNo ? parseInt(pageNo) : 1) * (pageSize ? parseInt(pageSize) : 10),
    });

    return NextResponse.json({ success: true, pageNo, pageSize, results });
  } catch (error) {
    console.error('Error fetching userFlowResults:', error);
    return handleApiError(error);
  }
}