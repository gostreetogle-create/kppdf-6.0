/**
 * src/lib/constants/frozen-statuses.ts (Cycle 55 / B.4)
 *
 * Конфиг frozen-statuses per document: после перехода документа в один из
 * перечисленных статусов, его `number` замораживается и не может быть изменён
 * через API PATCH/PUT. Используется `assertNumberImmutable()` в
 * `src/lib/number-protection.ts`.
 *
 * Это бизнес-инвариант: «отправленный документ — номер заморожен».
 *
 * Добавление статуса в список = manual decision. Не enum'ить чтобы избежать
 * необходимости миграции при добавлении нового статуса.
 */

export const frozenStatuses = {
  proposal: ['sent', 'accepted', 'converted', 'paid'],
  contract: ['active', 'completed'],
  productionOrder: ['in_progress', 'completed'],
  supplierOrder: ['confirmed', 'shipped', 'delivered'],
  incomingInvoice: ['paid'],
} as const satisfies Record<ProtectedEntity, readonly string[]>;

export type ProtectedEntity =
  | 'proposal'
  | 'contract'
  | 'productionOrder'
  | 'supplierOrder'
  | 'incomingInvoice';
