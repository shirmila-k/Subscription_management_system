import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Listing & fetching
router.get('/', SubscriptionsController.getAll);
router.get('/:id', SubscriptionsController.getById);

// Quotation flow
router.post('/quotations', SubscriptionsController.createQuotation);
router.patch('/:id/confirm', SubscriptionsController.confirmQuotation);

// Lifecycle state transitions
router.patch('/:id/activate', authorize('ADMIN', 'STAFF'), SubscriptionsController.activate);
router.patch('/:id/pause', authorize('ADMIN', 'STAFF', 'CUSTOMER'), SubscriptionsController.pause);
router.patch('/:id/resume', authorize('ADMIN', 'STAFF', 'CUSTOMER'), SubscriptionsController.resume);
router.patch('/:id/close', authorize('ADMIN', 'STAFF', 'CUSTOMER'), SubscriptionsController.close);
router.patch('/:id/renew', authorize('ADMIN', 'STAFF'), SubscriptionsController.renew);

export default router;
