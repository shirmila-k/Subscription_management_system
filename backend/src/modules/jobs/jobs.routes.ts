import { Router } from 'express';
import { billingJobsService } from './billing.job';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import { sendSuccess } from '../../utils/response';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/run-billing', async (_req, res, next) => {
  try {
    const result = await billingJobsService.runAutomatedBillingCycle();
    sendSuccess(res, 'Automated billing cycle executed manually', result);
  } catch (err) {
    next(err);
  }
});

router.post('/run-reminders', async (_req, res, next) => {
  try {
    const result = await billingJobsService.runRenewalReminders();
    sendSuccess(res, 'Renewal reminders job executed manually', result);
  } catch (err) {
    next(err);
  }
});

router.post('/run-closures', async (_req, res, next) => {
  try {
    const result = await billingJobsService.runExpiredSubscriptionClosures();
    sendSuccess(res, 'Expired subscription closures executed manually', result);
  } catch (err) {
    next(err);
  }
});

router.post('/run-overdue', async (_req, res, next) => {
  try {
    const result = await billingJobsService.runOverdueInvoiceTracker();
    sendSuccess(res, 'Overdue invoices tracker executed manually', result);
  } catch (err) {
    next(err);
  }
});

export default router;
