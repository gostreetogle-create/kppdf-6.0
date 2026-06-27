import { z } from 'zod';

export const CreateProductModuleSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  article: z.string().max(100).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  depth: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  image: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
  productId: z.string().cuid().optional(), // Цикл доработки: опционально
  workTypes: z.array(z.object({
    workTypeId: z.string().cuid(),
    estimatedHours: z.number().min(0),
    sortOrder: z.number().int().min(0).optional(),
  })).optional(),
  materials: z.array(z.object({
    name: z.string().min(1).max(200),
    quantity: z.number().min(0).default(1),
    unit: z.string().max(50).default('шт'),
    isPurchased: z.boolean().default(true),
  })).optional(),
});

export const UpdateProductModuleSchema = CreateProductModuleSchema.partial().omit({ productId: true });

export type CreateProductModuleInput = z.infer<typeof CreateProductModuleSchema>;
export type UpdateProductModuleInput = z.infer<typeof UpdateProductModuleSchema>;
