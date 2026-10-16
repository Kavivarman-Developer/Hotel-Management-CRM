"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const os_1 = __importDefault(require("os"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const env_1 = require("./config/env");
const correlationId_1 = require("./middleware/correlationId");
const error_1 = require("./middleware/error");
const swagger_1 = require("./utils/swagger");
const response_1 = require("./utils/response");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const availability_routes_1 = __importDefault(require("./routes/availability.routes"));
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
const qr_routes_1 = __importDefault(require("./routes/qr.routes"));
const stay_routes_1 = __importDefault(require("./routes/stay.routes"));
const room_routes_1 = __importDefault(require("./routes/room.routes"));
const partner_routes_1 = __importDefault(require("./routes/partner.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const voucher_routes_1 = __importDefault(require("./routes/voucher.routes"));
const extraStay_routes_1 = __importDefault(require("./routes/extraStay.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const createApp = () => {
    const app = (0, express_1.default)();
    // 1. Security & Performance Middlewares
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: false, // Swagger UI compatibility
    }));
    // CORS allowlist
    const allowedOrigins = env_1.env.CLIENT_URL.split(',').map((url) => url.trim());
    const isLanOrigin = (url) => /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|localhost)(:\d+)?$/.test(url);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || isLanOrigin(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id', 'Idempotency-Key', 'x-qr-token', 'x-payment-signature'],
    }));
    app.use((0, compression_1.default)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    if (env_1.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('combined'));
    }
    // 2. Correlation ID for all requests
    app.use(correlationId_1.correlationIdMiddleware);
    // 3. Swagger Documentation
    (0, swagger_1.setupSwagger)(app);
    // 4. Health Check Endpoint
    app.get('/api/health', (req, res) => {
        (0, response_1.sendSuccess)(res, {
            status: 'UP',
            service: 'GRAND OMR RESIDENCY Backend',
            environment: env_1.env.NODE_ENV,
            timestamp: new Date().toISOString(),
        }, 'Service healthy');
    });
    // System Network Info (returns server's LAN IP for mobile QR codes)
    app.get('/api/system/network-info', (req, res) => {
        const interfaces = os_1.default.networkInterfaces();
        let localIp = '127.0.0.1';
        for (const name of Object.keys(interfaces)) {
            for (const net of interfaces[name] || []) {
                if (net.family === 'IPv4' && !net.internal) {
                    localIp = net.address;
                    break;
                }
            }
            if (localIp !== '127.0.0.1')
                break;
        }
        (0, response_1.sendSuccess)(res, {
            localIp,
            clientPort: 5173,
            suggestedOrigin: `http://${localIp}:5173`,
        }, 'Network info retrieved');
    });
    // 5. Mount API Routes
    app.use('/api/auth', auth_routes_1.default);
    app.use('/api/rooms', availability_routes_1.default);
    app.use('/api', booking_routes_1.default);
    app.use('/api', qr_routes_1.default);
    app.use('/api', stay_routes_1.default);
    app.use('/api', room_routes_1.default);
    app.use('/api', partner_routes_1.default);
    app.use('/api', payment_routes_1.default);
    app.use('/api', voucher_routes_1.default);
    app.use('/api', extraStay_routes_1.default);
    app.use('/api/admin', admin_routes_1.default);
    app.use('/api/admin', settings_routes_1.default);
    // 6. 404 Catch-All Handler
    app.use((req, res) => {
        (0, response_1.sendError)(res, 'ENDPOINT_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`, 404);
    });
    // 7. Centralized Error Handler
    app.use(error_1.errorHandler);
    return app;
};
exports.app = createApp();
//# sourceMappingURL=app.js.map