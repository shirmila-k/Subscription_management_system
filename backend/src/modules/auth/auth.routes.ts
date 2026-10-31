import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middlewares/validate.middleware';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import {
  RegisterCustomerSchema,
  CreateStaffSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.types';

const router = Router();

// 1. Customer Registration (Strict customer role, rejects client-supplied roles)
router.post('/register', validateBody(RegisterCustomerSchema), (req, res, next) => {
  authController.register(req, res, next);
});

// 2. User Login
router.post('/login', validateBody(LoginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

// 3. Admin-Only Staff Account Creation
router.post('/staff', authenticate, requireAdmin, validateBody(CreateStaffSchema), (req, res, next) => {
  authController.createStaff(req, res, next);
});

// 4. Current User Profile
router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res, next);
});

// 5. Password Reset Token Request (Non-enumerating)
router.post('/forgot-password', validateBody(ForgotPasswordSchema), (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

// 6. Reset Password via Secure Single-Use Token
router.post('/reset-password', validateBody(ResetPasswordSchema), (req, res, next) => {
  authController.resetPassword(req, res, next);
});

// 7. Logout and Session Invalidation
router.post('/logout', authenticate, (req, res, next) => {
  authController.logout(req, res, next);
});

export default router;
