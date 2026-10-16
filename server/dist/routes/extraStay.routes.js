"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const extraStay_controller_1 = require("../controllers/extraStay.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const extraStay_validator_1 = require("../validators/extraStay.validator");
const router = (0, express_1.Router)();
// Guest: Submit extra stay / late check-out request
router.post('/extra-stays/request', (0, validate_1.validate)({ body: extraStay_validator_1.createExtraStaySchema }), extraStay_controller_1.ExtraStayController.submitRequest);
// Guest: View requests for a booking reference
router.get('/extra-stays/booking/:reference', extraStay_controller_1.ExtraStayController.getBookingRequests);
// Admin: List all requests with filters
router.get('/extra-stays', auth_1.authenticate, (0, auth_1.requirePermission)('dashboard.view'), extraStay_controller_1.ExtraStayController.listRequests);
// Admin: Approve extra stay request
router.post('/extra-stays/:id/approve', auth_1.authenticate, (0, auth_1.requirePermission)('checkin.complete'), (0, validate_1.validate)({ body: extraStay_validator_1.approveExtraStaySchema }), extraStay_controller_1.ExtraStayController.approveRequest);
// Admin: Reject extra stay request
router.post('/extra-stays/:id/reject', auth_1.authenticate, (0, auth_1.requirePermission)('checkin.complete'), (0, validate_1.validate)({ body: extraStay_validator_1.rejectExtraStaySchema }), extraStay_controller_1.ExtraStayController.rejectRequest);
exports.default = router;
//# sourceMappingURL=extraStay.routes.js.map