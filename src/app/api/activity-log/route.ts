/**
 * src/app/api/activity-log/route.ts (Cycle 57 / B.7 — UserActivity UI)
 *
 * GET endpoint serving per-entity activity events from `UserActivity` table.
 * Read for entity+entityId combo с pagination (default 25 events/page).
 *
 * Returns JSON: { items: ActivityEvent[], total, page, limit }.
 * Used by `<ActivityLog>` component on Proposals/Contracts/ProductionOrders viewers.
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));

    if (!entity || !entityId) {
      return apiError('Параметры entity и entityId обязательны', 400);
    }

    const where = { entity, entityId };

    const [items, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userActivity.count({ where }),
    ]);

    return apiOk({ items, total, page, limit });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
