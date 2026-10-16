"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const auth_validator_1 = require("../validators/auth.validator");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiting on login to prevent brute force
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many login attempts. Please try again after 15 minutes.',
        },
    },
});
router.post('/login', loginLimiter, (0, validate_1.validate)({ body: auth_validator_1.loginSchema }), auth_controller_1.AuthController.login);
router.post('/refresh', (0, validate_1.validate)({ body: auth_validator_1.refreshTokenSchema }), auth_controller_1.AuthController.refresh);
router.post('/logout', auth_1.authenticate, auth_controller_1.AuthController.logout);
router.get('/me', auth_1.authenticate, auth_controller_1.AuthController.me);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map