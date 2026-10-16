import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IdempotencyRecord } from '../models/IdempotencyRecord';

export const idempotency = (ttlSeconds: number = 86400) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      return next();
    }

    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    try {
      const existing = await IdempotencyRecord.findOne({ idempotencyKey });
      if (existing) {
        // Return cached response
        res.status(existing.responseStatus).json(existing.responseBody);
        return;
      }

      // Intercept res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: any): Response => {
        // Asynchronously save idempotency record
        if (res.statusCode >= 200 && res.statusCode < 300) {
          IdempotencyRecord.create({
            idempotencyKey,
            endpoint: req.originalUrl,
            requestHash,
            responseStatus: res.statusCode,
            responseBody: body,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000),
          }).catch((err) => {
            console.error('[Idempotency] Failed to save record:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
