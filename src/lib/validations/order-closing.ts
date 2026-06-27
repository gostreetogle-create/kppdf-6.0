import { z } from 'zod';

export const CreateOrderClosingSchema = z.object({
  number: z.string().max(50).default(''),
  orderId: z.string().cuid().optional(),
  closingType: z.enum(['full', 'partial']).default('full'),
  totalAmount: z.number().min(0).default(0),
  status: z.enum(['draft', 'approved', 'completed']).default('draft'),
  notes: z.string().max(2000).optional(),
});

export const UpdateOrderClosingSchema = CreateOrderClosingSchema.partial();

export type CreateOrderClosingInput = z.infer<typeof CreateOrderClosingSchema>;
export type UpdateOrderClosingInput = z.infer<typeof UpdateOrderClosingSchema>;
