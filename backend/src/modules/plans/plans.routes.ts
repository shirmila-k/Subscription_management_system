import { Router } from 'express';
import { plansController } from './plans.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { CreatePlanSchema, UpdatePlanSchema } from './plans.types';

const router = Router();

// Public / Authenticated Plan Viewing & Availability
router.get('/', (req, res, next) => {
  plansController.getAll(req, res, next);
});

router.get('/:id', (req, res, next) => {
  plansController.getById(req, res, next);
});

router.get('/:id/availability', (req, res, next) => {
  plansController.checkAvailability(req, res, next);
});

// Admin-Only Plan Management
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(CreatePlanSchema),
  (req, res, next) => {
    plansController.create(req, res, next);
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateBody(UpdatePlanSchema),
  (req, res, next) => {
    plansController.update(req, res, next);
  }
);

router.patch(
  '/:id/archive',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    plansController.archive(req, res, next);
  }
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  (req, res, next) => {
    plansController.delete(req, res, next);
  }
);

export default router;
