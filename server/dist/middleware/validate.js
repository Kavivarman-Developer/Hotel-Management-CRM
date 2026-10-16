"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                req.query = (await schemas.query.parseAsync(req.query));
            }
            if (schemas.params) {
                req.params = (await schemas.params.parseAsync(req.params));
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formatted = error.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                (0, response_1.sendError)(res, 'VALIDATION_ERROR', 'Request validation failed', 422, formatted);
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map