"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
class AuthService {
    /**
     * Hashes password using bcrypt with salt rounds 10
     */
    static async hashPassword(password) {
        return await bcryptjs_1.default.hash(password, 10);
    }
    /**
     * Compares plaintext password with bcrypt hash
     */
    static async comparePassword(password, hash) {
        return await bcryptjs_1.default.compare(password, hash);
    }
    /**
     * Hashes refresh token before saving in database
     */
    static hashRefreshToken(token) {
        return crypto_1.default.createHash('sha256').update(token).digest('hex');
    }
    /**
     * Generates Access Token (short-lived) and Refresh Token (longer-lived)
     */
    static generateTokens(user) {
        const accessPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_ACCESS_SECRET, {
            expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
        });
        const refreshPayload = {
            userId: user._id.toString(),
            tokenId: crypto_1.default.randomUUID(),
        };
        const refreshToken = jsonwebtoken_1.default.sign(refreshPayload, env_1.env.JWT_REFRESH_SECRET, {
            expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN,
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN,
        };
    }
    /**
     * Authenticate user, check account activation, generate token pair and rotate refresh token
     */
    static async login(email, pass, ipAddress) {
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +refreshTokenHash');
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        if (!user.isActive) {
            throw new errors_1.ForbiddenError('Your account has been deactivated. Please contact administrator.');
        }
        const isMatch = await this.comparePassword(pass, user.passwordHash);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        const tokens = this.generateTokens(user);
        // Refresh-token rotation: store hash of new refresh token
        user.refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);
        user.lastLoginAt = new Date();
        await user.save();
        await (0, audit_1.logAudit)({
            actor: user.email,
            userId: user._id.toString(),
            userRole: user.role,
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user._id.toString(),
            ipAddress,
        });
        const safeUser = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            permissions: user.permissions,
            lastLoginAt: user.lastLoginAt,
        };
        return { user: safeUser, tokens };
    }
    /**
     * Rotate refresh token and issue new token pair
     */
    static async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new errors_1.UnauthorizedError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
            const user = await User_1.User.findById(decoded.userId).select('+refreshTokenHash');
            if (!user || !user.isActive) {
                throw new errors_1.UnauthorizedError('User account not found or deactivated');
            }
            // Verify token has not been revoked or replaced
            const expectedHash = this.hashRefreshToken(refreshToken);
            if (user.refreshTokenHash !== expectedHash) {
                // Token reuse detection: possible theft, revoke all tokens
                user.refreshTokenHash = undefined;
                await user.save();
                throw new errors_1.UnauthorizedError('Invalid or reused refresh token', 'TOKEN_REVOKED');
            }
            // Issue new pair (rotation)
            const newTokens = this.generateTokens(user);
            user.refreshTokenHash = this.hashRefreshToken(newTokens.refreshToken);
            await user.save();
            return { tokens: newTokens };
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new errors_1.UnauthorizedError('Refresh token has expired. Please log in again', 'REFRESH_TOKEN_EXPIRED');
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
    }
    /**
     * Logout user by revoking the stored refresh token
     */
    static async logout(userId) {
        await User_1.User.findByIdAndUpdate(userId, {
            $unset: { refreshTokenHash: 1 },
        });
        await (0, audit_1.logAudit)({
            userId,
            action: 'USER_LOGOUT',
            entityType: 'User',
            entityId: userId,
        });
    }
    /**
     * Update permissions (SUPER_ADMIN only rule)
     */
    static async updatePermissions(actingUserId, targetUserId, newPermissions) {
        const actingUser = await User_1.User.findById(actingUserId);
        if (!actingUser || actingUser.role !== types_1.UserRole.SUPER_ADMIN) {
            throw new errors_1.ForbiddenError('Only SUPER_ADMIN can grant or modify permissions');
        }
        const targetUser = await User_1.User.findById(targetUserId);
        if (!targetUser) {
            throw new errors_1.NotFoundError('Target staff user not found');
        }
        const beforePermissions = targetUser.permissions;
        targetUser.permissions = newPermissions;
        await targetUser.save();
        await (0, audit_1.logAudit)({
            userId: actingUserId,
            actor: actingUser.email,
            action: 'PERMISSIONS_UPDATED',
            entityType: 'User',
            entityId: targetUserId,
            changes: {
                before: { permissions: beforePermissions },
                after: { permissions: newPermissions },
            },
        });
        return targetUser;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map