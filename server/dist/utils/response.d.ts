import { Response } from 'express';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        [key: string]: any;
    };
    meta?: Record<string, any>;
}
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, pagination?: ApiResponse["pagination"]) => Response;
export declare const sendError: (res: Response, code: string, message: string, statusCode?: number, details?: any) => Response;
