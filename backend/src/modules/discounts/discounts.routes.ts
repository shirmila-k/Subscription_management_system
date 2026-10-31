import { Router } from 'express';
import { DiscountsController } from './discounts.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// Customers & Staff can validate discount codes for a quotation / cart
router.post('/validate', DiscountsController.validate);

// Admin-only management endpoints
router.get('/', authorize('ADMIN', 'STAFF'), DiscountsController.getAll);
router.get('/:id', authorize('ADMIN', 'STAFF'), DiscountsController.getById);
router.post('/', authorize('ADMIN'), DiscountsController.create);
router.put('/:id', authorize('ADMIN'), DiscountsController.update);
router.delete('/:id', authorize('ADMIN'), DiscountsController.delete);

export default router;
