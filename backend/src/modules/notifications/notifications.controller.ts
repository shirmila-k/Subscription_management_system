import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  runJobsSchema,
} from './notifications.validation';
import { sendSuccess } from '../../utils/response';

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = listNotificationsQuerySchema.parse(req.query);
      const result = await notificationsService.getNotifications(query);
      sendSuccess(res, 'Notifications retrieved successfully', result.items, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  }

  async getNotificationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      const notification = await notificationsService.getNotificationById(id);
      sendSuccess(res, 'Notification retrieved successfully', notification);
    } catch (err) {
      next(err);
    }
  }

  async getNotificationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await notificationsService.getNotificationStats();
      sendSuccess(res, 'Notification metrics retrieved successfully', stats);
    } catch (err) {
      next(err);
    }
  }

  async retryNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      const retried = await notificationsService.retryNotification(id);
      sendSuccess(res, 'Notification scheduled for retry successfully', retried);
    } catch (err) {
      next(err);
    }
  }

  async cancelNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = notificationIdParamSchema.parse(req.params);
      const cancelled = await notificationsService.cancelNotification(id);
      sendSuccess(res, 'Pending notification cancelled successfully', cancelled);
    } catch (err) {
      next(err);
    }
  }

  async runNotificationProcessing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = runJobsSchema.parse(req.body || {});
      const result = await notificationsService.processPendingNotifications(body.batchSize);
      sendSuccess(res, 'Pending notifications processed successfully', result);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
