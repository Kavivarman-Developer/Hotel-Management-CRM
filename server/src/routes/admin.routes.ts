import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { AuthController } from '../controllers/auth.controller';
import { BookingController } from '../controllers/booking.controller';
import { QrController } from '../controllers/qr.controller';
import { StayController } from '../controllers/stay.controller';
import { RoomController } from '../controllers/room.controller';
import { PartnerController } from '../controllers/partner.controller';
import { DashboardController } from '../controllers/dashboard.controller';
import { PaymentController } from '../controllers/payment.controller';

import { createUserSchema, updatePermissionsSchema, toggleUserStatusSchema } from '../validators/auth.validator';
import { createBookingSchema } from '../validators/booking.validator';
import { reviewRegistrationSchema } from '../validators/registration.validator';
import { createRoomSchema, updateRoomSchema, maintenanceBlockSchema, createRoomTypeSchema } from '../validators/room.validator';
import { createPartnerSchema, updatePartnerSchema } from '../validators/partner.validator';
import { refundPaymentSchema } from '../validators/payment.validator';

const router = Router();

// Protect ALL admin routes with authentication
router.use(authenticate);

// --- Staff Management ---
router.get('/staff', requirePermission('staff.manage'), AuthController.listStaff);
router.post('/staff', requirePermission('staff.manage'), validate({ body: createUserSchema }), AuthController.createStaff);
router.patch('/staff/:id/permissions', requirePermission('permissions.manage'), validate({ body: updatePermissionsSchema }), AuthController.updatePermissions);
router.patch('/staff/:id/status', requirePermission('staff.manage'), validate({ body: toggleUserStatusSchema }), AuthController.toggleStatus);

// --- Bookings Management ---
router.get('/bookings', requirePermission('bookings.view'), BookingController.adminListBookings);
router.post('/bookings', requirePermission('bookings.create'), validate({ body: createBookingSchema }), idempotency(), BookingController.adminCreateBooking);
router.patch('/bookings/:id', requirePermission('bookings.update'), BookingController.adminUpdateBooking);
router.post('/bookings/:id/cancel', requirePermission('bookings.cancel'), BookingController.adminCancelBooking);
router.post('/bookings/:id/reissue-qr', requirePermission('bookings.update'), QrController.reissueQrToken);

// --- Digital QR Registrations ---
router.get('/registrations', requirePermission('qr_registrations.view'), QrController.listRegistrations);
router.get('/registrations/:id', requirePermission('qr_registrations.view'), QrController.getRegistration);
router.post('/registrations/:id/approve', requirePermission('qr_registrations.approve'), validate({ body: reviewRegistrationSchema }), QrController.approveRegistration);
router.post('/registrations/:id/reject', requirePermission('qr_registrations.approve'), validate({ body: reviewRegistrationSchema }), QrController.rejectRegistration);

// --- Stays ---
router.get('/stays/arrivals', requirePermission('dashboard.view'), StayController.listArrivals);
router.get('/stays', requirePermission('dashboard.view'), StayController.listStays);
router.get('/stays/:id', requirePermission('dashboard.view'), StayController.getStay);

// --- Rooms, Room Types & Rates ---
router.get('/rooms', requirePermission('rooms.view'), RoomController.adminListRooms);
router.post('/rooms', requirePermission('rooms.manage'), validate({ body: createRoomSchema }), RoomController.adminCreateRoom);
router.patch('/rooms/:id', requirePermission('rooms.manage'), validate({ body: updateRoomSchema }), RoomController.adminUpdateRoom);
router.post('/rooms/:id/maintenance', requirePermission('rooms.manage'), validate({ body: maintenanceBlockSchema }), RoomController.adminAddMaintenance);
router.delete('/rooms/:id/maintenance', requirePermission('rooms.manage'), RoomController.adminRemoveMaintenance);
router.post('/room-types', requirePermission('rooms.manage'), validate({ body: createRoomTypeSchema }), RoomController.adminCreateRoomType);
router.patch('/room-types/:id', requirePermission('rooms.manage'), RoomController.adminUpdateRoomType);
router.patch('/rate-plans/:id', requirePermission('rates.manage'), RoomController.adminUpdateRatePlan);

// --- Partner Hotels ---
router.get('/partners', requirePermission('partners.manage'), PartnerController.adminListPartners);
router.post('/partners', requirePermission('partners.manage'), validate({ body: createPartnerSchema }), PartnerController.adminCreatePartner);
router.patch('/partners/:id', requirePermission('partners.manage'), validate({ body: updatePartnerSchema }), PartnerController.adminUpdatePartner);
router.delete('/partners/:id', requirePermission('partners.manage'), PartnerController.adminDeletePartner);

// --- Dashboard & Analytics ---
router.get('/dashboard', requirePermission('dashboard.view'), DashboardController.getDashboard);
router.get('/reports/occupancy', requirePermission('reports.view'), DashboardController.getOccupancyReport);
router.get('/reports/revenue', requirePermission('reports.view'), DashboardController.getRevenueReport);
router.get('/reports/bookings', requirePermission('reports.view'), DashboardController.getBookingsReport);
router.get('/reports/check-ins', requirePermission('reports.view'), DashboardController.getCheckInsReport);
router.get('/reports/check-outs', requirePermission('reports.view'), DashboardController.getCheckOutsReport);
router.get('/audit-logs', requirePermission('audit_logs.view'), DashboardController.getAuditLogs);

// --- Payments & Refunds ---
router.get('/payments', requirePermission('payments.view'), PaymentController.adminListPayments);
router.post('/payments/:id/refund', requirePermission('payments.refund'), validate({ body: refundPaymentSchema }), PaymentController.adminRefundPayment);

export default router;
