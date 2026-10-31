import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class PaymentsController {
  public static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        invoiceId,
        amount,
        method,
        transactionReference,
        razorpayOrderId,
        razorpaySignature,
        notes,
      } = req.body;

      if (!invoiceId || !amount || !method) {
        throw new BadRequestError('invoiceId, amount, and method are required.');
      }

      const customerId = req.user?.role === 'CUSTOMER' ? req.user.userId : req.body.customerId;

      if (!customerId) {
        throw new BadRequestError('Customer ID is required.');
      }

      // If razorpay, optionally verify signature
      if (
        method === PaymentMethod.RAZORPAY &&
        razorpayOrderId &&
        transactionReference &&
        razorpaySignature
      ) {
        const isValid = PaymentsService.verifyRazorpaySignature(
          razorpayOrderId,
          transactionReference,
          razorpaySignature
        );
        if (!isValid) {
          throw new BadRequestError('Razorpay payment signature verification failed.');
        }
      }

      const payment = await PaymentsService.recordPayment({
        invoiceId,
        customerId,
        amount: Number(amount),
        method: method as PaymentMethod,
        transactionReference,
        razorpayOrderId,
        razorpaySignature,
        notes,
      });

      return sendSuccess(res, payment, 'Payment recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { invoiceId, customerId, status } = req.query;

      const effectiveCustomerId =
        req.user?.role === 'CUSTOMER' ? req.user.userId : (customerId as string);

      const payments = await PaymentsService.getAll({
        invoiceId: invoiceId as string,
        customerId: effectiveCustomerId,
        status: status as PaymentStatus,
      });

      return sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentsService.getById(req.params.id);
      return sendSuccess(res, payment);
    } catch (error) {
      next(error);
    }
  }
}
