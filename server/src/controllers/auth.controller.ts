import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { User } from '../models/User';
import { sendSuccess } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { DEFAULT_ROLE_PERMISSIONS } from '../types';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password, req.ip);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshAccessToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await AuthService.logout(req.user.id);
      }
      sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      sendSuccess(
        res,
        {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          permissions: user.permissions,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
        },
        'User profile retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  public static async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      sendSuccess(
        res,
        users.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          mobile: u.mobile,
          role: u.role,
          permissions: u.permissions,
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        })),
        'Staff members retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  public static async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, mobile, password, role, permissions } = req.body;

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        throw new BadRequestError('A user with this email address already exists');
      }

      const passwordHash = await AuthService.hashPassword(password);
      const effectivePermissions = permissions || DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];

      const newUser = await User.create({
        name,
        email: email.toLowerCase().trim(),
        mobile,
        passwordHash,
        role,
        permissions: effectivePermissions,
        isActive: true,
      });

      sendSuccess(
        res,
        {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          permissions: newUser.permissions,
        },
        'Staff user created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  public static async updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { permissions } = req.body;
      const updatedUser = await AuthService.updatePermissions(req.user!.id, id, permissions);

      sendSuccess(
        res,
        {
          id: updatedUser._id,
          email: updatedUser.email,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
        },
        'Permissions updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  public static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.isActive = isActive;
      await user.save();

      sendSuccess(res, { id: user._id, isActive: user.isActive }, `User account ${isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }
}
