export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    MANAGER = "MANAGER",
    FRONT_DESK = "FRONT_DESK"
}
export declare const ALL_PERMISSIONS: readonly ["dashboard.view", "rooms.view", "rooms.manage", "bookings.view", "bookings.create", "bookings.update", "bookings.cancel", "guests.view", "guest_details.view", "identity_documents.view", "qr_registrations.view", "qr_registrations.approve", "checkin.complete", "checkout.complete", "payments.view", "payments.refund", "rates.manage", "staff.manage", "permissions.manage", "partners.manage", "reports.view", "reports.export", "audit_logs.view", "settings.manage"];
export type Permission = (typeof ALL_PERMISSIONS)[number];
export declare const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]>;
export declare enum ReservationStatus {
    SEARCHED = "SEARCHED",
    HELD = "HELD",
    PENDING_PAYMENT = "PENDING_PAYMENT",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
    NO_SHOW = "NO_SHOW"
}
export declare enum StayStatus {
    NOT_CHECKED_IN = "NOT_CHECKED_IN",
    CHECKED_IN = "CHECKED_IN",
    CHECKED_OUT = "CHECKED_OUT"
}
export declare enum RoomStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE"
}
export declare enum HousekeepingStatus {
    CLEAN = "CLEAN",
    DIRTY = "DIRTY",
    INSPECTED = "INSPECTED",
    OUT_OF_SERVICE = "OUT_OF_SERVICE"
}
export declare enum HoldStatus {
    ACTIVE = "ACTIVE",
    RELEASED = "RELEASED",
    CONVERTED_TO_BOOKING = "CONVERTED_TO_BOOKING",
    EXPIRED = "EXPIRED"
}
export declare enum RegistrationStatus {
    PENDING = "PENDING",
    SUBMITTED = "SUBMITTED",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED"
}
export declare enum PaymentStatus {
    INITIATED = "INITIATED",
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    PAID = "PAID",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum BookingSource {
    WEBSITE = "WEBSITE",
    FRONT_DESK = "FRONT_DESK",
    ADMIN = "ADMIN",
    WALK_IN = "WALK_IN",
    PARTNER_OTA = "PARTNER_OTA"
}
export declare enum PartnerListingStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE"
}
export declare enum PartnerApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
}
export interface NightlyRateBreakdown {
    date: string;
    baseRate: number;
    effectiveRate: number;
    discountedRate: number;
    extraGuestCharge: number;
    totalNightRate: number;
}
export interface PricingCalculationResult {
    currency: string;
    nightCount: number;
    perNightBreakdown: NightlyRateBreakdown[];
    subtotal: number;
    discount: number;
    discountCode?: string;
    taxes: number;
    taxRatePercentage: number;
    additionalCharges: number;
    totalAmount: number;
}
