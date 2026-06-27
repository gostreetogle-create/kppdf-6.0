import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { nextCounter, formatDocNumber } from '@/lib/counter';

/**
 * GET /api/shipments — список отгрузок
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = ['number', 'notes'].map((f) => ({ [f]: { contains: search } }));
    }

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const [items, total] = await Promise.all([
      prisma.shipment.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.shipment.count({ where }),
    ]);

    // Парсим JSON поля
    const parsed = items.map((s) => ({
      ...s,
      items: JSON.parse(s.items || '[]'),
      photos: JSON.parse(s.photos || '[]'),
    }));

    return apiPaginated(parsed, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

/**
 * POST /api/shipments — создать отгрузку
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager', 'storekeeper']); // P2.3: отгрузка — storekeeper ответственный за shipping, manager/admin для администрирования
    const body = await request.json();

    // Авто-генерация номера (атомарно)
    if (!body.number) {
      const val = await nextCounter('shipment');
      body.number = formatDocNumber('ОТГ', val);
    }

    // Проверка дубликата номера
    const existing = await prisma.shipment.findUnique({ where: { number: body.number } });
    if (existing) return apiError(`Отгрузка с номером ${body.number} уже существует`, 400);

    const item = await prisma.shipment.create({
      data: {
        number: body.number,
        orderId: body.orderId || null,
        status: body.status || 'draft',
        items: JSON.stringify(body.items || []),
        photos: JSON.stringify(body.photos || []),
        notes: body.notes || null,
      },
    });

    // Если отгружено частично — обновляем статус заказа
    if (body.status === 'partially' && body.orderId) {
      try {
        await prisma.productionOrder.update({
          where: { id: body.orderId },
          data: { status: 'shipping' },
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
