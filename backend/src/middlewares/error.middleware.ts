import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma Known Errors if present
  if ((err as any).code === 'P2002') {
    const target = (err as any).meta?.target;
    return sendError(
      res,
      `A unique constraint violation occurred${target ? ` on field: ${target}` : ''}.`,
      409
    );
  }

  if ((err as any).code === 'P2025') {
    return sendError(res, 'Requested record does not exist.', 404);
  }

  console.error('[Unhandled Error]:', err);

  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error occurred'
      : err.message || 'Internal server error';

  return sendError(res, message, 500, process.env.NODE_ENV === 'development' ? err.stack : undefined);
};
