import { Router } from 'express';
import { quotationTemplatesController } from './quotationTemplates.controller';
import { authenticate, requireAdmin, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Templates read endpoints (Staff & Admin)
router.get('/', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationTemplatesController.getAll(req, res, next);
});

router.get('/:id', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationTemplatesController.getById(req, res, next);
});

// Admin-only template management
router.post('/', authenticate, requireAdmin, (req, res, next) => {
  quotationTemplatesController.create(req, res, next);
});

router.put('/:id', authenticate, requireAdmin, (req, res, next) => {
  quotationTemplatesController.update(req, res, next);
});

router.delete('/:id', authenticate, requireAdmin, (req, res, next) => {
  quotationTemplatesController.delete(req, res, next);
});

export default router;
