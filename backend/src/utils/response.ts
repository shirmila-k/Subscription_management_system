import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: any;
  };
  error?: any;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  meta?: ApiResponse['meta'],
  error?: any
) => {
  const payload: ApiResponse<T> = {
    success,
    message,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
    ...(error !== undefined && { error }),
  };
  return res.status(statusCode).json(payload);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
) => {
  return sendResponse(res, statusCode, true, message, data, meta);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: any
) => {
  return sendResponse(res, statusCode, false, message, undefined, undefined, error);
};
