"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('5000'),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173,http://localhost:3000'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    QR_TOKEN_SECRET: zod_1.z.string().min(16, 'QR_TOKEN_SECRET must be at least 16 characters').default('grand_omr_qr_secret_key_2026_default'),
    PAYMENT_PROVIDER: zod_1.z.enum(['DEVELOPMENT_ADAPTER', 'RAZORPAY', 'STRIPE', 'CASH']).default('DEVELOPMENT_ADAPTER'),
    PAYMENT_WEBHOOK_SECRET: zod_1.z.string().default('dev_webhook_signing_secret'),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    EMAIL_PROVIDER: zod_1.z.enum(['CONSOLE', 'SMTP', 'RESEND']).default('CONSOLE'),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    FROM_EMAIL: zod_1.z.string().email().default('reservations@grandomrresidency.com'),
    SMS_PROVIDER: zod_1.z.enum(['CONSOLE', 'TWILIO', 'MSG91']).default('CONSOLE'),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_FROM_NUMBER: zod_1.z.string().optional(),
    MSG91_AUTH_KEY: zod_1.z.string().optional(),
    MSG91_SENDER_ID: zod_1.z.string().optional(),
    PRIVATE_FILE_STORAGE: zod_1.z.enum(['LOCAL', 'S3']).default('LOCAL'),
    STORAGE_LOCAL_PATH: zod_1.z.string().default('./uploads'),
});
const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
        throw new Error('Environment configuration validation failed');
    }
    return result.data;
};
exports.env = parseEnv();
//# sourceMappingURL=env.js.map