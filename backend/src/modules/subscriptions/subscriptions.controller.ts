import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service';
import { sendSuccess, sendError } from '../../utils/response';
import { SubscriptionStatus, UserRole } from '@prisma/client';
import {
  createSubscriptionSchema,
  pauseSubscriptionSchema,
  closeSubscriptionSchema,
  renewSubscriptionSchema,
  querySubscriptionsSchema,
} from './subscriptions.validation';

export class SubscriptionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = querySubscriptionsSchema.safeParse(req.query);
      const queryParams = parsedQuery.success ? parsedQuery.data : req.query;

      // If customer role, strictly restrict to their own subscriptions
      let targetCustomerId = queryParams.customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const subscriptions = await subscriptionsService.getAllSubscriptions({
        customerId: targetCustomerId,
        planId: queryParams.planId as string,
        status: queryParams.status as SubscriptionStatus,
        search: queryParams.search as string,
      });

      sendSuccess(res, 'Subscriptions retrieved successfully', subscriptions);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscription = await subscriptionsService.getSubscriptionById(req.params.id);

      // Access control check for customers
      if (req.user?.role === UserRole.CUSTOMER && subscription.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only access your own subscriptions', 403);
        return;
      }

      sendSuccess(res, 'Subscription details retrieved successfully', subscription);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId =
        req.user?.role === UserRole.CUSTOMER ? req.user.id : req.body.customerId;

      const parsed = createSubscriptionSchema.safeParse({ ...req.body, customerId });
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0]?.message || 'Invalid subscription input', 400);
        return;
      }

      const subscription = await subscriptionsService.createSubscription(
        parsed.data,
        req.user?.id
      );

      sendSuccess(res, 'Subscription created successfully', subscription, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async sendQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await subscriptionsService.sendQuotation(req.params.id, req.user?.id);
      sendSuccess(res, 'Quotation sent to customer successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async acceptQuotation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.user?.role === UserRole.CUSTOMER ? req.user.id : undefined;
      const updated = await subscriptionsService.acceptQuotation(req.params.id, customerId);
      sendSuccess(res, 'Quotation accepted successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await subscriptionsService.activateSubscription(req.params.id, req.user?.id);
      sendSuccess(res, 'Subscription confirmed and activated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = pauseSubscriptionSchema.safeParse(req.body);
      const reason = parsed.success ? parsed.data.reason : req.body.reason;

      const sub = await subscriptionsService.getSubscriptionById(req.params.id);
      if (req.user?.role === UserRole.CUSTOMER && sub.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only pause your own subscriptions', 403);
        return;
      }

      const updated = await subscriptionsService.pauseSubscription(req.params.id, reason, req.user?.id);
      sendSuccess(res, 'Subscription paused successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await subscriptionsService.getSubscriptionById(req.params.id);
      if (req.user?.role === UserRole.CUSTOMER && sub.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only resume your own subscriptions', 403);
        return;
      }

      const updated = await subscriptionsService.resumeSubscription(req.params.id, req.user?.id);
      sendSuccess(res, 'Subscription resumed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = closeSubscriptionSchema.safeParse(req.body);
      const reason = parsed.success ? parsed.data.reason : req.body.reason;

      const sub = await subscriptionsService.getSubscriptionById(req.params.id);
      if (req.user?.role === UserRole.CUSTOMER && sub.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only close your own subscriptions', 403);
        return;
      }

      const updated = await subscriptionsService.closeSubscription(req.params.id, reason, req.user?.id);
      sendSuccess(res, 'Subscription closed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = renewSubscriptionSchema.safeParse(req.body);
      const autoRenew = parsed.success ? parsed.data.autoRenew : req.body.autoRenew;

      const sub = await subscriptionsService.getSubscriptionById(req.params.id);
      if (req.user?.role === UserRole.CUSTOMER && sub.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only renew your own subscriptions', 403);
        return;
      }

      const updated = await subscriptionsService.renewSubscription(req.params.id, req.user?.id, autoRenew);
      sendSuccess(res, 'Subscription renewed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
