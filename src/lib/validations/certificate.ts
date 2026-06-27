import { z } from 'zod';

export const CreateCertificateSchema = z.object({
  number: z.string().max(50).default(''),
  title: z.string().min(1, 'Название обязательно').max(500),
  issuer: z.string().max(500).optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(['active', 'expired', 'revoked']).default('active'),
});

export const UpdateCertificateSchema = CreateCertificateSchema.partial();

export type CreateCertificateInput = z.infer<typeof CreateCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof UpdateCertificateSchema>;
