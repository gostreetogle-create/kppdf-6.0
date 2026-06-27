import { z } from 'zod';

export const CreateInventorFileSchema = z.object({
  filename: z.string().min(1, 'Имя файла обязательно').max(500),
  fileType: z.enum(['dwg', 'dxf', 'pdf']).default('dwg'),
  fileSize: z.number().int().min(0).optional(),
  url: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
});

export const UpdateInventorFileSchema = CreateInventorFileSchema.partial();

export type CreateInventorFileInput = z.infer<typeof CreateInventorFileSchema>;
export type UpdateInventorFileInput = z.infer<typeof UpdateInventorFileSchema>;
