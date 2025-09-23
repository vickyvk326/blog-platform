// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Optional: Add connection helper
export async function connectDB() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Optional: Add graceful shutdown
export async function disconnectDB() {
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Type helpers for better DX
export type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

// Utility function for handling Prisma errors
export function handlePrismaError(error: unknown) {
  if (error instanceof Error) {
    // Prisma-specific error handling
    if (error.message.includes('Unique constraint failed')) {
      return { error: 'Resource already exists', status: 409 }
    }
    if (error.message.includes('Record to update not found')) {
      return { error: 'Resource not found', status: 404 }
    }
    if (error.message.includes('Foreign key constraint failed')) {
      return { error: 'Invalid reference', status: 400 }
    }
    
    return { error: 'Database error occurred', status: 500 }
  }
  
  return { error: 'Unknown error occurred', status: 500 }
}

// Example middleware for API routes
export function withPrismaErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const { error: message, status } = handlePrismaError(error)
      throw new Error(`${status}: ${message}`)
    }
  }
}

export default prisma