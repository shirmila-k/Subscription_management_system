import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/db';
import { env } from '../../config/env';
import { RegisterInput, LoginInput, ResetPasswordInput } from './auth.types';
import { AuthUserPayload } from '../../types/express';
import { UserRole } from '@prisma/client';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Register a new user with strict password hashing and duplicate email prevention
   */
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, AuthService.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        companyName: input.companyName,
        phone: input.phone,
        address: input.address,
        taxId: input.taxId,
        role: input.role || UserRole.CUSTOMER,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return { user, token };
  }

  /**
   * Authenticate user with password comparison and generate JWT
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password credentials.');
    }

    if (!user.isActive) {
      throw new Error('This user account has been deactivated. Please contact support.');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password credentials.');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        phone: user.phone,
        address: user.address,
        taxId: user.taxId,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  /**
   * Fetch user profile by ID
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        address: true,
        taxId: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new Error('User profile not found.');
    }

    return user;
  }

  /**
   * Generate password reset token with 1-hour expiration
   */
  async generatePasswordResetToken(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't leak whether an email exists for security
      return { message: 'If this email is registered, a password reset link has been issued.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetExpiry,
      },
    });

    // In a production app, trigger email sending here. For dev/demo, return token or confirmation.
    return {
      message: 'Password reset token generated successfully.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  /**
   * Reset password via secure token verification
   */
  async resetPassword(input: ResetPasswordInput) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: input.token,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired password reset token.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, AuthService.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return { message: 'Password has been successfully reset. Please log in with your new credentials.' };
  }

  /**
   * Helper to sign JWT payload
   */
  private generateToken(payload: AuthUserPayload): string {
    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as any,
    });
  }
}

export const authService = new AuthService();
