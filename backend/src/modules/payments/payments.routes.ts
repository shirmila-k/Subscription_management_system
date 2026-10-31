import { Router } from 'express';
import { PaymentsController } from './payments.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', PaymentsController.recordPayment);
router.get('/', PaymentsController.getAll);
router.get('/:id', PaymentsController.getById);

export default router;
