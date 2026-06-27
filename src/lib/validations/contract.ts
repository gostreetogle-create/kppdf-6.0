import { z } from 'zod';

export const ContractItemSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  quantity: z.number().min(0.01).default(1),
  unit: z.string().max(50).default('шт'),
  unitPrice: z.number().min(0).default(0),
  total: z.number().min(0).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const CreateContractSchema = z.object({
  number: z.string().max(50).optional(),
  title: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  customerId: z.string().cuid().optional(),
  organizationId: z.string().cuid().optional(),
  proposalId: z.string().cuid().optional(),
  totalAmount: z.number().min(0).default(0),
  signedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(ContractItemSchema).optional(),
});

export const UpdateContractSchema = CreateContractSchema.partial();

export const ContractStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;
