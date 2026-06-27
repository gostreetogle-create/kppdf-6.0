import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'Артикул обязателен').max(100),
  name: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  productType: z.enum(['purchased', 'manufactured']).default('purchased'),
  basePrice: z.number().min(0).default(0),
  defaultMarkupPercent: z.number().min(0).max(100).default(0),
  unit: z.string().max(50).default('шт'),
  weightKg: z.number().min(0).optional(),
  dimensions: z.string().max(200).optional(),
  material: z.string().max(200).optional(),
  hasPassport: z.boolean().default(false),
  hasDrawing: z.boolean().default(false),
  ralCode: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().cuid().optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  modules: z.any().optional(),
});

export const ModuleWorkTypeSchema = z.object({
  workTypeId: z.string().cuid(),
  estimatedHours: z.number().min(0),
  sortOrder: z.number().int().min(0).optional(),
});

export const ModuleMaterialSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().min(0).default(1),
  unit: z.string().max(50).default('шт'),
  isPurchased: z.boolean().default(true),
});

export const ProductModuleInputSchema = z.object({
  name: z.string().min(1).max(200),
  article: z.string().max(100).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  weight: z.number().optional(),
  image: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
  workTypes: z.array(ModuleWorkTypeSchema).optional(),
  materials: z.array(ModuleMaterialSchema).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
