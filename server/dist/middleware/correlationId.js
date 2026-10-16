"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationIdMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const correlationIdMiddleware = (req, res, next) => {
    const headerId = req.header('X-Correlation-Id');
    const correlationId = headerId || crypto_1.default.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
};
exports.correlationIdMiddleware = correlationIdMiddleware;
//# sourceMappingURL=correlationId.js.map