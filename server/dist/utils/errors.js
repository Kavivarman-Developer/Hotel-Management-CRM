"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnprocessableEntityError = exports.RoomUnavailableError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request', details) {
        super(400, 'BAD_REQUEST', message, details);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
        super(401, code, message);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access denied: insufficient permissions', code = 'FORBIDDEN') {
        super(403, code, message);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Requested resource not found', code = 'NOT_FOUND') {
        super(404, code, message);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', code = 'CONFLICT') {
        super(409, code, message);
    }
}
exports.ConflictError = ConflictError;
class RoomUnavailableError extends AppError {
    constructor(message = 'The selected room is no longer available for the requested dates') {
        super(409, 'ROOM_UNAVAILABLE', message);
    }
}
exports.RoomUnavailableError = RoomUnavailableError;
class UnprocessableEntityError extends AppError {
    constructor(message = 'Validation failed', details) {
        super(422, 'VALIDATION_ERROR', message, details);
    }
}
exports.UnprocessableEntityError = UnprocessableEntityError;
//# sourceMappingURL=errors.js.map