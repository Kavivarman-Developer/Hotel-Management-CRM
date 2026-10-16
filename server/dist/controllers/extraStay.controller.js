"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraStayController = void 0;
const extraStay_service_1 = require("../services/extraStay.service");
const response_1 = require("../utils/response");
class ExtraStayController {
    /**
     * Guest or Front Desk submits an extension request
     */
    static async submitRequest(req, res, next) {
        try {
            const result = await extraStay_service_1.ExtraStayService.createRequest(req.body);
            (0, response_1.sendSuccess)(res, result, 'Extra stay request submitted successfully. Awaiting front desk approval.', 201);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Admin lists all requests
     */
    static async listRequests(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
            const status = req.query.status;
            const search = req.query.search;
            const result = await extraStay_service_1.ExtraStayService.listRequests({ status, search }, page, limit);
            (0, response_1.sendSuccess)(res, result.requests, 'Extra stay requests retrieved', 200, {
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
    /**
     * Admin approves extension request
     */
    static async approveRequest(req, res, next) {
        try {
            const id = req.params.id;
            const { addToFolio = true, staffNotes } = req.body;
            const result = await extraStay_service_1.ExtraStayService.approveRequest(id, req.user.id, addToFolio, staffNotes);
            (0, response_1.sendSuccess)(res, result, 'Extra stay extension approved and charges logged to folio.', 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Admin rejects extension request
     */
    static async rejectRequest(req, res, next) {
        try {
            const id = req.params.id;
            const { rejectionReason } = req.body;
            const result = await extraStay_service_1.ExtraStayService.rejectRequest(id, req.user.id, rejectionReason);
            (0, response_1.sendSuccess)(res, result, 'Extra stay extension rejected.', 200);
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Guest looks up status of their requests
     */
    static async getBookingRequests(req, res, next) {
        try {
            const reference = req.params.reference;
            const results = await extraStay_service_1.ExtraStayService.getRequestsForBooking(reference);
            (0, response_1.sendSuccess)(res, results, 'Extra stay requests retrieved for booking', 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExtraStayController = ExtraStayController;
//# sourceMappingURL=extraStay.controller.js.map