import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service';
import { sendSuccess, sendError } from '../../utils/response';
import { SubscriptionStatus, UserRole } from '@prisma/client';

export class SubscriptionsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, customerId, search } = req.query;

      // If customer role, restrict to their own subscriptions
      let targetCustomerId = customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const subscriptions = await subscriptionsService.getAllSubscriptions({
        customerId: targetCustomerId,
        status: status as SubscriptionStatus,
        search: search as string,
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
        sendError(res, 'Access denied: not your subscription', 403);
        return;
      }

      sendSuccess(res, 'Subscription details retrieved', subscription);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId =
        req.user?.role === UserRole.CUSTOMER ? req.user.id : req.body.customerId;

      if (!customerId) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const subscription = await subscriptionsService.createSubscription(
        { ...req.body, customerId },
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
      const { reason } = req.body;
      const updated = await subscriptionsService.pauseSubscription(req.params.id, reason, req.user?.id);
      sendSuccess(res, 'Subscription paused successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await subscriptionsService.resumeSubscription(req.params.id, req.user?.id);
      sendSuccess(res, 'Subscription resumed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async close(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const updated = await subscriptionsService.closeSubscription(req.params.id, reason, req.user?.id);
      sendSuccess(res, 'Subscription closed successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
