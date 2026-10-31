import { z } from 'zod';
import { DiscountType } from '@prisma/client';

export const createDiscountSchema = z
  .object({
    name: z.string().min(1, 'Discount name is required').max(100).optional(),
    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
    description: z.string().max(500).optional(),
    type: z.nativeEnum(DiscountType),
    value: z.number().positive('Discount value must be greater than 0'),
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').optional().default(1),
    minPurchaseAmount: z.number().min(0, 'Minimum purchase amount cannot be negative').optional(),
    maxDiscountAmount: z.number().min(0, 'Maximum discount amount cannot be negative').optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).nullable().optional(),
    usageLimit: z.number().int().min(1, 'Usage limit must be at least 1').nullable().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (data.type === DiscountType.PERCENTAGE && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['value'],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

export const updateDiscountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
    description: z.string().max(500).optional(),
    type: z.nativeEnum(DiscountType).optional(),
    value: z.number().positive('Discount value must be greater than 0').optional(),
    minQuantity: z.number().int().min(1).optional(),
    minPurchaseAmount: z.number().min(0).nullable().optional(),
    maxDiscountAmount: z.number().min(0).nullable().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).nullable().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === DiscountType.PERCENTAGE && data.value !== undefined && data.value > 100) {
        return false;
      }
      return true;
    },
    {
      message: 'Percentage discount cannot exceed 100%',
      path: ['value'],
    }
  );

export const validateDiscountSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  subtotal: z.number().min(0, 'Subtotal cannot be negative').optional().default(0),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
