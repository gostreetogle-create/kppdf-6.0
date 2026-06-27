import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateMaterialSchema } from '@/lib/validations/material';
import { validateBody } from '@/lib/validations';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57
import { getCached, invalidateByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'materials';
const LIST_TTL = 30 * 1000;

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);
    const supplierId = searchParams.get('supplierId');

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.name = 'asc';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['name', 'article', 'description'].map((f) => ({ [f]: { contains: search } }));
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (search || supplierId) {
      const [items, total] = await Promise.all([
        prisma.material.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { supplier: true, category: true } }),
        prisma.material.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_p${page}_l${limit}_s${sortField || 'name'}_${sortOrder || 'asc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.material.findMany({ orderBy, skip: (page - 1) * limit, take: limit, include: { supplier: true, category: true } }),
        prisma.material.count(),
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
    const user = await requireRole(['admin', 'manager']); // Cycle 57: capture user for activity log
    const body = await request.json();
    const validation = validateBody(body, CreateMaterialSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.material.create({ data: validation.data, include: { supplier: true, category: true } });
    invalidateByPrefix(CACHE_PREFIX);
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'material',
      entityId: item.id,
      details: { name: item.name },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
