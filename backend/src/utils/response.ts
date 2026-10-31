import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
  errors?: any;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message = 'Operation successful',
  statusCode = 200,
  meta?: Record<string, any>
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const sendError = (
  res: Response,
  message = 'An unexpected error occurred',
  statusCode = 500,
  errors?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
