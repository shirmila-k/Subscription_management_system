import { Router } from 'express';
import { quotationsController } from './quotations.controller';
import { authenticate, requireStaffOrAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Quotation listing & details (Customer sees own, Staff/Admin sees all)
router.get('/', authenticate, (req, res, next) => {
  quotationsController.getAll(req, res, next);
});

router.get('/:id', authenticate, (req, res, next) => {
  quotationsController.getById(req, res, next);
});

// Quotation Creation & Editing (Staff & Admin)
router.post('/', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationsController.create(req, res, next);
});

router.put('/:id', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationsController.update(req, res, next);
});

// Quotation Status Lifecycle Transitions
router.post('/:id/send', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationsController.send(req, res, next);
});

router.post('/:id/accept', authenticate, (req, res, next) => {
  quotationsController.accept(req, res, next);
});

router.post('/:id/reject', authenticate, (req, res, next) => {
  quotationsController.reject(req, res, next);
});

// Quote-to-Subscription Conversion (Staff & Admin only)
router.post('/:id/convert', authenticate, requireStaffOrAdmin, (req, res, next) => {
  quotationsController.convertToSubscription(req, res, next);
});

export default router;
