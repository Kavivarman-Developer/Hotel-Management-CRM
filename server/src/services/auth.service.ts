import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { Permission, UserRole, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class AuthService {
  /**
   * Hashes password using bcrypt with salt rounds 10
   */
  public static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Compares plaintext password with bcrypt hash
   */
  public static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Hashes refresh token before saving in database
   */
  private static hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates Access Token (short-lived) and Refresh Token (longer-lived)
   */
  public static generateTokens(user: IUser): TokenPair {
    const accessPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    const refreshPayload = {
      userId: user._id.toString(),
      tokenId: crypto.randomUUID(),
    };

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }

  /**
   * Authenticate user, check account activation, generate token pair and rotate refresh token
   */
  public static async login(
    email: string,
    pass: string,
    ipAddress?: string
  ): Promise<{ user: Partial<IUser>; tokens: TokenPair }> {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+passwordHash +refreshTokenHash'
    );

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new ForbiddenError('Your account has been deactivated. Please contact administrator.');
    }

    const isMatch = await this.comparePassword(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = this.generateTokens(user);

    // Refresh-token rotation: store hash of new refresh token
    user.refreshTokenHash = this.hashRefreshToken(tokens.refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    await logAudit({
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

    return { user: safeUser as any, tokens };
  }

  /**
   * Rotate refresh token and issue new token pair
   */
  public static async refreshAccessToken(
    refreshToken: string
  ): Promise<{ tokens: TokenPair }> {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required', 'REFRESH_TOKEN_REQUIRED');
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        userId: string;
        tokenId: string;
      };

      const user = await User.findById(decoded.userId).select('+refreshTokenHash');
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User account not found or deactivated');
      }

      // Verify token has not been revoked or replaced
      const expectedHash = this.hashRefreshToken(refreshToken);
      if (user.refreshTokenHash !== expectedHash) {
        // Token reuse detection: possible theft, revoke all tokens
        user.refreshTokenHash = undefined;
        await user.save();
        throw new UnauthorizedError('Invalid or reused refresh token', 'TOKEN_REVOKED');
      }

      // Issue new pair (rotation)
      const newTokens = this.generateTokens(user);
      user.refreshTokenHash = this.hashRefreshToken(newTokens.refreshToken);
      await user.save();

      return { tokens: newTokens };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired. Please log in again', 'REFRESH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Logout user by revoking the stored refresh token
   */
  public static async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1 },
    });
    await logAudit({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: userId,
    });
  }

  /**
   * Update permissions (SUPER_ADMIN only rule)
   */
  public static async updatePermissions(
    actingUserId: string,
    targetUserId: string,
    newPermissions: Permission[]
  ): Promise<IUser> {
    const actingUser = await User.findById(actingUserId);
    if (!actingUser || actingUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Only SUPER_ADMIN can grant or modify permissions');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('Target staff user not found');
    }

    const beforePermissions = targetUser.permissions;
    targetUser.permissions = newPermissions;
    await targetUser.save();

    await logAudit({
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
