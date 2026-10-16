"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const partner_controller_1 = require("../controllers/partner.controller");
const router = (0, express_1.Router)();
router.get('/partners', partner_controller_1.PartnerController.listPublicPartners);
router.get('/partners/:id', partner_controller_1.PartnerController.getPublicPartner);
exports.default = router;
//# sourceMappingURL=partner.routes.js.map