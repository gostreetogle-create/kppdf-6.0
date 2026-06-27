import { z } from 'zod';

export const CreateStorageItemSchema = z.object({
  quantity: z.number().int().min(0).default(0),
  reservedQty: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(0),
  warehouseId: z.string().cuid(),
  productId: z.string().cuid().optional(),
});

export const UpdateStorageItemSchema = CreateStorageItemSchema.partial();

export type CreateStorageItemInput = z.infer<typeof CreateStorageItemSchema>;
export type UpdateStorageItemInput = z.infer<typeof UpdateStorageItemSchema>;
