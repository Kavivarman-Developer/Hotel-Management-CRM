"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleUserStatusSchema = exports.updatePermissionsSchema = exports.createUserSchema = exports.refreshTokenSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required').trim(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: zod_1.z.string().email('Valid email is required').trim(),
    mobile: zod_1.z.string().min(10, 'Mobile must be at least 10 digits').trim(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: zod_1.z.enum([types_1.UserRole.SUPER_ADMIN, types_1.UserRole.MANAGER, types_1.UserRole.FRONT_DESK]),
    permissions: zod_1.z.array(zod_1.z.enum(types_1.ALL_PERMISSIONS)).optional(),
});
exports.updatePermissionsSchema = zod_1.z.object({
    permissions: zod_1.z.array(zod_1.z.enum(types_1.ALL_PERMISSIONS)),
});
exports.toggleUserStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
//# sourceMappingURL=auth.validator.js.map