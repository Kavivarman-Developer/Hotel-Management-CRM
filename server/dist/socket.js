"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitBroadcast = exports.emitToGuest = exports.emitToAdmin = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const env_1 = require("./config/env");
let io = null;
const initSocket = (httpServer) => {
    const allowedOrigins = env_1.env.CLIENT_URL.split(',').map((url) => url.trim());
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || true) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST'],
        },
        transports: ['websocket', 'polling'],
    });
    io.on('connection', (socket) => {
        // Staff/Admin room
        socket.on('join_admin', () => {
            socket.join('admin-room');
        });
        // Guest booking specific room
        socket.on('join_booking', (bookingReference) => {
            if (bookingReference) {
                socket.join(`booking_${bookingReference.toUpperCase()}`);
            }
        });
        socket.on('disconnect', () => {
            // client disconnected
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    return io;
};
exports.getIO = getIO;
const emitToAdmin = (event, data) => {
    if (io) {
        io.to('admin-room').emit(event, data);
        // Also broadcast so any listening client receives it
        io.emit(event, data);
    }
};
exports.emitToAdmin = emitToAdmin;
const emitToGuest = (bookingReference, event, data) => {
    if (io && bookingReference) {
        io.to(`booking_${bookingReference.toUpperCase()}`).emit(event, data);
    }
};
exports.emitToGuest = emitToGuest;
const emitBroadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
exports.emitBroadcast = emitBroadcast;
//# sourceMappingURL=socket.js.map