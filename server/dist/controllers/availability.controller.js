"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const availability_service_1 = require("../services/availability.service");
const response_1 = require("../utils/response");
class AvailabilityController {
    static async getAvailability(req, res, next) {
        try {
            const { checkIn, checkOut, guests, rooms, roomTypeId, discountCode } = req.query;
            const result = await availability_service_1.AvailabilityService.checkAvailability({
                checkIn,
                checkOut,
                guests: Number(guests),
                rooms: rooms ? Number(rooms) : 1,
                roomTypeId,
                discountCode,
            });
            (0, response_1.sendSuccess)(res, result, 'Availability search completed');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AvailabilityController = AvailabilityController;
//# sourceMappingURL=availability.controller.js.map