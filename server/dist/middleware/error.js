"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const errorHandler = (err, req, res, next) => {
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
        ...(env_1.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    };
    console.error('[Error]', JSON.stringify(sanitizedErr));
    // Custom AppError
    if (err instanceof errors_1.AppError) {
        (0, response_1.sendError)(res, err.code, err.message, err.statusCode, err.details);
        return;
    }
    // MongoDB duplicate key error (code 11000)
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const keys = Object.keys(err.keyPattern || err.keyValue || {});
        const field = keys.length > 0 ? keys.join(', ') : 'field';
        (0, response_1.sendError)(res, 'DUPLICATE_KEY_ERROR', `A resource with this ${field} already exists`, 409, { field, keyValue: err.keyValue });
        return;
    }
    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        (0, response_1.sendError)(res, 'INVALID_IDENTIFIER', `Invalid identifier format: ${err.value}`, 400);
        return;
    }
    // Mongoose ValidationError
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map((e) => ({
            path: e.path,
            message: e.message,
        }));
        (0, response_1.sendError)(res, 'VALIDATION_ERROR', 'Database validation failed', 422, messages);
        return;
    }
    // Malformed JSON body
    if (err instanceof SyntaxError && 'body' in err) {
        (0, response_1.sendError)(res, 'MALFORMED_JSON', 'Malformed JSON in request body', 400);
        return;
    }
    // Catch-all Internal Server Error
    (0, response_1.sendError)(res, 'INTERNAL_SERVER_ERROR', env_1.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred'
        : err.message || 'Internal server error', 500);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map