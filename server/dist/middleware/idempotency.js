"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotency = void 0;
const crypto_1 = __importDefault(require("crypto"));
const IdempotencyRecord_1 = require("../models/IdempotencyRecord");
const idempotency = (ttlSeconds = 86400) => {
    return async (req, res, next) => {
        const idempotencyKey = req.header('Idempotency-Key');
        if (!idempotencyKey) {
            return next();
        }
        const requestHash = crypto_1.default
            .createHash('sha256')
            .update(JSON.stringify(req.body || {}))
            .digest('hex');
        try {
            const existing = await IdempotencyRecord_1.IdempotencyRecord.findOne({ idempotencyKey });
            if (existing) {
                // Return cached response
                res.status(existing.responseStatus).json(existing.responseBody);
                return;
            }
            // Intercept res.json to capture response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // Asynchronously save idempotency record
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    IdempotencyRecord_1.IdempotencyRecord.create({
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
        }
        catch (error) {
            next(error);
        }
    };
};
exports.idempotency = idempotency;
//# sourceMappingURL=idempotency.js.map