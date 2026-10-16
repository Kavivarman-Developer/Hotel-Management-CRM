"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const validate_1 = require("../middleware/validate");
const idempotency_1 = require("../middleware/idempotency");
const payment_validator_1 = require("../validators/payment.validator");
const router = (0, express_1.Router)();
router.post('/payments/create', (0, validate_1.validate)({ body: payment_validator_1.createPaymentOrderSchema }), (0, idempotency_1.idempotency)(), payment_controller_1.PaymentController.createPayment);
router.post('/payments/webhook', (0, validate_1.validate)({ body: payment_validator_1.webhookPayloadSchema }), payment_controller_1.PaymentController.webhook);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map