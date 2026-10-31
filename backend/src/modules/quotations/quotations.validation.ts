import { z } from 'zod';
import { QuotationStatus, PaymentTerms } from '@prisma/client';

export const quotationLineItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  planId: z.string().uuid().nullable().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
  taxAmount: z.number().min(0, 'Tax amount cannot be negative').optional().default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid('Valid customer ID is required'),
  templateId: z.string().uuid().nullable().optional(),
  quotationDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  validityDays: z.number().int().min(1).max(365).optional(),
  taxRate: z.number().min(0).max(100).optional().default(18),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional().default(0),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(quotationLineItemSchema).min(1, 'At least one line item is required'),
});

export const updateQuotationSchema = z.object({
  templateId: z.string().uuid().nullable().optional(),
  expiryDate: z.string().or(z.date()).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountCode: z.string().optional(),
  discountAmount: z.number().min(0).optional(),
  terms: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(quotationLineItemSchema).min(1).optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
});

export const convertQuotationSchema = z.object({
  startDate: z.string().or(z.date()).optional(),
  paymentTerms: z.nativeEnum(PaymentTerms).optional().default(PaymentTerms.NET_30),
  autoRenew: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type ConvertQuotationInput = z.infer<typeof convertQuotationSchema>;
