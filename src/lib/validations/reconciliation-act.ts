import { z } from 'zod';

export const CreateReconciliationActSchema = z.object({
  number: z.string().max(50).default(''),
  organizationId: z.string().cuid().optional(),
  periodStart: z.string().min(1, 'Начало периода обязательно'),
  periodEnd: z.string().min(1, 'Конец периода обязателен'),
  totalDebit: z.number().min(0).default(0),
  totalCredit: z.number().min(0).default(0),
  status: z.enum(['draft', 'signed']).default('draft'),
});

export const UpdateReconciliationActSchema = CreateReconciliationActSchema.partial();

export type CreateReconciliationActInput = z.infer<typeof CreateReconciliationActSchema>;
export type UpdateReconciliationActInput = z.infer<typeof UpdateReconciliationActSchema>;
