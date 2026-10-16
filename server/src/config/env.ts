import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CLIENT_URL: z.string().default('http://localhost:5173,http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  QR_TOKEN_SECRET: z.string().min(16, 'QR_TOKEN_SECRET must be at least 16 characters').default('grand_omr_qr_secret_key_2026_default'),
  PAYMENT_PROVIDER: z.enum(['DEVELOPMENT_ADAPTER', 'RAZORPAY', 'STRIPE', 'CASH']).default('DEVELOPMENT_ADAPTER'),
  PAYMENT_WEBHOOK_SECRET: z.string().default('dev_webhook_signing_secret'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['CONSOLE', 'SMTP', 'RESEND']).default('CONSOLE'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().default('reservations@grandomrresidency.com'),
  SMS_PROVIDER: z.enum(['CONSOLE', 'TWILIO', 'MSG91']).default('CONSOLE'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  PRIVATE_FILE_STORAGE: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const env = parseEnv();
