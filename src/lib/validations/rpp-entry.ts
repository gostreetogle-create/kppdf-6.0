import { z } from 'zod';

export const CreateRppEntrySchema = z.object({
  number: z.string().max(50).default(''),
  title: z.string().min(1, 'Название обязательно').max(500),
  status: z.string().max(50).default('draft'),
  notes: z.string().max(2000).optional(),
});

export const UpdateRppEntrySchema = CreateRppEntrySchema.partial();

export type CreateRppEntryInput = z.infer<typeof CreateRppEntrySchema>;
export type UpdateRppEntryInput = z.infer<typeof UpdateRppEntrySchema>;
