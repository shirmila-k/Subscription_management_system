import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Only log detailed errors in non-test environments or for 500s
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error caught by global handler]:', err.message || err);
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? `Duplicate field: ${err.meta.target}` : 'Resource already exists';
    sendError(res, target, 409, err.meta);
    return;
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    sendError(res, 'Requested database record not found', 404);
    return;
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error occurred';

  sendError(
    res,
    message,
    statusCode,
    err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined)
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
