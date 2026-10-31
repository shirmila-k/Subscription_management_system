import { z } from 'zod';
import { ProductStatus } from '@prisma/client';

/**
 * Product Variant Creation Schema
 */
export const CreateVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required').trim(),
  sku: z.string().min(1, 'Variant SKU is required').trim().toUpperCase(),
  priceAdjustment: z
    .number()
    .min(0, 'Price adjustment must be a non-negative number')
    .default(0.0),
  attributes: z.record(z.any()).optional().default({}),
});

export const UpdateVariantSchema = CreateVariantSchema.partial();

/**
 * Product Creation Schema (Admin Only)
 */
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  code: z.string().min(1, 'Product code is required').trim().toUpperCase(),
  type: z.string().trim().default('SOFTWARE'), // e.g. SOFTWARE, SERVICE, CONSUMABLE
  salesPrice: z
    .number()
    .min(0, 'Sales price must be a non-negative number')
    .default(0.0),
  costPrice: z
    .number()
    .min(0, 'Cost price must be a non-negative number')
    .optional()
    .default(0.0),
  notes: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().default('Brightloop'),
  status: z.nativeEnum(ProductStatus).optional().default(ProductStatus.ACTIVE),
  variants: z.array(CreateVariantSchema).optional().default([]),
});

/**
 * Product Update Schema (Admin Only)
 */
export const UpdateProductSchema = z.object({
  name: z.string().min(1, 'Product name cannot be empty').trim().optional(),
  code: z.string().min(1, 'Product code cannot be empty').trim().toUpperCase().optional(),
  type: z.string().trim().optional(),
  salesPrice: z.number().min(0, 'Sales price must be non-negative').optional(),
  costPrice: z.number().min(0, 'Cost price must be non-negative').optional(),
  notes: z.string().trim().optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;
export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;
