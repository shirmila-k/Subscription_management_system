import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/db';
import { env } from '../../config/env';
import {
  RegisterCustomerInput,
  CreateStaffInput,
  LoginInput,
  ResetPasswordInput,
} from './auth.types';
import { AuthUserPayload } from '../../types/express';
import { UserRole, UserStatus } from '@prisma/client';
import { tokenBlacklist } from '../../utils/tokenBlacklist';
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from '../../utils/errors';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Register a new Customer account with strict password policy and duplicate prevention.
   * Requirement 10: Never trusts or accepts a role from the client. Role is unconditionally CUSTOMER.
   */
  async registerCustomer(input: RegisterCustomerInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, AuthService.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        companyName: input.companyName?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        taxId: input.taxId?.trim() || null,
        role: UserRole.CUSTOMER, // Strictly enforced: clients cannot register as STAFF or ADMIN
        status: UserStatus.ACTIVE,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        address: true,
        taxId: true,
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
   * Create a STAFF account.
   * Requirement 9: Only an authenticated ADMIN may create STAFF accounts.
   */
  async createStaff(input: CreateStaffInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, AuthService.SALT_ROUNDS);

    const staffUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() || null,
        companyName: input.companyName?.trim() || 'Brightloop Operations',
        role: UserRole.STAFF, // Explicitly assigned STAFF role
        status: UserStatus.ACTIVE,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        companyName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return staffUser;
  }

  /**
   * Authenticate user with password comparison and generate JWT.
   */
  async login(input: LoginInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password credentials.');
    }

    if (!user.isActive || user.status === UserStatus.INACTIVE || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError('This account has been deactivated or suspended. Please contact support.');
    }

    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password credentials.');
    }

    // Update last login timestamp
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
        status: user.status,
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
   * Fetch user profile by ID.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
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
      throw new NotFoundError('User profile not found.');
    }

    return user;
  }

  /**
   * Generate password reset token.
   * Requirement 6: Securely generated, expiring reset tokens.
   * Protects against account enumeration: returns generic message regardless of email existence.
   * Secure storage: stores SHA-256 hash of token in database so raw token is never stored at rest.
   */
  async generatePasswordResetToken(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user does not exist, return generic message without error (protects against account enumeration)
    if (!user || !user.isActive) {
      return {
        message: 'If your email address is registered, password reset instructions have been issued.',
      };
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    // Store SHA-256 hash in database
    const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
    const resetExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: resetExpiry,
      },
    });

    return {
      message: 'If your email address is registered, password reset instructions have been issued.',
      // In development/test environments, expose token so automated tests and local dev can complete flow
      ...(process.env.NODE_ENV !== 'production' && { resetToken: rawResetToken }),
    };
  }

  /**
   * Reset password via secure single-use token verification.
   * Requirement 6: Single-use, expiring token. Token is cleared upon successful reset.
   */
  async resetPassword(input: ResetPasswordInput) {
    const hashedToken = crypto.createHash('sha256').update(input.token.trim()).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token.');
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, AuthService.SALT_ROUNDS);

    // Atomically update password and invalidate reset token (guarantees single-use)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    return {
      message: 'Password has been successfully reset. Please log in with your new credentials.',
    };
  }

  /**
   * Logout user and invalidate JWT session.
   * Requirement 7: Appropriate session and token invalidation.
   */
  async logout(token: string) {
    if (!token) {
      return { message: 'Logged out successfully.' };
    }

    try {
      const decoded: any = jwt.decode(token);
      const expiresAtMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
      tokenBlacklist.revoke(token, expiresAtMs);
    } catch {
      // In case token cannot be decoded, blacklist with default 24h
      tokenBlacklist.revoke(token, Date.now() + 24 * 60 * 60 * 1000);
    }

    return { message: 'Logged out successfully. Session invalidated.' };
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
