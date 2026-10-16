import { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser, Permission, UserRole } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Permission check middleware.
 * If user has role SUPER_ADMIN, automatically bypasses specific permission checks.
 * Otherwise, requires user to have ALL specified permissions.
 */
export declare const requirePermission: (...requiredPermissions: Permission[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Role check middleware.
 */
export declare const requireRole: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
