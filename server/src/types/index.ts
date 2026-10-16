export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  FRONT_DESK = 'FRONT_DESK',
}

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'rooms.view',
  'rooms.manage',
  'bookings.view',
  'bookings.create',
  'bookings.update',
  'bookings.cancel',
  'guests.view',
  'guest_details.view',
  'identity_documents.view',
  'qr_registrations.view',
  'qr_registrations.approve',
  'checkin.complete',
  'checkout.complete',
  'payments.view',
  'payments.refund',
  'rates.manage',
  'staff.manage',
  'permissions.manage',
  'partners.manage',
  'reports.view',
  'reports.export',
  'audit_logs.view',
  'settings.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [...ALL_PERMISSIONS],
  [UserRole.MANAGER]: [
    'dashboard.view',
    'rooms.view',
    'rooms.manage',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'bookings.cancel',
    'guests.view',
    'guest_details.view',
    'identity_documents.view',
    'qr_registrations.view',
    'qr_registrations.approve',
    'checkin.complete',
    'checkout.complete',
    'payments.view',
    'payments.refund',
    'rates.manage',
    'staff.manage',
    'partners.manage',
    'reports.view',
    'reports.export',
    'audit_logs.view',
  ],
  [UserRole.FRONT_DESK]: [
    'dashboard.view',
    'rooms.view',
    'bookings.view',
    'bookings.create',
    'bookings.update',
    'guests.view',
    'qr_registrations.view',
    'qr_registrations.approve',
    'checkin.complete',
    'checkout.complete',
    'payments.view',
  ],
};

export enum ReservationStatus {
  SEARCHED = 'SEARCHED',
  HELD = 'HELD',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  NO_SHOW = 'NO_SHOW',
}

export enum StayStatus {
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
}

export enum RoomStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum HousekeepingStatus {
  CLEAN = 'CLEAN',
  DIRTY = 'DIRTY',
  INSPECTED = 'INSPECTED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum HoldStatus {
  ACTIVE = 'ACTIVE',
  RELEASED = 'RELEASED',
  CONVERTED_TO_BOOKING = 'CONVERTED_TO_BOOKING',
  EXPIRED = 'EXPIRED',
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum BookingSource {
  WEBSITE = 'WEBSITE',
  FRONT_DESK = 'FRONT_DESK',
  ADMIN = 'ADMIN',
  WALK_IN = 'WALK_IN',
  PARTNER_OTA = 'PARTNER_OTA',
}

export enum PartnerListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PartnerApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
}

export interface NightlyRateBreakdown {
  date: string; // YYYY-MM-DD
  baseRate: number; // in integer paise
  effectiveRate: number; // in integer paise (after seasonal/weekend rule)
  discountedRate: number; // in integer paise
  extraGuestCharge: number; // in integer paise
  totalNightRate: number; // in integer paise
}

export interface PricingCalculationResult {
  currency: string;
  nightCount: number;
  perNightBreakdown: NightlyRateBreakdown[];
  subtotal: number; // in integer paise
  discount: number; // in integer paise
  discountCode?: string;
  taxes: number; // in integer paise
  taxRatePercentage: number;
  additionalCharges: number; // in integer paise
  totalAmount: number; // in integer paise
}
