"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availability_controller_1 = require("../controllers/availability.controller");
const validate_1 = require("../middleware/validate");
const availability_validator_1 = require("../validators/availability.validator");
const router = (0, express_1.Router)();
router.get('/availability', (0, validate_1.validate)({ query: availability_validator_1.availabilityQuerySchema }), availability_controller_1.AvailabilityController.getAvailability);
exports.default = router;
//# sourceMappingURL=availability.routes.js.map