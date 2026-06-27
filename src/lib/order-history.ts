/**
 * order-history.ts — Логирование действий по производственным заказам
 * 
 * Автоматически записывает действия при смене статусов, создании, назначении задач.
 */

import { prisma } from './db';

export type OrderAction =
  | 'created'
  | 'status_changed'
  | 'task_completed'
  | 'task_assigned'
  | 'note_added'
  | 'converted'
  | 'closed'
  | 'material_deducted';

interface LogOrderActionParams {
  orderId: string;
  action: OrderAction;
  userId?: string;
  userName?: string;
  details?: Record<string, unknown>;
}

/**
 * Записать действие в историю заказа
 */
export async function logOrderAction({
  orderId,
  action,
  userId,
  userName,
  details,
}: LogOrderActionParams): Promise<void> {
  try {
    await prisma.orderHistory.create({
      data: {
        orderId,
        action,
        userId: userId || null,
        userName: userName || null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    // Не падаем при ошибке логирования
    console.error('Failed to log order action:', error);
  }
}

/**
 * Получить историю заказа
 */
export async function getOrderHistory(orderId: string) {
  const history = await prisma.orderHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
  });

  return history.map((h) => ({
    ...h,
    details: h.details ? JSON.parse(h.details) : null,
  }));
}

/**
 * Человеко-читаемый текст действия
 */
export function formatOrderAction(action: OrderAction, details?: Record<string, unknown> | null): string {
  const labels: Record<OrderAction, string> = {
    created: 'Заказ создан',
    status_changed: `Статус изменён на "${details?.toStatus || '?'}"`,
    task_completed: `Задача "${details?.taskTitle || '?'}" выполнена`,
    task_assigned: `Задача назначена на "${details?.workerName || '?'}"`,
    note_added: 'Добавлено примечание',
    converted: 'Создан из КП/Договора',
    closed: 'Заказ закрыт',
    material_deducted: 'Материалы списаны со склада',
  };
  return labels[action] || action;
}
