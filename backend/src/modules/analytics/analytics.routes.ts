import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Analytics endpoints restricted to Admin & Staff
router.use(authenticate, requireStaffOrAdmin);

router.get('/overview', (req, res, next) => {
  analyticsController.getOverview(req, res, next);
});

router.get('/revenue-trend', (req, res, next) => {
  analyticsController.getRevenueTrend(req, res, next);
});

export default router;
