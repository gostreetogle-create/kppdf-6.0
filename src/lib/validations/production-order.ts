import { z } from 'zod';

export const CreateProductionOrderSchema = z.object({
  number: z.string().max(50).optional(),
  title: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  status: z.enum(['planned', 'in_progress', 'manufacturing', 'painting', 'shipping', 'completed', 'cancelled']).default('planned'),
  priority: z.number().int().min(0).max(4).default(0),
  workTypeId: z.string().cuid().optional(),
  workCenterId: z.string().cuid().optional(),
  proposalId: z.string().cuid().optional(),
  contractId: z.string().cuid().optional(),
  plannedStart: z.string().datetime().optional(),
  plannedEnd: z.string().datetime().optional(),
  actualStart: z.string().datetime().optional(),
  actualEnd: z.string().datetime().optional(),
  ralCode: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateProductionOrderSchema = CreateProductionOrderSchema.partial();

export const ProductionOrderStatusSchema = z.object({
  status: z.enum(['planned', 'in_progress', 'manufacturing', 'painting', 'shipping', 'completed', 'cancelled']),
});

export type CreateProductionOrderInput = z.infer<typeof CreateProductionOrderSchema>;
export type UpdateProductionOrderInput = z.infer<typeof UpdateProductionOrderSchema>;
