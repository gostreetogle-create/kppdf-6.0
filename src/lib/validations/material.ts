import { z } from 'zod';

export const CreateMaterialSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  article: z.string().max(100).optional(),
  unit: z.string().max(50).default('шт'),
  description: z.string().max(1000).optional(),
  price: z.number().min(0).optional(),
  image: z.string().max(2000).optional(),
  supplierId: z.string().cuid().optional(),
  categoryId: z.string().cuid().optional(),
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

export type CreateMaterialInput = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof UpdateMaterialSchema>;

export const CreateMaterialCategorySchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  slug: z.string().min(1).max(100),
});

export const UpdateMaterialCategorySchema = CreateMaterialCategorySchema.partial();
