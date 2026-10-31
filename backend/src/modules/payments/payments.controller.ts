import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess, sendError } from '../../utils/response';
import { UserRole } from '@prisma/client';
import { recordPaymentSchema, refundPaymentSchema, queryPaymentsSchema } from './payments.validation';

export class PaymentsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = queryPaymentsSchema.safeParse(req.query);
      const queryParams = parsed.success ? parsed.data : req.query;

      let targetCustomerId = queryParams.customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const payments = await paymentsService.getAllPayments({
        customerId: targetCustomerId,
        invoiceId: queryParams.invoiceId as string,
      });

      sendSuccess(res, 'Payments retrieved successfully', payments);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentsService.getPaymentById(req.params.id);

      if (req.user?.role === UserRole.CUSTOMER && payment.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only view your own payment records', 403);
        return;
      }

      sendSuccess(res, 'Payment details retrieved', payment);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = recordPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0]?.message || 'Invalid payment parameters', 400);
        return;
      }

      const payment = await paymentsService.recordPayment(
        parsed.data,
        req.user?.id,
        req.user?.role
      );

      sendSuccess(res, 'Payment recorded and invoice reconciled successfully', payment, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refundPaymentSchema.safeParse(req.body);
      const reason = parsed.success ? parsed.data.reason : req.body.reason;

      const refunded = await paymentsService.refundPayment(
        req.params.id,
        reason,
        req.user?.id
      );

      sendSuccess(res, 'Payment refunded successfully', refunded);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async processRazorpay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const payment = await paymentsService.recordPayment(
        {
          invoiceId: req.body.invoiceId,
          amount: req.body.amount,
          paymentMethod: 'RAZORPAY' as any,
          transactionReference: req.body.razorpay_payment_id,
          notes: req.body.notes || `Razorpay payment: ${req.body.razorpay_payment_id}`,
          gatewayResponse: req.body,
        },
        req.user.id,
        req.user.role
      );

      sendSuccess(res, 'Razorpay payment processed successfully', payment, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const paymentsController = new PaymentsController();
