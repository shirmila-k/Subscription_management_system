import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await analyticsService.getExecutiveDashboardMetrics(req.query);
      sendSuccess(res, 'Analytics overview metrics retrieved successfully', metrics);
    } catch (error: any) {
      next(error);
    }
  }

  async getRevenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const revenueData = await analyticsService.getRevenueAnalytics(req.query);
      sendSuccess(res, 'Revenue analytics retrieved successfully', revenueData);
    } catch (error: any) {
      next(error);
    }
  }

  async getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subscriptionData = await analyticsService.getSubscriptionAnalytics(req.query);
      sendSuccess(res, 'Subscription analytics retrieved successfully', subscriptionData);
    } catch (error: any) {
      next(error);
    }
  }

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerData = await analyticsService.getCustomerAnalytics(req.query);
      sendSuccess(res, 'Customer analytics retrieved successfully', customerData);
    } catch (error: any) {
      next(error);
    }
  }

  async getBilling(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const billingData = await analyticsService.getBillingAnalytics(req.query);
      sendSuccess(res, 'Billing analytics retrieved successfully', billingData);
    } catch (error: any) {
      next(error);
    }
  }

  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productData = await analyticsService.getProductAnalytics();
      sendSuccess(res, 'Product performance analytics retrieved successfully', productData);
    } catch (error: any) {
      next(error);
    }
  }

  async getRevenueTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = req.query.months ? parseInt(req.query.months as string, 10) : 6;
      const trend = await analyticsService.getMonthlyRevenueTrend(months);
      sendSuccess(res, 'Revenue trend data retrieved', trend);
    } catch (error: any) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = (req.query.type as string) || 'summary';
      const { filename, csv } = await analyticsService.exportCsvReport(type, req.query);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error: any) {
      next(error);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userName = req.user ? `${req.user.email} (${req.user.role})` : 'Administrator';
      const { filename, buffer } = await analyticsService.exportPdfReport(req.query, userName);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).end(buffer);
    } catch (error: any) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
