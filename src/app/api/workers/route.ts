import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateWorkerSchema } from '@/lib/validations/worker';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['firstName', 'lastName'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.worker.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.worker.count({ where }),
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
    const validation = validateBody(body, CreateWorkerSchema);
    if (!validation.success) return validation.error;
    const item = await prisma.worker.create({ data: validation.data });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
