import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {await requireRole(["admin","manager","production"]);
    const { id } = await params;
    const { status } = await request.json();

    if (!status) return apiError('Статус обязателен');

    const item = await prisma.orderTask.update({
      where: { id },
      data: { status },
      include: { order: true, workType: true, worker: true, workCenter: true },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
