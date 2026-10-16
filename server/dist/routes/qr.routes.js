"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qr_controller_1 = require("../controllers/qr.controller");
const validate_1 = require("../middleware/validate");
const registration_validator_1 = require("../validators/registration.validator");
const router = (0, express_1.Router)();
router.get('/qr/:token/validate', (0, validate_1.validate)({ params: registration_validator_1.qrValidateParamSchema }), qr_controller_1.QrController.validateToken);
router.post('/guest-registrations', (0, validate_1.validate)({ body: registration_validator_1.guestRegistrationSchema }), qr_controller_1.QrController.submitRegistration);
router.post('/guest-registrations/walk-in', qr_controller_1.QrController.submitWalkInRegistration);
exports.default = router;
//# sourceMappingURL=qr.routes.js.map