import { Router } from 'express';
import { PlansController } from './plans.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

// Public / Customer read access
router.get('/', PlansController.getAll);
router.get('/:id', PlansController.getById);

// Admin / Staff write access
router.post('/', authenticate, authorize('ADMIN', 'STAFF'), PlansController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'STAFF'), PlansController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), PlansController.delete);

export default router;
