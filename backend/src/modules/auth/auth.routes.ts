import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.types';

const router = Router();

router.post('/register', validateBody(RegisterSchema), (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', validateBody(LoginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res, next);
});

router.post('/forgot-password', validateBody(ForgotPasswordSchema), (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

router.post('/reset-password', validateBody(ResetPasswordSchema), (req, res, next) => {
  authController.resetPassword(req, res, next);
});

export default router;
