"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const settings_validator_1 = require("../validators/settings.validator");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Property Settings
router.get('/settings', (0, auth_1.requirePermission)('settings.manage'), settings_controller_1.SettingsController.getSettings);
router.patch('/settings', (0, auth_1.requirePermission)('settings.manage'), (0, validate_1.validate)({ body: settings_validator_1.updatePropertySettingsSchema }), settings_controller_1.SettingsController.updateSettings);
// Roles & Staff Permissions Matrix
router.get('/permissions', (0, auth_1.requirePermission)('permissions.manage'), settings_controller_1.SettingsController.getPermissionsMetadata);
router.post('/roles/:role/permissions', (0, auth_1.requirePermission)('permissions.manage'), (0, validate_1.validate)({ body: settings_validator_1.updateRolePermissionsSchema }), settings_controller_1.SettingsController.updateRolePermissions);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map