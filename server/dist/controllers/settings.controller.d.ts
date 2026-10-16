import { Request, Response, NextFunction } from 'express';
export declare const PERMISSION_CATALOG: {
    category: string;
    categoryDescription: string;
    permissions: {
        id: string;
        label: string;
        description: string;
    }[];
}[];
export declare class SettingsController {
    /**
     * GET /api/admin/settings
     * Retrieve property settings and current role defaults
     */
    static getSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/admin/settings
     * Update hotel property operational configurations
     */
    static updateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/admin/permissions
     * Complete catalog of permissions, role permissions, and individual staff permission overrides
     */
    static getPermissionsMetadata(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/admin/roles/:role/permissions
     * Update permissions template for a specific role and cascade to users
     */
    static updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void>;
}
