import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { createPaymentOrderSchema, webhookPayloadSchema } from '../validators/payment.validator';

const router = Router();

router.post(
  '/payments/create',
  validate({ body: createPaymentOrderSchema }),
  idempotency(),
  PaymentController.createPayment
);

router.post(
  '/payments/webhook',
  validate({ body: webhookPayloadSchema }),
  PaymentController.webhook
);

export default router;
