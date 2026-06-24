/**
 * Zod-схемы для auth + proposals (примеры, можно расширять в Phase 2).
 */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Пример proposal-схемы (финансы Q2: авто-разделение НДС по Договору)
export const proposalItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  discountPercent: z.number().min(0).max(100).optional(),
});

export const proposalCreateSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  customerId: z.string().uuid(),
  contractorId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  vatRate: z.number().min(0).max(100).default(20),
  items: z.array(proposalItemSchema).min(1, 'Минимум 1 позиция'),
});
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
