import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './setup';
import { app } from '../app';
import { User } from '../models/User';
import { AuthService } from '../services/auth.service';
import { UserRole, DEFAULT_ROLE_PERMISSIONS } from '../types';

describe('Authentication & Authorization', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('AuthService & Tokens', () => {
    it('should hash and verify passwords correctly', async () => {
      const plain = 'SecretPass@2026';
      const hash = await AuthService.hashPassword(plain);

      expect(hash).not.toBe(plain);
      expect(await AuthService.comparePassword(plain, hash)).toBe(true);
      expect(await AuthService.comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('should authenticate user and return access + refresh tokens', async () => {
      const passwordHash = await AuthService.hashPassword('MyPassword123');
      await User.create({
        name: 'Staff Member',
        email: 'staff@example.com',
        mobile: '+91 9999999999',
        passwordHash,
        role: UserRole.FRONT_DESK,
      });

      const result = await AuthService.login('staff@example.com', 'MyPassword123');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user.email).toBe('staff@example.com');
    });

    it('should reject login for deactivated user', async () => {
      const passwordHash = await AuthService.hashPassword('Pass12345');
      await User.create({
        name: 'Inactive Staff',
        email: 'inactive@example.com',
        mobile: '+91 9999999999',
        passwordHash,
        role: UserRole.FRONT_DESK,
        isActive: false,
      });

      await expect(AuthService.login('inactive@example.com', 'Pass12345')).rejects.toThrow(
        /deactivated/i
      );
    });

    it('should rotate refresh token and revoke previous refresh token', async () => {
      const passwordHash = await AuthService.hashPassword('Pass12345');
      await User.create({
        name: 'Test Rotation',
        email: 'rotation@example.com',
        mobile: '+91 9999999999',
        passwordHash,
        role: UserRole.FRONT_DESK,
      });

      const initialLogin = await AuthService.login('rotation@example.com', 'Pass12345');
      const oldRefreshToken = initialLogin.tokens.refreshToken;

      // Rotate token
      const rotated = await AuthService.refreshAccessToken(oldRefreshToken);
      expect(rotated.tokens.accessToken).toBeDefined();
      expect(rotated.tokens.refreshToken).not.toBe(oldRefreshToken);

      // Attempting to reuse the OLD refresh token should now fail
      await expect(AuthService.refreshAccessToken(oldRefreshToken)).rejects.toThrow();
    });
  });

  describe('API Authorization & Permissions Middleware', () => {
    let superAdminToken: string;
    let frontDeskToken: string;
    let frontDeskUserId: string;

    beforeEach(async () => {
      // 1. Super Admin
      const saHash = await AuthService.hashPassword('SuperAdmin@2026');
      const saUser = await User.create({
        name: 'Super Admin',
        email: 'admin@example.com',
        mobile: '+91 8110018708',
        passwordHash: saHash,
        role: UserRole.SUPER_ADMIN,
        permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
      });
      const saLogin = await AuthService.login('admin@example.com', 'SuperAdmin@2026');
      superAdminToken = saLogin.tokens.accessToken;

      // 2. Front Desk
      const fdHash = await AuthService.hashPassword('FrontDesk@2026');
      const fdUser = await User.create({
        name: 'Front Desk',
        email: 'frontdesk@example.com',
        mobile: '+91 9840123456',
        passwordHash: fdHash,
        role: UserRole.FRONT_DESK,
        permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.FRONT_DESK],
      });
      frontDeskUserId = fdUser._id.toString();
      const fdLogin = await AuthService.login('frontdesk@example.com', 'FrontDesk@2026');
      frontDeskToken = fdLogin.tokens.accessToken;
    });

    it('should allow SUPER_ADMIN to access protected staff management endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/staff')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should block FRONT_DESK with 403 on staff management endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/staff')
        .set('Authorization', `Bearer ${frontDeskToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow SUPER_ADMIN to update individual staff permissions', async () => {
      const res = await request(app)
        .patch(`/api/admin/staff/${frontDeskUserId}/permissions`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          permissions: ['dashboard.view', 'bookings.view', 'rates.manage'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.permissions).toContain('rates.manage');
    });
  });
});
