import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {requireAuth, requireRole} from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['notes'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { storageItem: { include: { warehouse: true, product: true } } },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['storekeeper']);
    const body = await request.json();
    const { storageItemId, type, quantity, notes, destinationStorageItemId } = body;

    if (!storageItemId || !type || !quantity) {
      return apiError('storageItemId, type, quantity обязательны', 400);
    }

    if (!['in', 'out', 'transfer'].includes(type)) {
      return apiError('type должен быть in, out или transfer', 400);
    }

    // Для transfer требуется destinationStorageItemId
    if (type === 'transfer' && !destinationStorageItemId) {
      return apiError('Для перемещения (transfer) укажите destinationStorageItemId', 400);
    }

    const storageItem = await prisma.storageItem.findUnique({ where: { id: storageItemId } });
    if (!storageItem) return apiError('StorageItem не найден', 404);

    const newQuantity = type === 'in'
      ? storageItem.quantity + quantity
      : storageItem.quantity - quantity;

    if (newQuantity < 0) {
      return apiError('Недостаточно товара на складе', 400);
    }

    // Для transfer: проверяем что destination существует
    if (type === 'transfer') {
      const destItem = await prisma.storageItem.findUnique({ where: { id: destinationStorageItemId } });
      if (!destItem) return apiError('Пункт назначения не найден', 404);

      // Транзакция: вычитаем из source, прибавляем в destination, создаём запись движения
      const [movement] = await prisma.$transaction([
        prisma.inventoryMovement.create({
          data: { storageItemId, type, quantity, notes },
          include: { storageItem: { include: { warehouse: true, product: true } } },
        }),
        prisma.storageItem.update({
          where: { id: storageItemId },
          data: { quantity: storageItem.quantity - quantity },
        }),
        prisma.storageItem.update({
          where: { id: destinationStorageItemId },
          data: { quantity: destItem.quantity + quantity },
        }),
      ]);
      return apiOk(movement);
    }

    // Для in / out: обычная операция
    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: { storageItemId, type, quantity, notes },
        include: { storageItem: { include: { warehouse: true, product: true } } },
      }),
      prisma.storageItem.update({
        where: { id: storageItemId },
        data: { quantity: newQuantity },
      }),
    ]);

    return apiOk(movement);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
