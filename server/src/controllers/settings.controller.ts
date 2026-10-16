import { Request, Response, NextFunction } from 'express';
import { PropertySettings } from '../models/PropertySettings';
import { User } from '../models/User';
import { UserRole, Permission, DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS } from '../types';
import { sendSuccess } from '../utils/response';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { logAudit } from '../utils/audit';

export const PERMISSION_CATALOG = [
  {
    category: 'Dashboard & Reports',
    categoryDescription: 'High-level business reporting, occupancy analytics, and security audits',
    permissions: [
      { id: 'dashboard.view', label: 'View PMS Dashboard', description: 'Access occupancy rates, daily timeline, and revenue overview' },
      { id: 'reports.view', label: 'View Operational Reports', description: 'Analyze revenue, occupancy, bookings, check-ins, and check-outs' },
      { id: 'reports.export', label: 'Export Reports', description: 'Download analytics and accounting logs in spreadsheet/PDF format' },
      { id: 'audit_logs.view', label: 'View Security Audit Logs', description: 'Inspect timestamped records of administrative actions and permission changes' },
    ],
  },
  {
    category: 'Front Desk & Stays',
    categoryDescription: 'Daily guest check-in, keycard issuance, contactless registrations, and check-out',
    permissions: [
      { id: 'checkin.complete', label: 'Check-In Guests', description: 'Assign rooms, issue physical keycards, and collect security deposits' },
      { id: 'checkout.complete', label: 'Check-Out Guests', description: 'Settle folios, bill incidentals/minibar, and mark rooms dirty for housekeeping' },
      { id: 'guests.view', label: 'View Guests Directory', description: 'Search registered guest records, phone numbers, and booking history' },
      { id: 'guest_details.view', label: 'View Detailed Profiles', description: 'Examine confidential guest personal details and preferences' },
      { id: 'identity_documents.view', label: 'View ID Documents', description: 'Inspect uploaded government IDs (Aadhaar, Passport, Driving License)' },
      { id: 'qr_registrations.view', label: 'View QR Registrations', description: 'Review self-checkin forms submitted digitally by incoming guests' },
      { id: 'qr_registrations.approve', label: 'Approve Registrations', description: 'Verify submitted guest information and approve QR check-in requests' },
    ],
  },
  {
    category: 'Bookings & Reservations',
    categoryDescription: 'Reservation lifecycle, walk-ins, modifications, and room inventory blocks',
    permissions: [
      { id: 'bookings.view', label: 'View Reservations', description: 'Access reservation ledger, calendar views, and stay vouchers' },
      { id: 'bookings.create', label: 'Create Reservations', description: 'Book rooms for walk-ins, phone reservations, and online holds' },
      { id: 'bookings.update', label: 'Modify Reservations', description: 'Update check-in/out dates, guest details, and room assignments' },
      { id: 'bookings.cancel', label: 'Cancel Reservations', description: 'Process cancellations and release held inventory back to availability' },
    ],
  },
  {
    category: 'Rooms & Pricing',
    categoryDescription: 'Room inventory, maintenance blocking, and dynamic pricing management',
    permissions: [
      { id: 'rooms.view', label: 'View Room Inventory', description: 'Inspect all room statuses (Active, Occupied, Dirty, Maintenance)' },
      { id: 'rooms.manage', label: 'Manage Rooms & Maintenance', description: 'Create room units, place rooms under maintenance, and update categories' },
      { id: 'rates.manage', label: 'Configure Rates & Pricing', description: 'Update base nightly rates, dynamic surge multipliers, and seasonal rate plans' },
    ],
  },
  {
    category: 'Billing & Financials',
    categoryDescription: 'Folio billing, payment settlement, and refund processing',
    permissions: [
      { id: 'payments.view', label: 'View Payments Ledger', description: 'Inspect collected cash, card, UPI, and online transaction records' },
      { id: 'payments.refund', label: 'Process Refunds', description: 'Authorize payment reversals and security deposit refunds' },
    ],
  },
  {
    category: 'Administration & System',
    categoryDescription: 'Staff onboarding, role-based permission control, and property settings',
    permissions: [
      { id: 'staff.manage', label: 'Manage Staff Accounts', description: 'Onboard employees, edit staff profiles, and toggle active/inactive status' },
      { id: 'permissions.manage', label: 'Manage Access Permissions', description: 'Grant or revoke individual staff and manager operational privileges' },
      { id: 'partners.manage', label: 'Manage Partner Hotels', description: 'Configure B2B affiliate partner hotels, commission rates, and API keys' },
      { id: 'settings.manage', label: 'Manage Property Settings', description: 'Configure hotel timings, tax rates, contact information, and cancellation rules' },
    ],
  },
];

export class SettingsController {
  /**
   * GET /api/admin/settings
   * Retrieve property settings and current role defaults
   */
  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let settings = await PropertySettings.findOne();
      if (!settings) {
        settings = await PropertySettings.create({
          propertyName: 'GRAND OMR RESIDENCY',
          tagline: 'Luxury Stay & Mobile Booking in Navalur, Chennai',
          address: '5, Rajiv Gandhi Salai, Sholinganallur, Navalur',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600130',
          country: 'India',
          phone: '+91 8110018708',
          email: 'reservations@grandomrresidency.com',
          checkInTime: '12:00',
          checkOutTime: '11:00',
          timezone: 'Asia/Kolkata',
          holdDurationMinutes: 15,
          defaultGstPercentage: 12,
          cancellationGraceHours: 24,
          allowSameDayBooking: true,
          extraStayHourlyRatePaise: 20000,
        });
      }

      // Merge saved role permissions with defaults
      const savedRolePermissions = settings.rolePermissions instanceof Map
        ? Object.fromEntries(settings.rolePermissions)
        : (settings.rolePermissions || {});

      const activeRolePermissions = {
        [UserRole.SUPER_ADMIN]: DEFAULT_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
        [UserRole.MANAGER]: savedRolePermissions[UserRole.MANAGER] || DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER],
        [UserRole.FRONT_DESK]: savedRolePermissions[UserRole.FRONT_DESK] || DEFAULT_ROLE_PERMISSIONS[UserRole.FRONT_DESK],
      };

      sendSuccess(res, {
        settings,
        rolePermissions: activeRolePermissions,
      }, 'Property settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/settings
   * Update hotel property operational configurations
   */
  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let settings = await PropertySettings.findOne();
      if (!settings) {
        settings = new PropertySettings();
      }

      const allowedFields = [
        'propertyName',
        'tagline',
        'address',
        'city',
        'state',
        'pincode',
        'country',
        'phone',
        'email',
        'checkInTime',
        'checkOutTime',
        'timezone',
        'holdDurationMinutes',
        'defaultGstPercentage',
        'cancellationGraceHours',
        'allowSameDayBooking',
        'extraStayHourlyRatePaise',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (settings as any)[field] = req.body[field];
        }
      }

      await settings.save();

      await logAudit({
        userId: req.user!.id,
        actor: req.user!.email,
        action: 'PROPERTY_SETTINGS_UPDATED',
        entityType: 'PropertySettings',
        entityId: String(settings._id),
        changes: { after: req.body },
      });

      sendSuccess(res, settings, 'Property settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/permissions
   * Complete catalog of permissions, role permissions, and individual staff permission overrides
   */
  public static async getPermissionsMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await PropertySettings.findOne();
      const savedRolePermissions = settings?.rolePermissions instanceof Map
        ? Object.fromEntries(settings.rolePermissions)
        : (settings?.rolePermissions || {});

      const activeRolePermissions = {
        [UserRole.SUPER_ADMIN]: DEFAULT_ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
        [UserRole.MANAGER]: savedRolePermissions[UserRole.MANAGER] || DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER],
        [UserRole.FRONT_DESK]: savedRolePermissions[UserRole.FRONT_DESK] || DEFAULT_ROLE_PERMISSIONS[UserRole.FRONT_DESK],
      };

      // Fetch all staff users
      const staffUsers = await User.find()
        .select('_id name email mobile role permissions isActive lastLoginAt createdAt')
        .sort({ role: 1, name: 1 });

      sendSuccess(res, {
        catalog: PERMISSION_CATALOG,
        allPermissions: ALL_PERMISSIONS,
        rolePermissions: activeRolePermissions,
        staffUsers: staffUsers.map((u) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          mobile: u.mobile,
          role: u.role,
          permissions: u.permissions || [],
          isActive: u.isActive,
          lastLoginAt: u.lastLoginAt,
        })),
      }, 'Permissions metadata retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/roles/:role/permissions
   * Update permissions template for a specific role and cascade to users
   */
  public static async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleParam = req.params.role as UserRole;
      if (![UserRole.MANAGER, UserRole.FRONT_DESK].includes(roleParam)) {
        throw new BadRequestError('Only MANAGER and FRONT_DESK permissions can be customized. SUPER_ADMIN possesses complete system access.');
      }

      const { permissions, applyToExistingUsers } = req.body;
      if (!Array.isArray(permissions)) {
        throw new BadRequestError('Permissions array is required');
      }

      // Validate that all permissions exist in ALL_PERMISSIONS
      for (const p of permissions) {
        if (!ALL_PERMISSIONS.includes(p)) {
          throw new BadRequestError(`Invalid permission: '${p}'`);
        }
      }

      let settings = await PropertySettings.findOne();
      if (!settings) {
        settings = new PropertySettings();
      }

      if (!settings.rolePermissions) {
        settings.rolePermissions = {} as any;
      }

      if (settings.rolePermissions instanceof Map) {
        settings.rolePermissions.set(roleParam, permissions);
      } else {
        (settings.rolePermissions as any)[roleParam] = permissions;
      }

      settings.markModified('rolePermissions');
      await settings.save();

      let updatedUsersCount = 0;
      if (applyToExistingUsers) {
        const updateResult = await User.updateMany(
          { role: roleParam },
          { $set: { permissions } }
        );
        updatedUsersCount = updateResult.modifiedCount;
      }

      await logAudit({
        userId: req.user!.id,
        actor: req.user!.email,
        action: 'ROLE_PERMISSIONS_UPDATED',
        entityType: 'UserRole',
        entityId: roleParam,
        changes: {
          after: {
            role: roleParam,
            permissions,
            appliedToUsersCount: updatedUsersCount,
          },
        },
      });

      sendSuccess(res, {
        role: roleParam,
        permissions,
        updatedUsersCount,
      }, `Permissions for role '${roleParam}' updated successfully (${updatedUsersCount} staff members synchronized)`);
    } catch (error) {
      next(error);
    }
  }
}
