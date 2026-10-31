import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess, sendError } from '../../utils/response';
import { UserRole } from '@prisma/client';

export class PaymentsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invoiceId, customerId } = req.query;

      let targetCustomerId = customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const payments = await paymentsService.getAllPayments({
        customerId: targetCustomerId,
        invoiceId: invoiceId as string,
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
        sendError(res, 'Access denied: not your payment record', 403);
        return;
      }

      sendSuccess(res, 'Payment details retrieved', payment);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await paymentsService.recordPayment(req.body, req.user?.id);
      sendSuccess(res, 'Payment recorded and invoice reconciled successfully', payment, 201);
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
      const payment = await paymentsService.processRazorpayPayment(req.body, req.user.id);
      sendSuccess(res, 'Razorpay payment processed successfully', payment, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const paymentsController = new PaymentsController();
