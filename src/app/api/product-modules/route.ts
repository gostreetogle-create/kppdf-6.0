import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateProductModuleSchema } from '@/lib/validations/product-module';
import { validateBody } from '@/lib/validations';
import { recordActivity } from '@/lib/activity-log'; // Cycle 57

const include = {
  product: true,
  workTypes: { include: { workType: true } },
  materials: true,
};

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);
    const productId = searchParams.get('productId');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['name', 'article'].map((f) => ({ [f]: { contains: search } }));
    }
    if (productId) {
      where.productId = productId;
    }

    const orderBy: Record<string, string> = {};
    if (sortField) {
      orderBy[sortField] = sortOrder;
    } else {
      orderBy.sortOrder = 'asc';
    }

    const [items, total] = await Promise.all([
      prisma.productModule.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include,
      }),
      prisma.productModule.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin', 'manager']); // Cycle 57: capture user for activity log
    const body = await request.json();
    const validation = validateBody(body, CreateProductModuleSchema);
    if (!validation.success) return validation.error;
    const { workTypes, materials, ...moduleData } = validation.data;

    const item = await prisma.productModule.create({
      data: {
        ...moduleData,
        workTypes: workTypes?.length
          ? { create: workTypes.map((wt: { workTypeId: string; estimatedHours: number; sortOrder?: number }) => ({
              workTypeId: wt.workTypeId,
              estimatedHours: wt.estimatedHours,
              sortOrder: wt.sortOrder ?? 0,
            })) }
          : undefined,
        materials: materials?.length
          ? { create: materials.map((m: { name: string; quantity?: number; unit?: string; isPurchased?: boolean }) => ({
              name: m.name,
              quantity: m.quantity ?? 1,
              unit: m.unit ?? 'шт',
              isPurchased: m.isPurchased ?? true,
            })) }
          : undefined,
      },
      include,
    });

    // Cycle 57 (B.7): audit event for timeline.
    await recordActivity({
      userId: user.id,
      userName: user.displayName || user.username || 'System',
      action: 'create',
      entity: 'product_module',
      entityId: item.id,
      details: { name: item.name, article: item.article },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
