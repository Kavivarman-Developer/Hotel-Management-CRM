import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updatePropertySettingsSchema, updateRolePermissionsSchema } from '../validators/settings.validator';

const router = Router();

router.use(authenticate);

// Property Settings
router.get(
  '/settings',
  requirePermission('settings.manage'),
  SettingsController.getSettings
);

router.patch(
  '/settings',
  requirePermission('settings.manage'),
  validate({ body: updatePropertySettingsSchema }),
  SettingsController.updateSettings
);

// Roles & Staff Permissions Matrix
router.get(
  '/permissions',
  requirePermission('permissions.manage'),
  SettingsController.getPermissionsMetadata
);

router.post(
  '/roles/:role/permissions',
  requirePermission('permissions.manage'),
  validate({ body: updateRolePermissionsSchema }),
  SettingsController.updateRolePermissions
);

export default router;
