import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { nextProductionOrderNumber } from '@/lib/counter';
import { CreateProductionOrderSchema } from '@/lib/validations/production-order';
import { validateBody } from '@/lib/validations';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
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
      prisma.productionOrder.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { workType: true, workCenter: true, tasks: true },
      }),
      prisma.productionOrder.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Cycle 47-extension: manager/production могут создавать заказы (viewer floor).
    // Cycle 57: capture user for activity log.
    const user = await requireRole(['admin', 'manager', 'production']);
    const body = await request.json();
    const validation = validateBody(body, CreateProductionOrderSchema);
    if (!validation.success) return validation.error;

    const number = validation.data.number || await nextProductionOrderNumber();
    if (validation.data.number) {
      const existing = await prisma.productionOrder.findUnique({ where: { number } });
      if (existing) return apiError(`Документ с номером ${number} уже существует`, 400);
    }

    const item = await prisma.productionOrder.create({
      data: { ...validation.data, number },
      include: { workType: true, workCenter: true, tasks: true },
    });
    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'production_order',
      entityId: item.id,
      details: { number: item.number, title: item.title },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
