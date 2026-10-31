import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';

export class AuthController {
  /**
   * Register a new Customer
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerCustomer(req.body);
      sendSuccess(res, 'User registered successfully', result, 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Create a new Staff Account (Admin Only)
   * POST /api/v1/auth/staff
   */
  async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staffUser = await authService.createStaff(req.body);
      sendSuccess(res, 'Staff account created successfully', staffUser, 201);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Authenticate User
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, 'Login successful', result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieve Current Authenticated User Profile
   * GET /api/v1/auth/me
   */
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

  /**
   * Request Password Reset Link / Token
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.generatePasswordResetToken(req.body.email);
      sendSuccess(res, result.message, result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Reset Password Using Single-Use Token
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, result.message, result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Invalidate Session / Logout
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = (req as any).rawToken || req.headers.authorization?.split(' ')[1] || '';
      const result = await authService.logout(token);
      sendSuccess(res, result.message, result);
    } catch (error: any) {
      next(error);
    }
  }
}

export const authController = new AuthController();
