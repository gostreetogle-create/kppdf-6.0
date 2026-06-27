import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateRppEntrySchema } from '@/lib/validations/rpp-entry';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['number', 'title'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.rppEntry.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.rppEntry.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const body = await request.json();
    const validation = validateBody(body, CreateRppEntrySchema);
    if (!validation.success) return validation.error;
    if (validation.data.number) {
      const existing = await prisma.rppEntry.findUnique({ where: { number: validation.data.number } });
      if (existing) return apiError(`Документ с номером ${validation.data.number} уже существует`, 400);
    }
    const item = await prisma.rppEntry.create({ data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
