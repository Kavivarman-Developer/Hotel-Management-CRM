import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const router = Router();

router.get('/rooms', RoomController.listPublicRooms);
router.get('/rooms/:id', RoomController.getPublicRoom);
router.get('/room-types', RoomController.listRoomTypes);

export default router;
