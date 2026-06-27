import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { UpdateProductModuleSchema } from '@/lib/validations/product-module';
import { validateBody } from '@/lib/validations';

const include = {
  product: true,
  workTypes: { include: { workType: true } },
  materials: true,
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.productModule.findUnique({ where: { id }, include });
    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(body, UpdateProductModuleSchema);
    if (!validation.success) return validation.error;
    const { workTypes, materials, ...moduleData } = validation.data;

    // Replace nested collections: delete old, create new
    if (workTypes !== undefined) {
      await prisma.moduleWorkType.deleteMany({ where: { moduleId: id } });
    }
    if (materials !== undefined) {
      await prisma.moduleMaterial.deleteMany({ where: { moduleId: id } });
    }

    const item = await prisma.productModule.update({
      where: { id },
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

    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    await prisma.productModule.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
