import { z } from 'zod';

export const CreateTableTemplateSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  columns: z.string().max(10000).optional(),
});

export const UpdateTableTemplateSchema = CreateTableTemplateSchema.partial();

export type CreateTableTemplateInput = z.infer<typeof CreateTableTemplateSchema>;
export type UpdateTableTemplateInput = z.infer<typeof UpdateTableTemplateSchema>;
