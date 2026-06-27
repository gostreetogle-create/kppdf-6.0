import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
// Cycle 55 (B.4): protection to frozen-statuses.
import { assertNumberImmutable, NumberLockedError } from '@/lib/number-protection';

const include = {
  workType: true,
  workCenter: true,
  contract: true,
  proposal: true,
  tasks: {
    include: {
      worker: true,
      workType: true,
      workCenter: true,
    },
    orderBy: { sortOrder: 'asc' as const },
  },
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.productionOrder.findUnique({ where: { id }, include });
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
    if (body.number) {
      // Cycle 55 (B.4): freeze number for in_progress/completed statuses.
      const cur = await prisma.productionOrder.findUnique({
        where: { id },
        select: { status: true, number: true },
      });
      if (!cur) return apiError('Не найдено', 404);
      try {
        assertNumberImmutable('productionOrder', cur.status, body.number, cur.number);
      } catch (e) {
        if (e instanceof NumberLockedError) return apiError(e.message, 400);
        throw e;
      }
      const existing = await prisma.productionOrder.findUnique({ where: { number: body.number } });
      if (existing && existing.id !== id) return apiError(`Документ с номером ${body.number} уже существует`, 400);
    }
    const item = await prisma.productionOrder.update({ where: { id }, data: body, include });
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
    await prisma.productionOrder.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
