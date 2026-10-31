import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  currency: z.string().length(3).optional().default('INR'),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid payment method' }),
  }),
  transactionReference: z.string().trim().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const refundPaymentSchema = z.object({
  reason: z.string().trim().min(3, 'Refund reason is required').max(500).optional(),
});

export const queryPaymentsSchema = z.object({
  customerId: z.string().optional(),
  invoiceId: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
