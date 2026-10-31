import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUserPayload } from '../types/express';
import { sendError } from '../utils/response';
import { UserRole } from '@prisma/client';
import { tokenBlacklist } from '../utils/tokenBlacklist';

/**
 * Authentication Middleware:
 * Validates Bearer JWT token, checks session revocation blacklist, and attaches user payload.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token missing or malformed', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token || token.trim() === '') {
    sendError(res, 'Authentication token missing or malformed', 401);
    return;
  }

  if (tokenBlacklist.isRevoked(token)) {
    sendError(res, 'Session has been invalidated. Please log in again.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthUserPayload;
    req.user = decoded;
    (req as any).rawToken = token;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Authentication token has expired', 401);
      return;
    }
    sendError(res, 'Invalid authentication token', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Restricts access to specified roles. Never trusts client-supplied roles.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized access: user not authenticated', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' lacks permission for this action`,
        403
      );
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requireStaff = requireRole([UserRole.STAFF]);
export const requireCustomer = requireRole([UserRole.CUSTOMER]);
export const requireStaffOrAdmin = requireRole([UserRole.ADMIN, UserRole.STAFF]);

/**
 * Resource-Level Customer Ownership Authorization:
 * Enforces requirement: "Customers must only access their own subscriptions, invoices, and payments."
 * Admins and Staff are granted operational access.
 */
export const authorizeCustomerOwnership = (
  getCustomerIdFromRequest: (req: Request) => Promise<string | null | undefined> | string | null | undefined
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'Unauthorized access: user not authenticated', 401);
      return;
    }

    // Admins and Staff manage the system and have permitted operational access
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.STAFF) {
      return next();
    }

    // Customers may only access records that belong to them
    if (req.user.role === UserRole.CUSTOMER) {
      const resourceCustomerId = await getCustomerIdFromRequest(req);
      if (!resourceCustomerId || resourceCustomerId !== req.user.id) {
        sendError(res, 'Forbidden: You can only access your own subscriptions, invoices, and payments', 403);
        return;
      }
      return next();
    }

    sendError(res, 'Forbidden: Insufficient privileges', 403);
  };
};
