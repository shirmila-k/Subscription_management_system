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
      const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
      const trend = await analyticsService.getMonthlyRevenueTrend(isNaN(months) || months < 1 ? 6 : months);
      sendSuccess(res, 'Revenue trend data retrieved', trend);
    } catch (error: any) {
      next(error);
    }
  }

  async getChurnAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const churn = await analyticsService.getChurnAnalytics();
      sendSuccess(res, 'Churn and retention analytics retrieved successfully', churn);
    } catch (error: any) {
      next(error);
    }
  }

  async getPaymentMethodBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const breakdown = await analyticsService.getPaymentMethodBreakdown();
      sendSuccess(res, 'Payment methods breakdown retrieved successfully', breakdown);
    } catch (error: any) {
      next(error);
    }
  }

  async exportFinancialReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await analyticsService.generateFinancialReportCsv();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `brightloop_financial_report_${dateStr}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error: any) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

