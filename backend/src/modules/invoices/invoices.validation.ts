import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';

export const generateInvoiceSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus, {
    errorMap: () => ({ message: 'Invalid invoice status' }),
  }),
  notes: z.string().max(500).optional(),
});

export const queryInvoicesSchema = z.object({
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  search: z.string().optional(),
});

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type QueryInvoicesInput = z.infer<typeof queryInvoicesSchema>;
