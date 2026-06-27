import { z } from 'zod';

export const ProposalItemSchema = z.object({
  productId: z.string().cuid().optional(),
  quantity: z.number().min(0.01).default(1),
  unitPrice: z.number().min(0).default(0),
  markupPercent: z.number().min(0).max(100).default(0),
  total: z.number().min(0).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const CreateProposalSchema = z.object({
  number: z.string().max(50).optional(),
  title: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'paid', 'converted']).default('draft'),
  customerId: z.string().cuid().optional(),
  organizationId: z.string().cuid().optional(),
  markupPercent: z.number().min(0).max(100).default(0),
  discountPercent: z.number().min(0).max(100).default(0),
  validUntil: z.string().datetime().optional(),
  ralCode: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(ProposalItemSchema).optional(),
});

export const UpdateProposalSchema = CreateProposalSchema.partial();

export const ProposalStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'paid', 'converted']),
});

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;
