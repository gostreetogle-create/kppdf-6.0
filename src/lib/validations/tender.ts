import { z } from 'zod';

export const CreateTenderSchema = z.object({
  number: z.string().max(50).default(''),
  title: z.string().min(1, 'Название обязательно').max(500),
  status: z.enum(['draft', 'submitted', 'won', 'lost', 'cancelled']).default('draft'),
  customerName: z.string().max(500).optional(),
  totalAmount: z.number().min(0).default(0),
  deadline: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateTenderSchema = CreateTenderSchema.partial();

export type CreateTenderInput = z.infer<typeof CreateTenderSchema>;
export type UpdateTenderInput = z.infer<typeof UpdateTenderSchema>;
