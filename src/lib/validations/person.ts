import { z } from 'zod';

export const CreatePersonSchema = z.object({
  lastName: z.string().min(1, 'Фамилия обязательна').max(100),
  firstName: z.string().min(1, 'Имя обязательно').max(100),
  patronymic: z.string().max(100).optional(),
  phone: z.string().max(50).default(''),
  email: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();

export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;
