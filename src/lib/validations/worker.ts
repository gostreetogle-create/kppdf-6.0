import { z } from 'zod';

export const CreateWorkerSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').max(200),
  lastName: z.string().min(1, 'Фамилия обязательна').max(200),
  phone: z.string().max(50).optional(),
  role: z.string().max(100).default('worker'),
  isActive: z.boolean().default(true),
});

export const UpdateWorkerSchema = CreateWorkerSchema.partial();

export type CreateWorkerInput = z.infer<typeof CreateWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof UpdateWorkerSchema>;
