import { Router } from 'express';
import { QuotationTemplatesController } from './quotationTemplates.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';

const router = Router();

// Staff and Admin can view templates to create quotations for customers
router.get('/', authenticate, requireRoles('ADMIN', 'STAFF'), QuotationTemplatesController.getAll);
router.get('/:id', authenticate, requireRoles('ADMIN', 'STAFF'), QuotationTemplatesController.getById);

// Admin can create, update, delete templates
router.post('/', authenticate, requireRoles('ADMIN'), QuotationTemplatesController.create);
router.put('/:id', authenticate, requireRoles('ADMIN'), QuotationTemplatesController.update);
router.delete('/:id', authenticate, requireRoles('ADMIN'), QuotationTemplatesController.delete);

export default router;
