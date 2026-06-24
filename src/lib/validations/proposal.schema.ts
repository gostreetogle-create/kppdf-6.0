/**
 * Zod-схемы для Proposal API endpoints (POST/PUT) и форм-валидации.
 * Согласовано с МОДУЛЬ-КОММЕРЧЕСКОЕ-ПРЕДЛОЖЕНИЕ.md §9 «Правила для всех КП»:
 * - Цена ≥ 0; количество > 0 (positive Decimal в Prisma → Zod positive number).
 * - Скидка 0..100% (наценка без ограничений сверху — для услуг нужны 200/500/1000%).
 * - Минимум 1 позиция.
 */
import { z } from 'zod';

/** Pure-function расчёт итога по позиции (qty * price * (1 + markup) * (1 - discount)).
 *  Используется на клиенте (live preview) и на сервере (атомарная транзакция).
 *
 *  markup = 0 если не задан (общая наценка применяется на уровне Proposal).
 *  discountPercent = null → не применять скидку (или общая = 0, если не указана).
 *  Округление до 2 знаков как у Prisma Decimal(15, 2).
 */
export function computeLineTotal(
  quantity: number,
  price: number,
  markupPercent: number,
  discountPercent: number | null,
): number {
  const afterMarkup = price * (1 + markupPercent / 100);
  const afterDiscount = discountPercent != null ? afterMarkup * (1 - discountPercent / 100) : afterMarkup;
  return Math.round(afterDiscount * quantity * 100) / 100;
}

/** Валидация одной позиции КП (POST/PUT body). */
export const proposalItemSchema = z.object({
  id: z.string().uuid().optional(), // отсутствует для новых позиций
  productId: z.string().min(1, 'Выберите товар из справочника'),
  quantity: z.number().positive('Количество должно быть > 0'),
  price: z.number().nonnegative('Цена не может быть отрицательной'),
  discountPercent: z
    .number()
    .min(0, 'Скидка не может быть отрицательной')
    .max(100, 'Скидка не может превышать 100%')
    .nullable()
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type ProposalItemInput = z.infer<typeof proposalItemSchema>;

/** POST /api/proposals — создание нового КП. */
export const proposalCreateSchema = z.object({
  title: z.string().min(1, 'Название КП обязательно').max(500),
  customerId: z.string().min(1, 'Выберите клиента (покупатель)'),
  contractorId: z.string().min(1, 'Выберите нашу организацию (продавец)'),
  templateId: z.string().nullable().optional(),
  vatRate: z.number().min(0).max(100).default(20),
  paymentTermDays: z.number().int().positive().max(365).nullable().optional(),
  packageTag: z.string().max(100).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  validUntil: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
  items: z.array(proposalItemSchema).min(1, 'Минимум 1 позиция в КП'),
});
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;

/** PUT /api/proposals/[id] — полное обновление КП (мета + items + designSnapshot). */
export const proposalUpdateSchema = proposalCreateSchema.extend({
  // `updatedAt` для optimistic locking (АНАЛИЗ-П1): если изменился с момента загрузки — 409.
  lastUpdatedAt: z.string().datetime(),
});
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;

/** Тип для autosave (PATCH-стиль): только designSnapshot + lastUpdatedAt. */
export const proposalAutosaveSchema = z.object({
  designSnapshot: z.unknown().nullable(),
  lastUpdatedAt: z.string().datetime(),
});
export type ProposalAutosaveInput = z.infer<typeof proposalAutosaveSchema>;

/** Список доступных статусов для валидации при смене статуса. */
export const proposalStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'PAID',
  'CONVERTED',
]);
