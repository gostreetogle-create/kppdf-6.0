import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { isProd } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Create a PrismaClient connected to PostgreSQL via @prisma/adapter-pg.
 *
 * Cycle v3.4 — FINAL migration. PostgreSQL-only.
 *
 * Requires DATABASE_URL with protocol `postgresql://` or `postgres://`.
 * - Production: SSL enabled (rejectUnauthorized: false allows self-signed certs).
 * - Dev: SSL disabled (sslmode=disable equivalent).
 * - No fallback to SQLite. No file: protocol. No dual-adapter.
 *
 * SCRAM auth failure (Cycle v3.1.1) is resolved by:
 *   1. pg.Pool handles connection natively (no adapter mismatch).
 *   2. pg_hba.conf: `host all all 127.0.0.1/32 md5` for local TCP.
 *   3. Local dev uses ?sslmode=disable in DATABASE_URL.
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set.\n' +
      'Expected format: postgresql://user:password@host:port/database\n' +
      'Example: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kppdf?sslmode=disable"\n' +
      'Set it in .env in the project root.',
    );
  }

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      `Unsupported protocol in DATABASE_URL: "${url.substring(0, 25)}...".\n` +
      `Only postgresql:// is supported. This project uses PostgreSQL exclusively.\n` +
      `If you see "file:", you have a stale sqlite DATABASE_URL from a previous cycle.\n` +
      `Update .env: DATABASE_URL="postgresql://user:pass@localhost:5432/dbname?sslmode=disable"`,
    );
  }

  // Safe connection pool:
  // - SSL is enabled in production UNLESS the connection string explicitly
  //   contains ?sslmode=disable (local dev Docker PostgreSQL without SSL).
  // - Production SSL: rejectUnauthorized: false allows self-signed certs.
  // - Dev (NODE_ENV !== production): SSL disabled.
  const sslDisabled = url.includes('sslmode=disable');
  const pool = new Pool({
    connectionString: url,
    ssl: isProd && !sslDisabled ? { rejectUnauthorized: false } : false,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Lazy Prisma proxy.
 *
 * Why: Next.js `next build` analyzes all routes. If `createPrismaClient()` runs
 * at module load (as before), the `DATABASE_URL` check throws and breaks the
 * production build. The proxy defers instantiation until the first actual
 * query `prisma.X.method(...)` is invoked at runtime — so `next build` can
 * analyze routes without needing DATABASE_URL. If DATABASE_URL is missing at
 * runtime, `createPrismaClient()` throws exactly as before (intentional).
 *
 * Cycle v3.4 — FINAL migration. PostgreSQL-only logic in createPrismaClient().
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
