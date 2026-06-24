/**
 * GET /api/health — healthcheck (smoke test для мониторинга).
 * Проверяет, что Prisma client живой.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    // Simple SELECT 1 для проверки DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'reachable',
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json(
      { status: 'degraded', db: 'unreachable', error: (err as Error).message },
      { status: 503 },
    );
  }
}
