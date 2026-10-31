import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.get('/summary', AnalyticsController.getSummary);
router.get('/revenue-trends', AnalyticsController.getRevenueTrends);

export default router;
