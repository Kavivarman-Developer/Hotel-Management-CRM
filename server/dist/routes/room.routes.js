"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const room_controller_1 = require("../controllers/room.controller");
const router = (0, express_1.Router)();
router.get('/rooms', room_controller_1.RoomController.listPublicRooms);
router.get('/rooms/:id', room_controller_1.RoomController.getPublicRoom);
router.get('/room-types', room_controller_1.RoomController.listRoomTypes);
exports.default = router;
//# sourceMappingURL=room.routes.js.map