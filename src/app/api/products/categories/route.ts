import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { getCached, invalidateByPrefix } from '@/lib/cache';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

const CACHE_PREFIX = 'product-categories';
const LIST_TTL = 60 * 1000; // 1 min — categories rarely change

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.name = 'asc';

    if (search) {
      const where: Record<string, unknown> = { OR: ['name'].map((f) => ({ [f]: { contains: search } })) };
      const [items, total] = await Promise.all([
        prisma.productCategory.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
        prisma.productCategory.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_p${page}_l${limit}_s${sortField || 'name'}_${sortOrder || 'asc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.productCategory.findMany({ orderBy, skip: (page - 1) * limit, take: limit }),
        prisma.productCategory.count(),
      ]);
      return { items, total };
    }, LIST_TTL);

    return apiPaginated(result.items, result.total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'manager']); // P2.2: create category — reference data setup, не для viewer/production/storekeeper/accountant
    const body = await request.json();
    const item = await prisma.productCategory.create({ data: body });
    invalidateByPrefix(CACHE_PREFIX);
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'product_category',
      entityId: item.id,
      details: { name: item.name },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
