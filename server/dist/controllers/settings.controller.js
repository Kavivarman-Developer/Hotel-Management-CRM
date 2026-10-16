"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = exports.PERMISSION_CATALOG = void 0;
const PropertySettings_1 = require("../models/PropertySettings");
const User_1 = require("../models/User");
const types_1 = require("../types");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
exports.PERMISSION_CATALOG = [
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
class SettingsController {
    /**
     * GET /api/admin/settings
     * Retrieve property settings and current role defaults
     */
    static async getSettings(req, res, next) {
        try {
            let settings = await PropertySettings_1.PropertySettings.findOne();
            if (!settings) {
                settings = await PropertySettings_1.PropertySettings.create({
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
                [types_1.UserRole.SUPER_ADMIN]: types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.SUPER_ADMIN],
                [types_1.UserRole.MANAGER]: savedRolePermissions[types_1.UserRole.MANAGER] || types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.MANAGER],
                [types_1.UserRole.FRONT_DESK]: savedRolePermissions[types_1.UserRole.FRONT_DESK] || types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.FRONT_DESK],
            };
            (0, response_1.sendSuccess)(res, {
                settings,
                rolePermissions: activeRolePermissions,
            }, 'Property settings retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * PATCH /api/admin/settings
     * Update hotel property operational configurations
     */
    static async updateSettings(req, res, next) {
        try {
            let settings = await PropertySettings_1.PropertySettings.findOne();
            if (!settings) {
                settings = new PropertySettings_1.PropertySettings();
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
                    settings[field] = req.body[field];
                }
            }
            await settings.save();
            await (0, audit_1.logAudit)({
                userId: req.user.id,
                actor: req.user.email,
                action: 'PROPERTY_SETTINGS_UPDATED',
                entityType: 'PropertySettings',
                entityId: String(settings._id),
                changes: { after: req.body },
            });
            (0, response_1.sendSuccess)(res, settings, 'Property settings updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * GET /api/admin/permissions
     * Complete catalog of permissions, role permissions, and individual staff permission overrides
     */
    static async getPermissionsMetadata(req, res, next) {
        try {
            const settings = await PropertySettings_1.PropertySettings.findOne();
            const savedRolePermissions = settings?.rolePermissions instanceof Map
                ? Object.fromEntries(settings.rolePermissions)
                : (settings?.rolePermissions || {});
            const activeRolePermissions = {
                [types_1.UserRole.SUPER_ADMIN]: types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.SUPER_ADMIN],
                [types_1.UserRole.MANAGER]: savedRolePermissions[types_1.UserRole.MANAGER] || types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.MANAGER],
                [types_1.UserRole.FRONT_DESK]: savedRolePermissions[types_1.UserRole.FRONT_DESK] || types_1.DEFAULT_ROLE_PERMISSIONS[types_1.UserRole.FRONT_DESK],
            };
            // Fetch all staff users
            const staffUsers = await User_1.User.find()
                .select('_id name email mobile role permissions isActive lastLoginAt createdAt')
                .sort({ role: 1, name: 1 });
            (0, response_1.sendSuccess)(res, {
                catalog: exports.PERMISSION_CATALOG,
                allPermissions: types_1.ALL_PERMISSIONS,
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * POST /api/admin/roles/:role/permissions
     * Update permissions template for a specific role and cascade to users
     */
    static async updateRolePermissions(req, res, next) {
        try {
            const roleParam = req.params.role;
            if (![types_1.UserRole.MANAGER, types_1.UserRole.FRONT_DESK].includes(roleParam)) {
                throw new errors_1.BadRequestError('Only MANAGER and FRONT_DESK permissions can be customized. SUPER_ADMIN possesses complete system access.');
            }
            const { permissions, applyToExistingUsers } = req.body;
            if (!Array.isArray(permissions)) {
                throw new errors_1.BadRequestError('Permissions array is required');
            }
            // Validate that all permissions exist in ALL_PERMISSIONS
            for (const p of permissions) {
                if (!types_1.ALL_PERMISSIONS.includes(p)) {
                    throw new errors_1.BadRequestError(`Invalid permission: '${p}'`);
                }
            }
            let settings = await PropertySettings_1.PropertySettings.findOne();
            if (!settings) {
                settings = new PropertySettings_1.PropertySettings();
            }
            if (!settings.rolePermissions) {
                settings.rolePermissions = {};
            }
            if (settings.rolePermissions instanceof Map) {
                settings.rolePermissions.set(roleParam, permissions);
            }
            else {
                settings.rolePermissions[roleParam] = permissions;
            }
            settings.markModified('rolePermissions');
            await settings.save();
            let updatedUsersCount = 0;
            if (applyToExistingUsers) {
                const updateResult = await User_1.User.updateMany({ role: roleParam }, { $set: { permissions } });
                updatedUsersCount = updateResult.modifiedCount;
            }
            await (0, audit_1.logAudit)({
                userId: req.user.id,
                actor: req.user.email,
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
            (0, response_1.sendSuccess)(res, {
                role: roleParam,
                permissions,
                updatedUsersCount,
            }, `Permissions for role '${roleParam}' updated successfully (${updatedUsersCount} staff members synchronized)`);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
//# sourceMappingURL=settings.controller.js.map