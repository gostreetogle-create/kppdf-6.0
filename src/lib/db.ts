/**
 * Prisma 7 client singleton + PrismaPg driver adapter.
 * Согласуется с ERRATA v5: НЕ использовать deprecated datasourceUrl.
 * Driver adapter (PrismaPg) + Pool из pg — рекомендованная схема для PG 16.
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: env().DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env().NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env().NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
