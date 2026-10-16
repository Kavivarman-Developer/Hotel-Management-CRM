import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    [key: string]: any;
  };
  meta?: Record<string, any>;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Operation completed',
  statusCode: number = 200,
  pagination?: ApiResponse['pagination']
): Response => {
  const responseBody: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  if (pagination) {
    responseBody.pagination = pagination;
  }
  return res.status(statusCode).json(responseBody);
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): Response => {
  const responseBody: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responseBody);
};
