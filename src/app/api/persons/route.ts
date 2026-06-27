import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreatePersonSchema } from '@/lib/validations/person';
import { validateBody } from '@/lib/validations';
import { getCached, invalidateByPrefix } from '@/lib/cache';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

const CACHE_PREFIX = 'persons';
const LIST_TTL = 30 * 1000;

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.lastName = 'asc';

    if (search) {
      const where: Record<string, unknown> = {
        OR: ['lastName', 'firstName', 'phone', 'email'].map((f) => ({ [f]: { contains: search } })),
      };
      const [items, total] = await Promise.all([
        prisma.person.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { organizations: { include: { organization: true } } } }),
        prisma.person.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_p${page}_l${limit}_s${sortField || 'lastName'}_${sortOrder || 'asc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.person.findMany({ orderBy, skip: (page - 1) * limit, take: limit, include: { organizations: { include: { organization: true } } } }),
        prisma.person.count(),
      ]);
      return { items, total };
    }, LIST_TTL);

    return apiPaginated(result.items, result.total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

// POST /api/persons — создать контактное лицо.
// D-A1 batch 2 (cycle 47-extension): CRM managers add contacts.
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['manager']); // Cycle 57: capture user for activity log
    const body = await request.json();
    const validation = validateBody(body, CreatePersonSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.person.create({ data: validation.data });
    invalidateByPrefix(CACHE_PREFIX);
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'person',
      entityId: item.id,
      details: { name: `${item.lastName} ${item.firstName}` },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
