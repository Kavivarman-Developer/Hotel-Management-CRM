export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;
    readonly details?: any;
    constructor(statusCode: number, code: string, message: string, details?: any);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string, code?: string);
}
export declare class RoomUnavailableError extends AppError {
    constructor(message?: string);
}
export declare class UnprocessableEntityError extends AppError {
    constructor(message?: string, details?: any);
}
