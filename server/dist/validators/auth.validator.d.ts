import { z } from 'zod';
import { UserRole } from '../types';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    mobile: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<[UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.FRONT_DESK]>;
    permissions: z.ZodOptional<z.ZodArray<z.ZodEnum<z.Writeable<any>>, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    mobile: string;
    name: string;
    role: UserRole;
    permissions?: any[] | undefined;
}, {
    email: string;
    password: string;
    mobile: string;
    name: string;
    role: UserRole;
    permissions?: any[] | undefined;
}>;
export declare const updatePermissionsSchema: z.ZodObject<{
    permissions: z.ZodArray<z.ZodEnum<z.Writeable<any>>, "many">;
}, "strip", z.ZodTypeAny, {
    permissions: any[];
}, {
    permissions: any[];
}>;
export declare const toggleUserStatusSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
