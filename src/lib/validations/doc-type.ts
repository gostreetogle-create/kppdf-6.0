import { z } from 'zod';

export const CreateDocTypeSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  slug: z.string().min(1, 'Slug обязателен').max(200),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDocTypeSchema = CreateDocTypeSchema.partial();

export type CreateDocTypeInput = z.infer<typeof CreateDocTypeSchema>;
export type UpdateDocTypeInput = z.infer<typeof UpdateDocTypeSchema>;
