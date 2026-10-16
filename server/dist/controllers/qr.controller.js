"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrController = void 0;
const qr_service_1 = require("../services/qr.service");
const GuestRegistration_1 = require("../models/GuestRegistration");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
class QrController {
    static async validateToken(req, res, next) {
        try {
            const token = req.params.token;
            const result = await qr_service_1.QrService.validateToken(token);
            (0, response_1.sendSuccess)(res, result, 'Token validated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async submitRegistration(req, res, next) {
        try {
            const token = (req.headers['x-qr-token'] || req.body.token);
            const result = await qr_service_1.QrService.submitRegistration(token, req.body);
            (0, response_1.sendSuccess)(res, {
                id: result._id,
                verificationStatus: result.verificationStatus,
                submittedAt: result.submittedAt,
            }, 'Guest digital registration submitted successfully. Please present your government ID at the front desk upon arrival.', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async submitWalkInRegistration(req, res, next) {
        try {
            const result = await qr_service_1.QrService.submitWalkInRegistration(req.body);
            (0, response_1.sendSuccess)(res, result, 'Walk-in digital self-registration submitted successfully. Please show your confirmation code to reception.', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async listRegistrations(req, res, next) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const skip = (page - 1) * limit;
            const filter = {};
            if (req.query.status) {
                filter.verificationStatus = req.query.status;
            }
            const total = await GuestRegistration_1.GuestRegistration.countDocuments(filter);
            const registrations = await GuestRegistration_1.GuestRegistration.find(filter)
                .populate('bookingId', 'bookingReference checkInDate checkOutDate stayStatus')
                .populate('guestId', 'fullName email mobile')
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            (0, response_1.sendSuccess)(res, registrations, 'Registrations retrieved', 200, {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getRegistration(req, res, next) {
        try {
            const id = req.params.id;
            const registration = await GuestRegistration_1.GuestRegistration.findById(id)
                .populate('bookingId')
                .populate('guestId')
                .populate('reviewedBy', 'name email');
            if (!registration) {
                throw new errors_1.NotFoundError('Registration not found');
            }
            (0, response_1.sendSuccess)(res, registration, 'Registration details retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async approveRegistration(req, res, next) {
        try {
            const id = req.params.id;
            const { notes } = req.body;
            const approved = await qr_service_1.QrService.approveRegistration(id, req.user.id, notes);
            (0, response_1.sendSuccess)(res, approved, 'Guest registration verified and approved');
        }
        catch (error) {
            next(error);
        }
    }
    static async rejectRegistration(req, res, next) {
        try {
            const id = req.params.id;
            const { reason } = req.body;
            const rejected = await qr_service_1.QrService.rejectRegistration(id, req.user.id, reason || 'Document verification failed');
            (0, response_1.sendSuccess)(res, rejected, 'Guest registration rejected');
        }
        catch (error) {
            next(error);
        }
    }
    static async reissueQrToken(req, res, next) {
        try {
            const id = req.params.id;
            const result = await qr_service_1.QrService.reissueQrToken(id, req.user.id);
            (0, response_1.sendSuccess)(res, result, 'New QR registration token issued successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.QrController = QrController;
//# sourceMappingURL=qr.controller.js.map