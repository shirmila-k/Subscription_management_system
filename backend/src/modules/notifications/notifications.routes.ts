import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// All notification management routes require authenticated administrator / staff access
router.use(authenticate, requireAdmin);

router.get('/stats', (req, res, next) => notificationsController.getNotificationStats(req, res, next));
router.get('/', (req, res, next) => notificationsController.getNotifications(req, res, next));
router.get('/:id', (req, res, next) => notificationsController.getNotificationById(req, res, next));
router.post('/:id/retry', (req, res, next) => notificationsController.retryNotification(req, res, next));
router.post('/:id/cancel', (req, res, next) => notificationsController.cancelNotification(req, res, next));
router.post('/process', (req, res, next) => notificationsController.runNotificationProcessing(req, res, next));

export default router;
