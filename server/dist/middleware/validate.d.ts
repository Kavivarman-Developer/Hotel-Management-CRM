import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationTargets {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
export declare const validate: (schemas: ValidationTargets) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
