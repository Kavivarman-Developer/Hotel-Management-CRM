"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stay_controller_1 = require("../controllers/stay.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const stay_validator_1 = require("../validators/stay.validator");
const router = (0, express_1.Router)();
router.get('/stays', auth_1.authenticate, stay_controller_1.StayController.listStays);
router.get('/stays/arrivals', auth_1.authenticate, (0, auth_1.requirePermission)('checkin.complete'), stay_controller_1.StayController.listArrivals);
router.get('/stays/:id/overstay-preview', auth_1.authenticate, stay_controller_1.StayController.getOverstayPreview);
router.post('/stays/:id/check-in', auth_1.authenticate, (0, auth_1.requirePermission)('checkin.complete'), (0, validate_1.validate)({ body: stay_validator_1.checkInSchema }), stay_controller_1.StayController.checkIn);
router.post('/stays/:id/check-out', auth_1.authenticate, (0, auth_1.requirePermission)('checkout.complete'), (0, validate_1.validate)({ body: stay_validator_1.checkOutSchema }), stay_controller_1.StayController.checkOut);
router.post('/stays/:id/charge', auth_1.authenticate, (0, auth_1.requirePermission)('checkout.complete'), stay_controller_1.StayController.addCharge);
exports.default = router;
//# sourceMappingURL=stay.routes.js.map