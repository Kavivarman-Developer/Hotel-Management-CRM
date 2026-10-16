import { Request, Response, NextFunction } from 'express';
import jwt from 'express';
import jsonwebtoken from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import { AuthenticatedUser, Permission, UserRole } from '../types';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jsonwebtoken.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await User.findById(decoded.userId);
    if (!user) {
      sendError(res, 'UNAUTHORIZED', 'User not found or session expired', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'ACCOUNT_DEACTIVATED', 'This user account is inactive', 403);
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
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'TOKEN_EXPIRED', 'Access token has expired', 401);
      return;
    }
    sendError(res, 'INVALID_TOKEN', 'Invalid or tampered access token', 401);
  }
};

/**
 * Permission check middleware.
 * If user has role SUPER_ADMIN, automatically bypasses specific permission checks.
 * Otherwise, requires user to have ALL specified permissions.
 */
export const requirePermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    const userPermissions = new Set(req.user.permissions || []);
    const hasAll = requiredPermissions.every((perm) => userPermissions.has(perm));

    if (!hasAll) {
      const missing = requiredPermissions.filter((p) => !userPermissions.has(p));
      sendError(
        res,
        'FORBIDDEN',
        `Forbidden: Insufficient permissions. Required: [${missing.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
};

/**
 * Role check middleware.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN', `Forbidden: Requires one of [${roles.join(', ')}]`, 403);
      return;
    }

    next();
  };
};
