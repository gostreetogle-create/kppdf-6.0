import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateWorkCenterSchema } from '@/lib/validations/work-center';
import { validateBody } from '@/lib/validations';
import { getCached, invalidateByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'work-centers';
const LIST_TTL = 30 * 1000;

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    if (search) {
      const where: Record<string, unknown> = { OR: ['name'].map((f) => ({ [f]: { contains: search } })) };
      const [items, total] = await Promise.all([
        prisma.workCenter.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
        prisma.workCenter.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_p${page}_l${limit}_s${sortField || 'createdAt'}_${sortOrder || 'desc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.workCenter.findMany({ orderBy, skip: (page - 1) * limit, take: limit }),
        prisma.workCenter.count(),
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
    await requireRole(['admin', 'manager', 'production']); // P2.2: work-center — производственный справочник; production должен иметь доступ к own справочникам
    const body = await request.json();
    const validation = validateBody(body, CreateWorkCenterSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.workCenter.create({ data: validation.data });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
