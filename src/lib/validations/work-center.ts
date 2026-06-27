import { z } from 'zod';

export const CreateWorkCenterSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  capacity: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const UpdateWorkCenterSchema = CreateWorkCenterSchema.partial();

export type CreateWorkCenterInput = z.infer<typeof CreateWorkCenterSchema>;
export type UpdateWorkCenterInput = z.infer<typeof UpdateWorkCenterSchema>;
