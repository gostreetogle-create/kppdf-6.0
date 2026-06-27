import { z } from 'zod';

export const CreateIncomingInvoiceSchema = z.object({
  number: z.string().max(50).default(''),
  supplierId: z.string().cuid().optional(),
  totalAmount: z.number().min(0).default(0),
  status: z.enum(['draft', 'paid', 'overdue']).default('draft'),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateIncomingInvoiceSchema = CreateIncomingInvoiceSchema.partial();

export type CreateIncomingInvoiceInput = z.infer<typeof CreateIncomingInvoiceSchema>;
export type UpdateIncomingInvoiceInput = z.infer<typeof UpdateIncomingInvoiceSchema>;
