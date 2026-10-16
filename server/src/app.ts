import express, { Express, Request, Response, NextFunction } from 'express';
import os from 'os';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config/env';
import { correlationIdMiddleware } from './middleware/correlationId';
import { errorHandler } from './middleware/error';
import { setupSwagger } from './utils/swagger';
import { sendSuccess, sendError } from './utils/response';

import authRouter from './routes/auth.routes';
import availabilityRouter from './routes/availability.routes';
import bookingRouter from './routes/booking.routes';
import qrRouter from './routes/qr.routes';
import stayRouter from './routes/stay.routes';
import roomRouter from './routes/room.routes';
import partnerRouter from './routes/partner.routes';
import paymentRouter from './routes/payment.routes';
import adminRouter from './routes/admin.routes';
import voucherRouter from './routes/voucher.routes';
import extraStayRouter from './routes/extraStay.routes';
import settingsRouter from './routes/settings.routes';

const createApp = (): Express => {
  const app = express();

  // 1. Security & Performance Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Swagger UI compatibility
  }));

  // CORS allowlist
  const allowedOrigins = env.CLIENT_URL.split(',').map((url) => url.trim());
  const isLanOrigin = (url: string) =>
    /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost)(:\d+)?$/.test(url);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLanOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id', 'Idempotency-Key', 'x-qr-token', 'x-payment-signature'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // 2. Correlation ID for all requests
  app.use(correlationIdMiddleware);

  // 3. Swagger Documentation
  setupSwagger(app);

  // 4. Health Check Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    sendSuccess(
      res,
      {
        status: 'UP',
        service: 'GRAND OMR RESIDENCY Backend',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      'Service healthy'
    );
  });

  // System Network Info (returns server's LAN IP for mobile QR codes)
  app.get('/api/system/network-info', (req: Request, res: Response) => {
    const interfaces = os.networkInterfaces();
    let localIp = '127.0.0.1';
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          localIp = net.address;
          break;
        }
      }
      if (localIp !== '127.0.0.1') break;
    }

    sendSuccess(
      res,
      {
        localIp,
        clientPort: 5173,
        suggestedOrigin: `http://${localIp}:5173`,
      },
      'Network info retrieved'
    );
  });

  // 5. Mount API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', availabilityRouter);
  app.use('/api', bookingRouter);
  app.use('/api', qrRouter);
  app.use('/api', stayRouter);
  app.use('/api', roomRouter);
  app.use('/api', partnerRouter);
  app.use('/api', paymentRouter);
  app.use('/api', voucherRouter);
  app.use('/api', extraStayRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/admin', settingsRouter);

  // 6. 404 Catch-All Handler
  app.use((req: Request, res: Response) => {
    sendError(res, 'ENDPOINT_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`, 404);
  });

  // 7. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
