import { z } from 'zod';

export const SupplierOrderItemSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(500),
  quantity: z.number().int().min(1),
  unit: z.string().max(50).default('шт'),
  unitPrice: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
});

export const CreateSupplierOrderSchema = z.object({
  number: z.string().max(50).default(''),
  title: z.string().min(1, 'Название обязательно').max(500),
  status: z.enum(['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']).default('draft'),
  supplierId: z.string().cuid().optional(),
  totalAmount: z.number().min(0).default(0),
  deliveryDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(SupplierOrderItemSchema).optional(),
});

export const UpdateSupplierOrderSchema = CreateSupplierOrderSchema.partial();

export type CreateSupplierOrderInput = z.infer<typeof CreateSupplierOrderSchema>;
export type UpdateSupplierOrderInput = z.infer<typeof UpdateSupplierOrderSchema>;
