import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['production', 'manager']);
    const { id } = await params;
    const { workerId } = await request.json();

    const item = await prisma.orderTask.update({
      where: { id },
      data: { workerId: workerId || null },
      include: { order: true, workType: true, worker: true, workCenter: true },
    });
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
