"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const User_1 = require("../models/User");
const types_1 = require("../types");
const response_1 = require("../utils/response");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication token required', 401);
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            (0, response_1.sendError)(res, 'UNAUTHORIZED', 'User not found or session expired', 401);
            return;
        }
        if (!user.isActive) {
            (0, response_1.sendError)(res, 'ACCOUNT_DEACTIVATED', 'This user account is inactive', 403);
            return;
        }
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
        };
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            (0, response_1.sendError)(res, 'TOKEN_EXPIRED', 'Access token has expired', 401);
            return;
        }
        (0, response_1.sendError)(res, 'INVALID_TOKEN', 'Invalid or tampered access token', 401);
    }
};
exports.authenticate = authenticate;
/**
 * Permission check middleware.
 * If user has role SUPER_ADMIN, automatically bypasses specific permission checks.
 * Otherwise, requires user to have ALL specified permissions.
 */
const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        if (req.user.role === types_1.UserRole.SUPER_ADMIN) {
            next();
            return;
        }
        const userPermissions = new Set(req.user.permissions || []);
        const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));
        if (!hasAll) {
            const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
            (0, response_1.sendError)(res, 'FORBIDDEN', `Forbidden: Insufficient permissions. Required: [${missing.join(', ')}]`, 403);
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
/**
 * Role check middleware.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, response_1.sendError)(res, 'UNAUTHORIZED', 'Authentication required', 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            (0, response_1.sendError)(res, 'FORBIDDEN', `Forbidden: Requires one of [${roles.join(', ')}]`, 403);
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map