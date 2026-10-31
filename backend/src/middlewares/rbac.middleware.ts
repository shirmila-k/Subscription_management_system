import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User is not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)`
        )
      );
    }

    next();
  };
};

export const requireRoles = authorize;
