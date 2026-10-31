import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Analytics endpoints strictly restricted to Admin & Staff roles
router.use(authenticate, requireStaffOrAdmin);

router.get('/overview', (req, res, next) => {
  analyticsController.getOverview(req, res, next);
});

router.get('/revenue-trend', (req, res, next) => {
  analyticsController.getRevenueTrend(req, res, next);
});

router.get('/churn', (req, res, next) => {
  analyticsController.getChurnAnalytics(req, res, next);
});

router.get('/payment-methods', (req, res, next) => {
  analyticsController.getPaymentMethodBreakdown(req, res, next);
});

router.get('/export/financial-summary', (req, res, next) => {
  analyticsController.exportFinancialReport(req, res, next);
});

export default router;

