"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const validate_1 = require("../middleware/validate");
const idempotency_1 = require("../middleware/idempotency");
const booking_validator_1 = require("../validators/booking.validator");
const router = (0, express_1.Router)();
// Holds
router.post('/holds', (0, validate_1.validate)({ body: booking_validator_1.createHoldSchema }), (0, idempotency_1.idempotency)(), booking_controller_1.BookingController.createHold);
// Bookings
router.post('/bookings', (0, validate_1.validate)({ body: booking_validator_1.createBookingSchema }), (0, idempotency_1.idempotency)(), booking_controller_1.BookingController.createBooking);
router.get('/bookings/:reference', (0, validate_1.validate)({ query: booking_validator_1.getBookingVerificationQuerySchema }), booking_controller_1.BookingController.getBooking);
router.post('/bookings/:reference/cancel', (0, validate_1.validate)({ body: booking_validator_1.cancelBookingSchema }), booking_controller_1.BookingController.cancelBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map