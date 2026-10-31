import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await analyticsService.getExecutiveDashboardMetrics();
      sendSuccess(res, 'Analytics overview metrics retrieved successfully', metrics);
    } catch (error: any) {
      next(error);
    }
  }

  async getRevenueTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trend = await analyticsService.getMonthlyRevenueTrend();
      sendSuccess(res, 'Revenue trend data retrieved', trend);
    } catch (error: any) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
