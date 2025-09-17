import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Custom AppError class for structured error handling
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types for common cases
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: ZodError) {
    super('VALIDATION_ERROR', 422, message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', 403, message);
  }
}

// Global error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle our custom AppError
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
        },
      },
      { status: error.status },
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 422 },
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: {
              code: 'CONFLICT',
              message: 'Resource already exists',
              details: error.meta,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 },
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 },
        );
      default:
        return NextResponse.json(
          {
            error: {
              code: 'DATABASE_ERROR',
              message: 'Database operation failed',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 },
        );
    }
  }

  // Handle generic Errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }

  // Fallback for unknown error types
  return NextResponse.json(
    {
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 },
  );
}

// Utility function to wrap async operations
export async function withErrorHandling<T>(operation: () => Promise<T>): Promise<{ data?: T; error?: NextResponse }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    return { error: handleApiError(error) };
  }
}
