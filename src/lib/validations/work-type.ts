import { z } from 'zod';

export const CreateWorkTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  hourlyRate: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateWorkTypeSchema = CreateWorkTypeSchema.partial();

export type CreateWorkTypeInput = z.infer<typeof CreateWorkTypeSchema>;
export type UpdateWorkTypeInput = z.infer<typeof UpdateWorkTypeSchema>;
