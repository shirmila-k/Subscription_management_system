import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Strict RBAC: Analytics endpoints restricted exclusively to Admin & Staff
router.use(authenticate, requireStaffOrAdmin);

// Core Business Metrics & Overview
router.get('/overview', (req, res, next) => analyticsController.getOverview(req, res, next));
router.get('/revenue', (req, res, next) => analyticsController.getRevenue(req, res, next));
router.get('/subscriptions', (req, res, next) => analyticsController.getSubscriptions(req, res, next));
router.get('/customers', (req, res, next) => analyticsController.getCustomers(req, res, next));
router.get('/billing', (req, res, next) => analyticsController.getBilling(req, res, next));
router.get('/products', (req, res, next) => analyticsController.getProducts(req, res, next));
router.get('/revenue-trend', (req, res, next) => analyticsController.getRevenueTrend(req, res, next));

// Report Exports
router.get('/export/csv', (req, res, next) => analyticsController.exportCsv(req, res, next));
router.get('/export/pdf', (req, res, next) => analyticsController.exportPdf(req, res, next));

export default router;
