import { Router } from 'express';
import { productsController } from './products.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateVariantSchema,
  UpdateVariantSchema,
} from './products.types';

const router = Router();

// Catalog viewing (Public / Authenticated)
router.get('/', (req, res, next) => {
  productsController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  productsController.getById(req, res, next);
});

// Admin-Only Product Management
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(CreateProductSchema),
  (req, res, next) => {
    productsController.create(req, res, next);
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateBody(UpdateProductSchema),
  (req, res, next) => {
    productsController.update(req, res, next);
  }
);

router.patch(
  '/:id/archive',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    productsController.archive(req, res, next);
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    productsController.delete(req, res, next);
  }
);

// Admin-Only Variant Management
router.post(
  '/:id/variants',
  authenticate,
  requireAdmin,
  validateBody(CreateVariantSchema),
  (req, res, next) => {
    productsController.addVariant(req, res, next);
  }
);

router.put(
  '/:id/variants/:variantId',
  authenticate,
  requireAdmin,
  validateBody(UpdateVariantSchema),
  (req, res, next) => {
    productsController.updateVariant(req, res, next);
  }
);

router.delete(
  '/:id/variants/:variantId',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    productsController.deleteVariant(req, res, next);
  }
);

export default router;
