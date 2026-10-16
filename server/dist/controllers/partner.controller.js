"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerController = void 0;
const PartnerHotel_1 = require("../models/PartnerHotel");
const response_1 = require("../utils/response");
const errors_1 = require("../utils/errors");
const types_1 = require("../types");
const audit_1 = require("../utils/audit");
class PartnerController {
    // Public listing: only approved and active
    static async listPublicPartners(req, res, next) {
        try {
            const partners = await PartnerHotel_1.PartnerHotel.find({
                listingStatus: types_1.PartnerListingStatus.ACTIVE,
                approvalStatus: types_1.PartnerApprovalStatus.APPROVED,
            }).select('-__v');
            (0, response_1.sendSuccess)(res, partners, 'Partner hotels retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async getPublicPartner(req, res, next) {
        try {
            const id = req.params.id;
            const partner = await PartnerHotel_1.PartnerHotel.findOne({
                _id: id,
                listingStatus: types_1.PartnerListingStatus.ACTIVE,
                approvalStatus: types_1.PartnerApprovalStatus.APPROVED,
            });
            if (!partner) {
                throw new errors_1.NotFoundError('Partner hotel not found or not active');
            }
            (0, response_1.sendSuccess)(res, partner, 'Partner hotel retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    // Admin Management
    static async adminListPartners(req, res, next) {
        try {
            const partners = await PartnerHotel_1.PartnerHotel.find().sort({ createdAt: -1 });
            (0, response_1.sendSuccess)(res, partners, 'All partner hotels retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminCreatePartner(req, res, next) {
        try {
            const partner = await PartnerHotel_1.PartnerHotel.create({
                ...req.body,
                approvedBy: req.user.id,
            });
            await (0, audit_1.logAudit)({
                req,
                action: 'PARTNER_HOTEL_CREATED',
                entityType: 'PartnerHotel',
                entityId: partner._id.toString(),
                changes: { after: { name: partner.hotelName } },
            });
            (0, response_1.sendSuccess)(res, partner, 'Partner hotel listing created', 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async adminUpdatePartner(req, res, next) {
        try {
            const id = req.params.id;
            const partner = await PartnerHotel_1.PartnerHotel.findByIdAndUpdate(id, { $set: req.body }, { new: true });
            if (!partner) {
                throw new errors_1.NotFoundError('Partner hotel not found');
            }
            await (0, audit_1.logAudit)({
                req,
                action: 'PARTNER_HOTEL_UPDATED',
                entityType: 'PartnerHotel',
                entityId: id,
            });
            (0, response_1.sendSuccess)(res, partner, 'Partner hotel listing updated');
        }
        catch (error) {
            next(error);
        }
    }
    static async adminDeletePartner(req, res, next) {
        try {
            const id = req.params.id;
            const partner = await PartnerHotel_1.PartnerHotel.findByIdAndUpdate(id, {
                listingStatus: types_1.PartnerListingStatus.INACTIVE,
            });
            if (!partner) {
                throw new errors_1.NotFoundError('Partner hotel not found');
            }
            await (0, audit_1.logAudit)({
                req,
                action: 'PARTNER_HOTEL_DEACTIVATED',
                entityType: 'PartnerHotel',
                entityId: id,
            });
            (0, response_1.sendSuccess)(res, null, 'Partner hotel listing archived');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PartnerController = PartnerController;
//# sourceMappingURL=partner.controller.js.map