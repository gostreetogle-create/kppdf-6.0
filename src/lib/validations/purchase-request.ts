import { z } from 'zod';

export const PurchaseRequestItemSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(500),
  quantity: z.number().int().min(1),
  unit: z.string().max(50).default('шт'),
  unitPrice: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
});

export const CreatePurchaseRequestSchema = z.object({
  number: z.string().max(50).default(''),
  title: z.string().min(1, 'Название обязательно').max(500),
  status: z.enum(['draft', 'approved', 'ordered', 'received', 'cancelled']).default('draft'),
  totalAmount: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
  items: z.array(PurchaseRequestItemSchema).optional(),
});

export const UpdatePurchaseRequestSchema = CreatePurchaseRequestSchema.partial();

export type CreatePurchaseRequestInput = z.infer<typeof CreatePurchaseRequestSchema>;
export type UpdatePurchaseRequestInput = z.infer<typeof UpdatePurchaseRequestSchema>;
