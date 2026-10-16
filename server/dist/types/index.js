"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerApprovalStatus = exports.PartnerListingStatus = exports.BookingSource = exports.PaymentStatus = exports.RegistrationStatus = exports.HoldStatus = exports.HousekeepingStatus = exports.RoomStatus = exports.StayStatus = exports.ReservationStatus = exports.DEFAULT_ROLE_PERMISSIONS = exports.ALL_PERMISSIONS = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["FRONT_DESK"] = "FRONT_DESK";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.ALL_PERMISSIONS = [
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
];
exports.DEFAULT_ROLE_PERMISSIONS = {
    [UserRole.SUPER_ADMIN]: [...exports.ALL_PERMISSIONS],
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
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["SEARCHED"] = "SEARCHED";
    ReservationStatus["HELD"] = "HELD";
    ReservationStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    ReservationStatus["CONFIRMED"] = "CONFIRMED";
    ReservationStatus["CANCELLED"] = "CANCELLED";
    ReservationStatus["EXPIRED"] = "EXPIRED";
    ReservationStatus["NO_SHOW"] = "NO_SHOW";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
var StayStatus;
(function (StayStatus) {
    StayStatus["NOT_CHECKED_IN"] = "NOT_CHECKED_IN";
    StayStatus["CHECKED_IN"] = "CHECKED_IN";
    StayStatus["CHECKED_OUT"] = "CHECKED_OUT";
})(StayStatus || (exports.StayStatus = StayStatus = {}));
var RoomStatus;
(function (RoomStatus) {
    RoomStatus["ACTIVE"] = "ACTIVE";
    RoomStatus["INACTIVE"] = "INACTIVE";
    RoomStatus["MAINTENANCE"] = "MAINTENANCE";
})(RoomStatus || (exports.RoomStatus = RoomStatus = {}));
var HousekeepingStatus;
(function (HousekeepingStatus) {
    HousekeepingStatus["CLEAN"] = "CLEAN";
    HousekeepingStatus["DIRTY"] = "DIRTY";
    HousekeepingStatus["INSPECTED"] = "INSPECTED";
    HousekeepingStatus["OUT_OF_SERVICE"] = "OUT_OF_SERVICE";
})(HousekeepingStatus || (exports.HousekeepingStatus = HousekeepingStatus = {}));
var HoldStatus;
(function (HoldStatus) {
    HoldStatus["ACTIVE"] = "ACTIVE";
    HoldStatus["RELEASED"] = "RELEASED";
    HoldStatus["CONVERTED_TO_BOOKING"] = "CONVERTED_TO_BOOKING";
    HoldStatus["EXPIRED"] = "EXPIRED";
})(HoldStatus || (exports.HoldStatus = HoldStatus = {}));
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "PENDING";
    RegistrationStatus["SUBMITTED"] = "SUBMITTED";
    RegistrationStatus["VERIFIED"] = "VERIFIED";
    RegistrationStatus["REJECTED"] = "REJECTED";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["INITIATED"] = "INITIATED";
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PARTIAL"] = "PARTIAL";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var BookingSource;
(function (BookingSource) {
    BookingSource["WEBSITE"] = "WEBSITE";
    BookingSource["FRONT_DESK"] = "FRONT_DESK";
    BookingSource["ADMIN"] = "ADMIN";
    BookingSource["WALK_IN"] = "WALK_IN";
    BookingSource["PARTNER_OTA"] = "PARTNER_OTA";
})(BookingSource || (exports.BookingSource = BookingSource = {}));
var PartnerListingStatus;
(function (PartnerListingStatus) {
    PartnerListingStatus["DRAFT"] = "DRAFT";
    PartnerListingStatus["ACTIVE"] = "ACTIVE";
    PartnerListingStatus["INACTIVE"] = "INACTIVE";
})(PartnerListingStatus || (exports.PartnerListingStatus = PartnerListingStatus = {}));
var PartnerApprovalStatus;
(function (PartnerApprovalStatus) {
    PartnerApprovalStatus["PENDING"] = "PENDING";
    PartnerApprovalStatus["APPROVED"] = "APPROVED";
    PartnerApprovalStatus["REJECTED"] = "REJECTED";
})(PartnerApprovalStatus || (exports.PartnerApprovalStatus = PartnerApprovalStatus = {}));
//# sourceMappingURL=index.js.map