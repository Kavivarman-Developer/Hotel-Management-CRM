"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoucherController = void 0;
const voucher_service_1 = require("../services/voucher.service");
const response_1 = require("../utils/response");
class VoucherController {
    static async validate(req, res, next) {
        try {
            const { code, subtotal } = req.body;
            const result = await voucher_service_1.VoucherService.validateAndCalculate(code, Number(subtotal));
            (0, response_1.sendSuccess)(res, result, result.message, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async listVouchers(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
            const search = req.query.search;
            const isActive = req.query.isActive;
            const result = await voucher_service_1.VoucherService.listVouchers({ search, isActive }, page, limit);
            (0, response_1.sendSuccess)(res, result.vouchers, 'Vouchers retrieved', 200, {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
                stats: result.stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createVoucher(req, res, next) {
        try {
            const voucher = await voucher_service_1.VoucherService.createVoucher(req.body, req.user?.id);
            (0, response_1.sendSuccess)(res, voucher, 'Voucher created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateVoucher(req, res, next) {
        try {
            const id = req.params.id;
            const voucher = await voucher_service_1.VoucherService.updateVoucher(id, req.body);
            (0, response_1.sendSuccess)(res, voucher, 'Voucher updated successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteVoucher(req, res, next) {
        try {
            const id = req.params.id;
            await voucher_service_1.VoucherService.deleteVoucher(id);
            (0, response_1.sendSuccess)(res, null, 'Voucher deleted successfully', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.VoucherController = VoucherController;
//# sourceMappingURL=voucher.controller.js.map