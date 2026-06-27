import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {await requireRole(["admin","manager","production"]);
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['title'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.orderTask.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { order: true, workType: true, worker: true, workCenter: true },
      }),
      prisma.orderTask.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {await requireRole(["admin","manager","production"]);
    const body = await request.json();
    const item = await prisma.orderTask.create({
      data: body,
      include: { order: true, workType: true, worker: true, workCenter: true },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
