import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateDocTypeSchema } from '@/lib/validations/doc-type';
import { validateBody } from '@/lib/validations';
import { getCached, invalidateByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'doc-types';
const LIST_TTL = 60 * 1000; // 1 min — doc types rarely change

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search } = parseSearchParams(searchParams);

    if (search) {
      const where: Record<string, unknown> = { OR: ['name', 'slug'].map((f) => ({ [f]: { contains: search } })) };
      const [items, total] = await Promise.all([
        prisma.docType.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.docType.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_p${page}_l${limit}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.docType.findMany({ orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.docType.count(),
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
    // Cycle 47-extension Part 2: dict entities — admin only.
    await requireRole(['admin']);
    const body = await request.json();
    const validation = validateBody(body, CreateDocTypeSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.docType.create({ data: validation.data });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
