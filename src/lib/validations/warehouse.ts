import { z } from 'zod';

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  address: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateWarehouseSchema = CreateWarehouseSchema.partial();

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>;
