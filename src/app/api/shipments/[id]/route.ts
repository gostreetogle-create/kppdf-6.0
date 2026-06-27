import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.shipment.findUnique({ where: { id } });
    if (!item) return apiError('Не найдено', 404);
    return apiOk({
      ...item,
      items: JSON.parse(item.items || '[]'),
      photos: JSON.parse(item.photos || '[]'),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await request.json();

    // Проверка номера
    if (body.number) {
      const existing = await prisma.shipment.findUnique({ where: { number: body.number } });
      if (existing && existing.id !== id) return apiError(`Отгрузка с номером ${body.number} уже существует`, 400);
    }

    const item = await prisma.shipment.update({
      where: { id },
      data: {
        ...(body.number && { number: body.number }),
        ...(body.orderId !== undefined && { orderId: body.orderId }),
        ...(body.status && { status: body.status }),
        ...(body.items && { items: JSON.stringify(body.items) }),
        ...(body.photos && { photos: JSON.stringify(body.photos) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    // Если всё отгружено — обновляем статус заказа
    if (body.status === 'shipped' && body.orderId) {
      try {
        await prisma.productionOrder.update({
          where: { id: body.orderId },
          data: { status: 'completed' },
        });
      } catch { /* ignore */ }
    }

    return apiOk({
      ...item,
      items: JSON.parse(item.items || '[]'),
      photos: JSON.parse(item.photos || '[]'),
    });
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
    await prisma.shipment.delete({ where: { id } });
    return apiOk(null, 'Удалено');
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
