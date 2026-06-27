import { z } from 'zod';

export const CreateStatusWorkflowSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  entity: z.string().min(1, 'Сущность обязательна').max(100),
  fromStatus: z.string().min(1, 'Исходный статус обязателен').max(100),
  toStatus: z.string().min(1, 'Целевой статус обязателен').max(100),
  roles: z.string().max(500).default('admin'),
  isActive: z.boolean().default(true),
});

export const UpdateStatusWorkflowSchema = CreateStatusWorkflowSchema.partial();

export type CreateStatusWorkflowInput = z.infer<typeof CreateStatusWorkflowSchema>;
export type UpdateStatusWorkflowInput = z.infer<typeof UpdateStatusWorkflowSchema>;
