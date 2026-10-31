import { Request, Response, NextFunction } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, planId, customerId } = req.query;

      // Customer can only view their own subscriptions
      const effectiveCustomerId =
        req.user?.role === 'CUSTOMER' ? req.user.userId : (customerId as string);

      const subscriptions = await SubscriptionsService.getAll({
        customerId: effectiveCustomerId,
        status: status as SubscriptionStatus,
        planId: planId as string,
      });

      return sendSuccess(res, subscriptions);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionsService.getById(req.params.id);
      return sendSuccess(res, subscription);
    } catch (error) {
      next(error);
    }
  }

  public static async createQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        customerId,
        planId,
        quantity,
        paymentTerms,
        discountCode,
        quotationNotes,
        quotationExpiresInDays,
        customItems,
      } = req.body;

      const targetCustomerId = req.user?.role === 'CUSTOMER' ? req.user.userId : customerId;

      if (!targetCustomerId || !planId) {
        throw new BadRequestError('Customer ID and Plan ID are required to create a quotation.');
      }

      const quotation = await SubscriptionsService.createQuotation({
        customerId: targetCustomerId,
        planId,
        quantity: quantity ? Number(quantity) : 1,
        paymentTerms,
        discountCode,
        quotationNotes,
        quotationExpiresInDays,
        customItems,
      });

      return sendSuccess(res, quotation, 'Quotation created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async confirmQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const quotation = await SubscriptionsService.confirmQuotation(req.params.id);
      return sendSuccess(res, quotation, 'Quotation confirmed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionsService.activateSubscription(req.params.id);
      return sendSuccess(res, subscription, 'Subscription activated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionsService.pauseSubscription(req.params.id);
      return sendSuccess(res, subscription, 'Subscription paused successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionsService.resumeSubscription(req.params.id);
      return sendSuccess(res, subscription, 'Subscription resumed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async close(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const subscription = await SubscriptionsService.closeSubscription(req.params.id, reason);
      return sendSuccess(res, subscription, 'Subscription closed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await SubscriptionsService.renewSubscription(req.params.id);
      return sendSuccess(res, subscription, 'Subscription renewed successfully');
    } catch (error) {
      next(error);
    }
  }
}
