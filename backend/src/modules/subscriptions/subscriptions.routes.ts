import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// All subscription operations require authentication
router.use(authenticate);

// List subscriptions (Customers get theirs, Admin/Staff get all)
router.get('/', (req, res, next) => {
  subscriptionsController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  subscriptionsController.getById(req, res, next);
});

// Create new quotation/draft (Staff or self-serve Customer)
router.post('/', (req, res, next) => {
  subscriptionsController.create(req, res, next);
});

// Quotation actions
router.post('/:id/send-quote', requireStaffOrAdmin, (req, res, next) => {
  subscriptionsController.sendQuotation(req, res, next);
});

router.post('/:id/accept-quote', (req, res, next) => {
  subscriptionsController.acceptQuotation(req, res, next);
});

// Lifecycle actions
router.post('/:id/activate', requireStaffOrAdmin, (req, res, next) => {
  subscriptionsController.activate(req, res, next);
});

router.post('/:id/pause', (req, res, next) => {
  subscriptionsController.pause(req, res, next);
});

router.post('/:id/resume', (req, res, next) => {
  subscriptionsController.resume(req, res, next);
});

router.post('/:id/close', (req, res, next) => {
  subscriptionsController.close(req, res, next);
});

router.post('/:id/cancel', (req, res, next) => {
  subscriptionsController.close(req, res, next);
});

router.post('/:id/renew', (req, res, next) => {
  subscriptionsController.renew(req, res, next);
});

export default router;
