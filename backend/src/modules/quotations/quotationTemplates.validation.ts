import { z } from 'zod';

export const templateItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  planId: z.string().uuid().nullable().optional(),
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(18),
});

export const createQuotationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(150),
  description: z.string().max(500).optional(),
  defaultTerms: z.string().max(5000).optional(),
  defaultValidityDays: z.number().int().min(1).max(365).optional().default(30),
  defaultItems: z.array(templateItemSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateQuotationTemplateSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).optional(),
  defaultTerms: z.string().max(5000).optional(),
  defaultValidityDays: z.number().int().min(1).max(365).optional(),
  defaultItems: z.array(templateItemSchema).optional(),
  isActive: z.boolean().optional(),
});

export type CreateQuotationTemplateInput = z.infer<typeof createQuotationTemplateSchema>;
export type UpdateQuotationTemplateInput = z.infer<typeof updateQuotationTemplateSchema>;
