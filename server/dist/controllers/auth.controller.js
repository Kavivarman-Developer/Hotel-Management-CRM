"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const User_1 = require("../models/User");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login(email, password, req.ip);
            (0, response_1.sendSuccess)(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.AuthService.refreshAccessToken(refreshToken);
            (0, response_1.sendSuccess)(res, result, 'Token refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            if (req.user?.id) {
                await auth_service_1.AuthService.logout(req.user.id);
            }
            (0, response_1.sendSuccess)(res, null, 'Logged out successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            const user = await User_1.User.findById(req.user.id);
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            (0, response_1.sendSuccess)(res, {
                id: user._id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                permissions: user.permissions,
                isActive: user.isActive,
                lastLoginAt: user.lastLoginAt,
            }, 'User profile retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async listStaff(req, res, next) {
        try {
            const users = await User_1.User.find().sort({ createdAt: -1 });
            (0, response_1.sendSuccess)(res, users.map((u) => ({
                id: u._id,
                name: u.name,
                email: u.email,
                mobile: u.mobile,
                role: u.role,
                permissions: u.permissions,
                isActive: u.isActive,
                lastLoginAt: u.lastLoginAt,
                createdAt: u.createdAt,
            })), 'Staff members retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async createStaff(req, res, next) {
        try {
            const { name, email, mobile, password, role, permissions } = req.body;
            const existing = await User_1.User.findOne({ email: email.toLowerCase().trim() });
            if (existing) {
                throw new errors_1.BadRequestError('A user with this email address already exists');
            }
            const passwordHash = await auth_service_1.AuthService.hashPassword(password);
            const effectivePermissions = permissions || types_1.DEFAULT_ROLE_PERMISSIONS[role] || [];
            const newUser = await User_1.User.create({
                name,
                email: email.toLowerCase().trim(),
                mobile,
                passwordHash,
                role,
                permissions: effectivePermissions,
                isActive: true,
            });
            (0, response_1.sendSuccess)(res, {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                permissions: newUser.permissions,
            }, 'Staff user created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePermissions(req, res, next) {
        try {
            const id = req.params.id;
            const { permissions } = req.body;
            const updatedUser = await auth_service_1.AuthService.updatePermissions(req.user.id, id, permissions);
            (0, response_1.sendSuccess)(res, {
                id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                permissions: updatedUser.permissions,
            }, 'Permissions updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleStatus(req, res, next) {
        try {
            const id = req.params.id;
            const { isActive } = req.body;
            const user = await User_1.User.findById(id);
            if (!user) {
                throw new errors_1.NotFoundError('User not found');
            }
            user.isActive = isActive;
            await user.save();
            (0, response_1.sendSuccess)(res, { id: user._id, isActive: user.isActive }, `User account ${isActive ? 'activated' : 'deactivated'}`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map