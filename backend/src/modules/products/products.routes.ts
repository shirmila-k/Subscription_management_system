import { Router } from 'express';
import { ProductsController } from './products.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Public / Customer read access
router.get('/', ProductsController.getAll);
router.get('/:id', ProductsController.getById);

// Admin / Staff write access
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), ProductsController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), ProductsController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), ProductsController.delete);

// Variants endpoints
router.post('/:id/variants', authenticate, authorize('ADMIN', 'STAFF'), ProductsController.addVariant);
router.put('/:id/variants/:variantId', authenticate, authorize('ADMIN', 'STAFF'), ProductsController.updateVariant);
router.delete('/:id/variants/:variantId', authenticate, authorize('ADMIN'), ProductsController.deleteVariant);

export default router;
