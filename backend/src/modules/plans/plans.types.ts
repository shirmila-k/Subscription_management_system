import { z } from 'zod';
import { BillingFrequency, PlanStatus } from '@prisma/client';

/**
 * Plan Creation Schema (Admin Only)
 */
export const CreatePlanSchema = z
  .object({
    productId: z.string().uuid('Valid Product ID is required'),
    variantId: z.string().uuid().optional().nullable(),
    name: z.string().min(1, 'Plan name is required').trim(),
    code: z.string().min(1, 'Plan code is required').trim().toUpperCase(),
    description: z.string().trim().optional(),
    billingFrequency: z.nativeEnum(BillingFrequency),
    billingCycleDays: z.number().int().min(1, 'Billing cycle days must be at least 1').optional(),
    price: z.number().min(0, 'Price must be a non-negative number'),
    currency: z.string().trim().default('INR'),
    minQuantity: z.number().int().min(1, 'Minimum quantity must be at least 1').default(1),
    availableFrom: z.string().datetime().or(z.date()).optional().nullable(),
    availableTo: z.string().datetime().or(z.date()).optional().nullable(),
    autoCloseOnExpiry: z.boolean().default(true),
    canPause: z.boolean().default(true),
    canCloseEarly: z.boolean().default(true),
    autoRenew: z.boolean().default(true),
    trialDays: z.number().int().min(0, 'Trial days must be non-negative').default(0),
    status: z.nativeEnum(PlanStatus).optional().default(PlanStatus.ACTIVE),
  })
  .refine(
    (data) => {
      if (data.availableFrom && data.availableTo) {
        return new Date(data.availableTo) >= new Date(data.availableFrom);
      }
      return true;
    },
    {
      message: 'Availability end date (availableTo) must be after or equal to availableFrom',
      path: ['availableTo'],
    }
  );

/**
 * Plan Update Schema (Admin Only)
 */
export const UpdatePlanSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    code: z.string().min(1).trim().toUpperCase().optional(),
    description: z.string().trim().optional().nullable(),
    billingFrequency: z.nativeEnum(BillingFrequency).optional(),
    billingCycleDays: z.number().int().min(1).optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    currency: z.string().trim().optional(),
    minQuantity: z.number().int().min(1).optional(),
    availableFrom: z.string().datetime().or(z.date()).optional().nullable(),
    availableTo: z.string().datetime().or(z.date()).optional().nullable(),
    autoCloseOnExpiry: z.boolean().optional(),
    canPause: z.boolean().optional(),
    canCloseEarly: z.boolean().optional(),
    autoRenew: z.boolean().optional(),
    trialDays: z.number().int().min(0).optional(),
    status: z.nativeEnum(PlanStatus).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.availableFrom && data.availableTo) {
        return new Date(data.availableTo) >= new Date(data.availableFrom);
      }
      return true;
    },
    {
      message: 'Availability end date (availableTo) must be after or equal to availableFrom',
      path: ['availableTo'],
    }
  );

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
