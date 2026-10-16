import { Router } from 'express';
import { QrController } from '../controllers/qr.controller';
import { validate } from '../middleware/validate';
import { qrValidateParamSchema, guestRegistrationSchema } from '../validators/registration.validator';

const router = Router();

router.get('/qr/:token/validate', validate({ params: qrValidateParamSchema }), QrController.validateToken);
router.post('/guest-registrations', validate({ body: guestRegistrationSchema }), QrController.submitRegistration);
router.post('/guest-registrations/walk-in', QrController.submitWalkInRegistration);

export default router;
