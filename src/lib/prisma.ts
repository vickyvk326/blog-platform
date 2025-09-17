import { PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/binary';

type prismaClientType =
  | PrismaClient<
      {
        log: (
          | {
              emit: 'event';
              level: 'query';
            }
          | {
              emit: 'stdout';
              level: 'error';
            }
          | {
              emit: 'stdout';
              level: 'info';
            }
          | {
              emit: 'stdout';
              level: 'warn';
            }
        )[];
      },
      'info' | 'query' | 'warn' | 'error',
      DefaultArgs
    >
  | undefined;

declare global {
  var prisma: prismaClientType;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'stdout',
        level: 'error',
      },
      {
        emit: 'stdout',
        level: 'info',
      },
      {
        emit: 'stdout',
        level: 'warn',
      },
    ],
  });

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
  console.log('Duration: ' + e.duration + 'ms');
});

// Create a reusable Prisma client
if (process.env.NODE_ENV === 'development') global.prisma = prisma;
