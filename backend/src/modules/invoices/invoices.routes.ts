import { Router } from 'express';
import { invoicesController } from './invoices.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// List invoices
router.get('/', (req, res, next) => {
  invoicesController.getAll(req, res, next);
});

// Download PDF
router.get('/:id/pdf', (req, res, next) => {
  invoicesController.downloadPdf(req, res, next);
});

// View single invoice
router.get('/:id', (req, res, next) => {
  invoicesController.getById(req, res, next);
});

// Manually trigger invoice generation for a subscription
router.post('/generate', requireStaffOrAdmin, (req, res, next) => {
  invoicesController.generateForSubscription(req, res, next);
});

// Update invoice status (e.g., mark VOID or CONFIRMED)
router.patch('/:id/status', requireStaffOrAdmin, (req, res, next) => {
  invoicesController.updateStatus(req, res, next);
});

export default router;
