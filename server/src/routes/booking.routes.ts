import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { validate } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import {
  createHoldSchema,
  createBookingSchema,
  cancelBookingSchema,
  getBookingVerificationQuerySchema,
} from '../validators/booking.validator';

const router = Router();

// Holds
router.post('/holds', validate({ body: createHoldSchema }), idempotency(), BookingController.createHold);

// Bookings
router.post('/bookings', validate({ body: createBookingSchema }), idempotency(), BookingController.createBooking);
router.get('/bookings/:reference', validate({ query: getBookingVerificationQuerySchema }), BookingController.getBooking);
router.post('/bookings/:reference/cancel', validate({ body: cancelBookingSchema }), BookingController.cancelBooking);

export default router;
