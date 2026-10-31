import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export class AnalyticsController {
  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await AnalyticsService.getDashboardSummary();
      return sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  public static async getRevenueTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const trends = await AnalyticsService.getRevenueTrends();
      return sendSuccess(res, trends);
    } catch (error) {
      next(error);
    }
  }
}
