import { handleApiError, NotFoundError } from '@/lib/next/errors';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');
    if (!resultId) throw new NotFoundError('Result Id not provided');

    console.log(`GET /api/userFlowResultById?resultId=${resultId}`);

    const result = await prisma.userFlowResult.findFirst({
      where: { id: parseInt(resultId) },
      include: {
        flow: true,
        result: true,
        user: true,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error fetching userFlowResults:', error);
    return handleApiError(error);
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');
    if (!resultId) throw new NotFoundError('Result Id not provided');

    console.log(`DELETE /api/userFlowResultById?resultId=${resultId}`);

    const result = await prisma.userFlowResult.delete({
      where: { id: parseInt(resultId) },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error fetching userFlowResults:', error);
    return handleApiError(error);
  }
};
