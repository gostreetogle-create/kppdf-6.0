import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { UpdateProductSchema } from '@/lib/validations/product';
import { validateBody } from '@/lib/validations';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        photos: true,
        modules: {
          include: {
            workTypes: { include: { workType: true } },
            materials: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
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
    const validation = validateBody(body, UpdateProductSchema);
    if (!validation.success) return validation.error;
    const { modules, ...productData } = validation.data;

    const item = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: productData });

      if (modules !== undefined) {
        await tx.moduleMaterial.deleteMany({ where: { module: { productId: id } } });
        await tx.moduleWorkType.deleteMany({ where: { module: { productId: id } } });
        await tx.productModule.deleteMany({ where: { productId: id } });

        for (let i = 0; i < modules.length; i++) {
          const mod = modules[i];
          await tx.productModule.create({
            data: {
              productId: id,
              name: mod.name,
              article: mod.article || null,
              width: mod.width ?? null,
              height: mod.height ?? null,
              depth: mod.depth ?? null,
              weight: mod.weight ?? null,
              image: mod.image || null,
              sortOrder: mod.sortOrder ?? i,
              workTypes: {
                create: (mod.workTypes || []).map((wt: { workTypeId: string; estimatedHours: number; sortOrder?: number }, j: number) => ({
                  workTypeId: wt.workTypeId,
                  estimatedHours: wt.estimatedHours,
                  sortOrder: wt.sortOrder ?? j,
                })),
              },
              materials: {
                create: (mod.materials || []).map((mat: { name: string; quantity: number; unit: string; isPurchased: boolean }) => ({
                  name: mat.name,
                  quantity: mat.quantity,
                  unit: mat.unit,
                  isPurchased: mat.isPurchased,
                })),
              },
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          photos: true,
          modules: {
            include: {
              workTypes: { include: { workType: true } },
              materials: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
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
    await prisma.product.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
