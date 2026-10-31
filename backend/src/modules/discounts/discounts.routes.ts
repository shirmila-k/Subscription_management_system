import { Router } from 'express';
import { discountsController } from './discounts.controller';
import { authenticate, requireStaffOrAdmin, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Validate discount code (Available for customers and staff)
router.post('/validate', authenticate, (req, res, next) => {
  discountsController.validateCode(req, res, next);
});

// Admin/Staff Discount Management
router.get('/', authenticate, requireStaffOrAdmin, (req, res, next) => {
  discountsController.getAll(req, res, next);
});

router.get('/:id', authenticate, requireStaffOrAdmin, (req, res, next) => {
  discountsController.getById(req, res, next);
});

router.post('/', authenticate, requireAdmin, (req, res, next) => {
  discountsController.create(req, res, next);
});

router.put('/:id', authenticate, requireAdmin, (req, res, next) => {
  discountsController.update(req, res, next);
});

router.delete('/:id', authenticate, requireAdmin, (req, res, next) => {
  discountsController.delete(req, res, next);
});

export default router;
