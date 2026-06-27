import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { getOrderHistory, formatOrderAction } from '@/lib/order-history';

/**
 * GET /api/order-history?orderId=xxx
 * Получить историю действий по заказу
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return apiError('Параметр orderId обязателен', 400);
    }

    const history = await getOrderHistory(orderId);

    return apiOk(
      history.map((h) => ({
        ...h,
        label: formatOrderAction(h.action as Parameters<typeof formatOrderAction>[0], h.details),
      })),
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
