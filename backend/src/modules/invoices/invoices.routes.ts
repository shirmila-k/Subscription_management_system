import { Router } from 'express';
import { InvoicesController } from './invoices.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', InvoicesController.getAll);
router.get('/:id', InvoicesController.getById);
router.get('/:id/pdf', InvoicesController.downloadPdf);
router.patch('/:id/confirm', authorize('ADMIN', 'STAFF'), InvoicesController.confirm);

export default router;
