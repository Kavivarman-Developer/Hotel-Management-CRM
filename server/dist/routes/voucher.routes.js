"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voucher_controller_1 = require("../controllers/voucher.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const voucher_validator_1 = require("../validators/voucher.validator");
const router = (0, express_1.Router)();
// Public / Guest / Admin: Validate voucher code for checkout
router.post('/vouchers/validate', (0, validate_1.validate)({ body: voucher_validator_1.validateVoucherSchema }), voucher_controller_1.VoucherController.validate);
// Admin: List all vouchers with statistics
router.get('/vouchers', auth_1.authenticate, (0, auth_1.requirePermission)('dashboard.view'), voucher_controller_1.VoucherController.listVouchers);
// Admin: Create a new voucher
router.post('/vouchers', auth_1.authenticate, (0, auth_1.requirePermission)('rates.manage'), (0, validate_1.validate)({ body: voucher_validator_1.createVoucherSchema }), voucher_controller_1.VoucherController.createVoucher);
// Admin: Update voucher status or details
router.patch('/vouchers/:id', auth_1.authenticate, (0, auth_1.requirePermission)('rates.manage'), (0, validate_1.validate)({ body: voucher_validator_1.updateVoucherSchema }), voucher_controller_1.VoucherController.updateVoucher);
// Admin: Delete voucher
router.delete('/vouchers/:id', auth_1.authenticate, (0, auth_1.requirePermission)('rates.manage'), voucher_controller_1.VoucherController.deleteVoucher);
exports.default = router;
//# sourceMappingURL=voucher.routes.js.map