import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response has already started sending, delegate to express default handler
  if (res.headersSent) {
    return next(err);
  }

  // Correlation ID from request
  const correlationId = req.correlationId;

  // Log error safely without leaking credentials
  const sanitizedErr = {
    message: err.message,
    name: err.name,
    code: err.code,
    correlationId,
    path: req.originalUrl,
    method: req.method,
    ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  };
  console.error('[Error]', JSON.stringify(sanitizedErr));

  // Custom AppError
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // MongoDB duplicate key error (code 11000)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const field = keys.length > 0 ? keys.join(', ') : 'field';
    sendError(
      res,
      'DUPLICATE_KEY_ERROR',
      `A resource with this ${field} already exists`,
      409,
      { field, keyValue: err.keyValue }
    );
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 'INVALID_IDENTIFIER', `Invalid identifier format: ${err.value}`, 400);
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => ({
      path: e.path,
      message: e.message,
    }));
    sendError(res, 'VALIDATION_ERROR', 'Database validation failed', 422, messages);
    return;
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'MALFORMED_JSON', 'Malformed JSON in request body', 400);
    return;
  }

  // Catch-all Internal Server Error
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal server error',
    500
  );
};
