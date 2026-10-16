"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Operation completed', statusCode = 200, pagination) => {
    const responseBody = {
        success: true,
        data,
        message,
    };
    if (pagination) {
        responseBody.pagination = pagination;
    }
    return res.status(statusCode).json(responseBody);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, code, message, statusCode = 400, details) => {
    const responseBody = {
        success: false,
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    };
    return res.status(statusCode).json(responseBody);
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map