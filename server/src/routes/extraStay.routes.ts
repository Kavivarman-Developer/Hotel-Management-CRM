import { Router } from 'express';
import { ExtraStayController } from '../controllers/extraStay.controller';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createExtraStaySchema,
  approveExtraStaySchema,
  rejectExtraStaySchema,
} from '../validators/extraStay.validator';

const router = Router();

// Guest: Submit extra stay / late check-out request
router.post(
  '/extra-stays/request',
  validate({ body: createExtraStaySchema }),
  ExtraStayController.submitRequest
);

// Guest: View requests for a booking reference
router.get(
  '/extra-stays/booking/:reference',
  ExtraStayController.getBookingRequests
);

// Admin: List all requests with filters
router.get(
  '/extra-stays',
  authenticate,
  requirePermission('dashboard.view'),
  ExtraStayController.listRequests
);

// Admin: Approve extra stay request
router.post(
  '/extra-stays/:id/approve',
  authenticate,
  requirePermission('checkin.complete'),
  validate({ body: approveExtraStaySchema }),
  ExtraStayController.approveRequest
);

// Admin: Reject extra stay request
router.post(
  '/extra-stays/:id/reject',
  authenticate,
  requirePermission('checkin.complete'),
  validate({ body: rejectExtraStaySchema }),
  ExtraStayController.rejectRequest
);

export default router;
