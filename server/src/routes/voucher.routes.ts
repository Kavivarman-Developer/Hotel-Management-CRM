import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createVoucherSchema,
  updateVoucherSchema,
  validateVoucherSchema,
} from '../validators/voucher.validator';

const router = Router();

// Public / Guest / Admin: Validate voucher code for checkout
router.post(
  '/vouchers/validate',
  validate({ body: validateVoucherSchema }),
  VoucherController.validate
);

// Admin: List all vouchers with statistics
router.get(
  '/vouchers',
  authenticate,
  requirePermission('dashboard.view'),
  VoucherController.listVouchers
);

// Admin: Create a new voucher
router.post(
  '/vouchers',
  authenticate,
  requirePermission('rates.manage'),
  validate({ body: createVoucherSchema }),
  VoucherController.createVoucher
);

// Admin: Update voucher status or details
router.patch(
  '/vouchers/:id',
  authenticate,
  requirePermission('rates.manage'),
  validate({ body: updateVoucherSchema }),
  VoucherController.updateVoucher
);

// Admin: Delete voucher
router.delete(
  '/vouchers/:id',
  authenticate,
  requirePermission('rates.manage'),
  VoucherController.deleteVoucher
);

export default router;
