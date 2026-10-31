import { z } from 'zod';
import { SubscriptionStatus, PaymentTerms } from '@prisma/client';

export const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  discountCode: z.string().trim().optional(),
  paymentTerms: z.nativeEnum(PaymentTerms).optional(),
  startDate: z.string().or(z.date()).optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  status: z
    .nativeEnum(SubscriptionStatus)
    .refine(
      (val) => val === SubscriptionStatus.DRAFT || val === SubscriptionStatus.QUOTATION,
      'Initial status can only be DRAFT or QUOTATION'
    )
    .optional(),
});

export const pauseSubscriptionSchema = z.object({
  reason: z.string().trim().min(3, 'Pause reason must be at least 3 characters').max(500).optional(),
});

export const closeSubscriptionSchema = z.object({
  reason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters').max(500).optional(),
});

export const renewSubscriptionSchema = z.object({
  autoRenew: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const querySubscriptionsSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  customerId: z.string().optional(),
  planId: z.string().optional(),
  search: z.string().optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type PauseSubscriptionInput = z.infer<typeof pauseSubscriptionSchema>;
export type CloseSubscriptionInput = z.infer<typeof closeSubscriptionSchema>;
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
export type QuerySubscriptionsInput = z.infer<typeof querySubscriptionsSchema>;
