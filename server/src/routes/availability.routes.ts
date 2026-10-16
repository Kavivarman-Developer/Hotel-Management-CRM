import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';
import { validate } from '../middleware/validate';
import { availabilityQuerySchema } from '../validators/availability.validator';

const router = Router();

router.get('/availability', validate({ query: availabilityQuerySchema }), AvailabilityController.getAvailability);

export default router;
