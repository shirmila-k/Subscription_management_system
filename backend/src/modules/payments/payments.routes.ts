import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// View payments list
router.get('/', (req, res, next) => {
  paymentsController.getAll(req, res, next);
});

// View single payment
router.get('/:id', (req, res, next) => {
  paymentsController.getById(req, res, next);
});

// Record a payment against an invoice
router.post('/', (req, res, next) => {
  paymentsController.recordPayment(req, res, next);
});

// Refund a payment (Admin/Staff only)
router.post('/:id/refund', requireStaffOrAdmin, (req, res, next) => {
  paymentsController.refund(req, res, next);
});

// Process Razorpay transaction reconciliation
router.post('/razorpay', (req, res, next) => {
  paymentsController.processRazorpay(req, res, next);
});

export default router;
