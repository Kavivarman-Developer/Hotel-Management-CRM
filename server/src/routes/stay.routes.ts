import { Router } from 'express';
import { StayController } from '../controllers/stay.controller';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkInSchema, checkOutSchema } from '../validators/stay.validator';

const router = Router();

router.get(
  '/stays',
  authenticate,
  StayController.listStays
);

router.get(
  '/stays/arrivals',
  authenticate,
  requirePermission('checkin.complete'),
  StayController.listArrivals
);

router.get(
  '/stays/:id/overstay-preview',
  authenticate,
  StayController.getOverstayPreview
);

router.post(
  '/stays/:id/check-in',
  authenticate,
  requirePermission('checkin.complete'),
  validate({ body: checkInSchema }),
  StayController.checkIn
);

router.post(
  '/stays/:id/check-out',
  authenticate,
  requirePermission('checkout.complete'),
  validate({ body: checkOutSchema }),
  StayController.checkOut
);

router.post(
  '/stays/:id/charge',
  authenticate,
  requirePermission('checkout.complete'),
  StayController.addCharge
);

export default router;
