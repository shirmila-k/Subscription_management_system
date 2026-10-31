import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requireStaffOrAdmin, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Public / Authenticated user catalog viewing
router.get('/', (req, res, next) => {
  productsController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  productsController.getById(req, res, next);
});

// Admin & Staff Operations
router.post('/', authenticate, requireStaffOrAdmin, (req, res, next) => {
  productsController.create(req, res, next);
});

router.put('/:id', authenticate, requireStaffOrAdmin, (req, res, next) => {
  productsController.update(req, res, next);
});

router.delete('/:id', authenticate, requireAdmin, (req, res, next) => {
  productsController.delete(req, res, next);
});

// Variants
router.post('/:id/variants', authenticate, requireStaffOrAdmin, (req, res, next) => {
  productsController.addVariant(req, res, next);
});

router.put('/:id/variants/:variantId', authenticate, requireStaffOrAdmin, (req, res, next) => {
  productsController.updateVariant(req, res, next);
});

router.delete('/:id/variants/:variantId', authenticate, requireAdmin, (req, res, next) => {
  productsController.deleteVariant(req, res, next);
});

export default router;
