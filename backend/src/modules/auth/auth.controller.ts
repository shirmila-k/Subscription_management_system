import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, 'User registered successfully', result, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, 'Login successful', result);
    } catch (error: any) {
      sendError(res, error.message || 'Invalid credentials', 401);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthenticated', 401);
        return;
      }
      const user = await authService.getProfile(req.user.id);
      sendSuccess(res, 'Current user profile retrieved', user);
    } catch (error: any) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.generatePasswordResetToken(req.body.email);
      sendSuccess(res, result.message, result);
    } catch (error: any) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, result.message, result);
    } catch (error: any) {
      sendError(res, error.message || 'Failed to reset password', 400);
    }
  }
}

export const authController = new AuthController();
