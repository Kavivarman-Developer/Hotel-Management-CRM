"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const idempotency_1 = require("../middleware/idempotency");
const auth_controller_1 = require("../controllers/auth.controller");
const booking_controller_1 = require("../controllers/booking.controller");
const qr_controller_1 = require("../controllers/qr.controller");
const stay_controller_1 = require("../controllers/stay.controller");
const room_controller_1 = require("../controllers/room.controller");
const partner_controller_1 = require("../controllers/partner.controller");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_validator_1 = require("../validators/auth.validator");
const booking_validator_1 = require("../validators/booking.validator");
const registration_validator_1 = require("../validators/registration.validator");
const room_validator_1 = require("../validators/room.validator");
const partner_validator_1 = require("../validators/partner.validator");
const payment_validator_1 = require("../validators/payment.validator");
const router = (0, express_1.Router)();
// Protect ALL admin routes with authentication
router.use(auth_1.authenticate);
// --- Staff Management ---
router.get('/staff', (0, auth_1.requirePermission)('staff.manage'), auth_controller_1.AuthController.listStaff);
router.post('/staff', (0, auth_1.requirePermission)('staff.manage'), (0, validate_1.validate)({ body: auth_validator_1.createUserSchema }), auth_controller_1.AuthController.createStaff);
router.patch('/staff/:id/permissions', (0, auth_1.requirePermission)('permissions.manage'), (0, validate_1.validate)({ body: auth_validator_1.updatePermissionsSchema }), auth_controller_1.AuthController.updatePermissions);
router.patch('/staff/:id/status', (0, auth_1.requirePermission)('staff.manage'), (0, validate_1.validate)({ body: auth_validator_1.toggleUserStatusSchema }), auth_controller_1.AuthController.toggleStatus);
// --- Bookings Management ---
router.get('/bookings', (0, auth_1.requirePermission)('bookings.view'), booking_controller_1.BookingController.adminListBookings);
router.post('/bookings', (0, auth_1.requirePermission)('bookings.create'), (0, validate_1.validate)({ body: booking_validator_1.createBookingSchema }), (0, idempotency_1.idempotency)(), booking_controller_1.BookingController.adminCreateBooking);
router.patch('/bookings/:id', (0, auth_1.requirePermission)('bookings.update'), booking_controller_1.BookingController.adminUpdateBooking);
router.post('/bookings/:id/cancel', (0, auth_1.requirePermission)('bookings.cancel'), booking_controller_1.BookingController.adminCancelBooking);
router.post('/bookings/:id/reissue-qr', (0, auth_1.requirePermission)('bookings.update'), qr_controller_1.QrController.reissueQrToken);
// --- Digital QR Registrations ---
router.get('/registrations', (0, auth_1.requirePermission)('qr_registrations.view'), qr_controller_1.QrController.listRegistrations);
router.get('/registrations/:id', (0, auth_1.requirePermission)('qr_registrations.view'), qr_controller_1.QrController.getRegistration);
router.post('/registrations/:id/approve', (0, auth_1.requirePermission)('qr_registrations.approve'), (0, validate_1.validate)({ body: registration_validator_1.reviewRegistrationSchema }), qr_controller_1.QrController.approveRegistration);
router.post('/registrations/:id/reject', (0, auth_1.requirePermission)('qr_registrations.approve'), (0, validate_1.validate)({ body: registration_validator_1.reviewRegistrationSchema }), qr_controller_1.QrController.rejectRegistration);
// --- Stays ---
router.get('/stays/arrivals', (0, auth_1.requirePermission)('dashboard.view'), stay_controller_1.StayController.listArrivals);
router.get('/stays', (0, auth_1.requirePermission)('dashboard.view'), stay_controller_1.StayController.listStays);
router.get('/stays/:id', (0, auth_1.requirePermission)('dashboard.view'), stay_controller_1.StayController.getStay);
// --- Rooms, Room Types & Rates ---
router.get('/rooms', (0, auth_1.requirePermission)('rooms.view'), room_controller_1.RoomController.adminListRooms);
router.post('/rooms', (0, auth_1.requirePermission)('rooms.manage'), (0, validate_1.validate)({ body: room_validator_1.createRoomSchema }), room_controller_1.RoomController.adminCreateRoom);
router.patch('/rooms/:id', (0, auth_1.requirePermission)('rooms.manage'), (0, validate_1.validate)({ body: room_validator_1.updateRoomSchema }), room_controller_1.RoomController.adminUpdateRoom);
router.post('/rooms/:id/maintenance', (0, auth_1.requirePermission)('rooms.manage'), (0, validate_1.validate)({ body: room_validator_1.maintenanceBlockSchema }), room_controller_1.RoomController.adminAddMaintenance);
router.delete('/rooms/:id/maintenance', (0, auth_1.requirePermission)('rooms.manage'), room_controller_1.RoomController.adminRemoveMaintenance);
router.post('/room-types', (0, auth_1.requirePermission)('rooms.manage'), (0, validate_1.validate)({ body: room_validator_1.createRoomTypeSchema }), room_controller_1.RoomController.adminCreateRoomType);
router.patch('/room-types/:id', (0, auth_1.requirePermission)('rooms.manage'), room_controller_1.RoomController.adminUpdateRoomType);
router.patch('/rate-plans/:id', (0, auth_1.requirePermission)('rates.manage'), room_controller_1.RoomController.adminUpdateRatePlan);
// --- Partner Hotels ---
router.get('/partners', (0, auth_1.requirePermission)('partners.manage'), partner_controller_1.PartnerController.adminListPartners);
router.post('/partners', (0, auth_1.requirePermission)('partners.manage'), (0, validate_1.validate)({ body: partner_validator_1.createPartnerSchema }), partner_controller_1.PartnerController.adminCreatePartner);
router.patch('/partners/:id', (0, auth_1.requirePermission)('partners.manage'), (0, validate_1.validate)({ body: partner_validator_1.updatePartnerSchema }), partner_controller_1.PartnerController.adminUpdatePartner);
router.delete('/partners/:id', (0, auth_1.requirePermission)('partners.manage'), partner_controller_1.PartnerController.adminDeletePartner);
// --- Dashboard & Analytics ---
router.get('/dashboard', (0, auth_1.requirePermission)('dashboard.view'), dashboard_controller_1.DashboardController.getDashboard);
router.get('/reports/occupancy', (0, auth_1.requirePermission)('reports.view'), dashboard_controller_1.DashboardController.getOccupancyReport);
router.get('/reports/revenue', (0, auth_1.requirePermission)('reports.view'), dashboard_controller_1.DashboardController.getRevenueReport);
router.get('/reports/bookings', (0, auth_1.requirePermission)('reports.view'), dashboard_controller_1.DashboardController.getBookingsReport);
router.get('/reports/check-ins', (0, auth_1.requirePermission)('reports.view'), dashboard_controller_1.DashboardController.getCheckInsReport);
router.get('/reports/check-outs', (0, auth_1.requirePermission)('reports.view'), dashboard_controller_1.DashboardController.getCheckOutsReport);
router.get('/audit-logs', (0, auth_1.requirePermission)('audit_logs.view'), dashboard_controller_1.DashboardController.getAuditLogs);
// --- Payments & Refunds ---
router.get('/payments', (0, auth_1.requirePermission)('payments.view'), payment_controller_1.PaymentController.adminListPayments);
router.post('/payments/:id/refund', (0, auth_1.requirePermission)('payments.refund'), (0, validate_1.validate)({ body: payment_validator_1.refundPaymentSchema }), payment_controller_1.PaymentController.adminRefundPayment);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map