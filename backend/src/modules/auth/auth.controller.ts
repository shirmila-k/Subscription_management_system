import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role, companyName, phone } = req.body;
      if (!email || !password || !name) {
        throw new BadRequestError('Email, password, and name are required fields.');
      }

      const result = await AuthService.register({
        email,
        password,
        name,
        role,
        companyName,
        phone,
      });

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError('Email and password are required.');
      }

      const result = await AuthService.login({ email, password });
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new BadRequestError('Email is required.');
      }

      const result = await AuthService.forgotPassword(email);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        throw new BadRequestError('Reset token and new password are required.');
      }

      const result = await AuthService.resetPassword(token, newPassword);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const user = await AuthService.getProfile(userId);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}
