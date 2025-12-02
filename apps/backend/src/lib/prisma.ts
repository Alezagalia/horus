/**
 * Prisma Client Singleton with Performance Optimizations
 * Sprint 12 - US-110: Backend Performance Optimization
 * Updated for Prisma 7 with Driver Adapters
 */

import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create pg Pool for connection pooling
const pool = new pg.Pool({ connectionString });

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Graceful shutdown (US-110)
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
