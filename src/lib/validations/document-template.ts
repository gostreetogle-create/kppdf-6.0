import { z } from 'zod';

export const TemplateBlockSchema = z.object({
  type: z.enum(['text', 'table', 'separator']).default('text'),
  title: z.string().max(200).optional(),
  content: z.string().max(10000).optional(),
  height: z.number().int().min(0).optional(),
  showLine: z.boolean().default(false),
  settings: z.any().optional(),
});

export const CreateDocumentTemplateSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  pageSize: z.string().max(20).default('A4'),
  backgroundImage: z.string().max(2000).optional(),
  backgroundOpacity: z.number().min(0).max(1).default(1),
  isDefault: z.boolean().default(false),
  organizationId: z.string().cuid().optional(),
  docTypeId: z.string().cuid().optional(),
  blocks: z.array(TemplateBlockSchema).optional(),
});

// Update inherits strict validation from CreateDocumentTemplateSchema (no z.any() loophole).
// Both client routes must send a flat array `blocks: [...]`; the server handles
// deleteMany/createMany internally based on operation type.
export const UpdateDocumentTemplateSchema = CreateDocumentTemplateSchema.partial();

export type CreateDocumentTemplateInput = z.infer<typeof CreateDocumentTemplateSchema>;
export type UpdateDocumentTemplateInput = z.infer<typeof UpdateDocumentTemplateSchema>;
