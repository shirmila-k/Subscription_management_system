import { Router } from 'express';
import { plansController } from './plans.controller';
import { authenticate, requireStaffOrAdmin, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Public / Authenticated user plan viewing
router.get('/', (req, res, next) => {
  plansController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  plansController.getById(req, res, next);
});

// Admin & Staff Operations
router.post('/', authenticate, requireStaffOrAdmin, (req, res, next) => {
  plansController.create(req, res, next);
});

router.put('/:id', authenticate, requireStaffOrAdmin, (req, res, next) => {
  plansController.update(req, res, next);
});

router.delete('/:id', authenticate, requireAdmin, (req, res, next) => {
  plansController.delete(req, res, next);
});

export default router;
