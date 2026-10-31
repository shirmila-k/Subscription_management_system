import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../utils/errors';
import { Role } from '@prisma/client';

export class AuthService {
  /**
   * Validate password strength: min 8 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  public static validatePassword(password: string): void {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestError(
        'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'
      );
    }
  }

  public static async register(data: {
    email: string;
    password: string;
    name: string;
    role?: Role;
    companyName?: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new BadRequestError('An account with this email address already exists.');
    }

    this.validatePassword(data.password);

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role || Role.CUSTOMER,
        companyName: data.companyName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  public static async login(credentials: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid credentials or account is deactivated.');
    }

    const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials.');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
      },
      token,
    };
  }

  public static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't leak existence of user
      return { message: 'If that email exists, a reset link has been dispatched.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour validity

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    return {
      message: 'Reset instructions generated successfully.',
      resetToken, // In production this is emailed; exposed for testing convenience
    };
  }

  public static async resetPassword(token: string, newPassword: string) {
    this.validatePassword(newPassword);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired.');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password has been successfully reset. You may now login.' };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User profile not found.');
    }

    return user;
  }
}
