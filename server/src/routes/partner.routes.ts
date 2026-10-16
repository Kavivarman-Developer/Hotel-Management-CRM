import { Router } from 'express';
import { PartnerController } from '../controllers/partner.controller';

const router = Router();

router.get('/partners', PartnerController.listPublicPartners);
router.get('/partners/:id', PartnerController.getPublicPartner);

export default router;
