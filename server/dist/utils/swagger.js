"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = exports.swaggerDocument = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerDocument = {
    openapi: '3.0.3',
    info: {
        title: 'GRAND OMR RESIDENCY - Backend API',
        version: '1.0.0',
        description: `
Authoritative Hotel Room Booking and Property Management System for **GRAND OMR RESIDENCY**, Navalur, Chennai.

### Features
- **Strict Concurrency Control**: Shared \`RoomInventoryLock\` serialized per physical room.
- **Server-Side Pricing Engine**: Guaranteed integrity in integer paise (INR).
- **Two-Phase Hold & Booking Lifecycle**: Automatic hold expiration and atomic transitions.
- **Digital QR Registration**: Secure token hash check-in link with ID masking.
- **Operational Housekeeping vs Availability**: Independent separation.
- **Real-time PMS & Dashboard Reports**: Occupancy, revenue, arrivals, and departures.
    `,
        contact: {
            name: 'Grand OMR Residency Engineering',
            email: 'reservations@grandomrresidency.com',
            phone: '+91 8110018708',
        },
    },
    servers: [
        {
            url: '/api',
            description: 'Default API Base Path',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Provide your JWT access token (Bearer <token>)',
            },
            idempotencyHeader: {
                type: 'apiKey',
                in: 'header',
                name: 'Idempotency-Key',
                description: 'Unique UUID to ensure idempotent processing',
            },
        },
        schemas: {
            StandardSuccessResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Operation completed' },
                },
            },
            StandardErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string', example: 'ROOM_UNAVAILABLE' },
                            message: { type: 'string', example: 'The selected room is no longer available' },
                            details: { type: 'object' },
                        },
                    },
                },
            },
            AvailabilitySearchQuery: {
                type: 'object',
                required: ['checkIn', 'checkOut', 'guests'],
                properties: {
                    checkIn: { type: 'string', format: 'date', example: '2026-10-20' },
                    checkOut: { type: 'string', format: 'date', example: '2026-10-22' },
                    guests: { type: 'integer', minimum: 1, example: 2 },
                    rooms: { type: 'integer', minimum: 1, default: 1, example: 1 },
                    roomTypeId: { type: 'string' },
                    discountCode: { type: 'string', example: 'WELCOME10' },
                },
            },
        },
    },
    paths: {
        '/auth/login': {
            post: {
                summary: 'Staff Login',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', example: 'admin@grandomrresidency.com' },
                                    password: { type: 'string', example: 'SuperAdmin@2026' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Login successful with JWT access and refresh tokens' },
                    401: { description: 'Invalid credentials' },
                },
            },
        },
        '/auth/refresh': {
            post: {
                summary: 'Rotate Refresh Token',
                tags: ['Authentication'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken'],
                                properties: {
                                    refreshToken: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Rotated token pair returned' },
                    401: { description: 'Invalid or revoked refresh token' },
                },
            },
        },
        '/auth/me': {
            get: {
                summary: 'Current User Profile',
                tags: ['Authentication'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Profile returned' },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/rooms/availability': {
            get: {
                summary: 'Search Room Availability & Authoritative Pricing',
                tags: ['Availability'],
                parameters: [
                    { name: 'checkIn', in: 'query', required: true, schema: { type: 'string' }, example: '2026-10-20' },
                    { name: 'checkOut', in: 'query', required: true, schema: { type: 'string' }, example: '2026-10-22' },
                    { name: 'guests', in: 'query', required: true, schema: { type: 'integer' }, example: 2 },
                    { name: 'rooms', in: 'query', required: false, schema: { type: 'integer' }, example: 1 },
                    { name: 'discountCode', in: 'query', required: false, schema: { type: 'string' }, example: 'WELCOME10' },
                ],
                responses: {
                    200: { description: 'Available room categories and breakdown returned' },
                    422: { description: 'Validation failed' },
                },
            },
        },
        '/holds': {
            post: {
                summary: 'Create Temporary Room Hold (Concurrency Protected)',
                tags: ['Bookings & Holds'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['roomTypeId', 'checkInDate', 'checkOutDate', 'numberOfGuests'],
                                properties: {
                                    roomTypeId: { type: 'string' },
                                    checkInDate: { type: 'string', example: '2026-10-20' },
                                    checkOutDate: { type: 'string', example: '2026-10-22' },
                                    numberOfGuests: { type: 'integer', example: 2 },
                                    discountCode: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Hold created with holdToken and expiration' },
                    409: { description: 'Room unavailable for requested dates' },
                },
            },
        },
        '/bookings': {
            post: {
                summary: 'Create Confirmed Reservation',
                tags: ['Bookings & Holds'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['checkInDate', 'checkOutDate', 'numberOfGuests', 'guest'],
                                properties: {
                                    holdId: { type: 'string' },
                                    holdToken: { type: 'string' },
                                    roomTypeId: { type: 'string' },
                                    checkInDate: { type: 'string', example: '2026-10-20' },
                                    checkOutDate: { type: 'string', example: '2026-10-22' },
                                    numberOfGuests: { type: 'integer', example: 2 },
                                    guest: {
                                        type: 'object',
                                        required: ['fullName', 'email', 'mobile'],
                                        properties: {
                                            fullName: { type: 'string', example: 'Rajesh Kumar' },
                                            email: { type: 'string', example: 'rajesh.kumar@example.com' },
                                            mobile: { type: 'string', example: '+91 9876543210' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Booking confirmed with bookingReference and QR check-in token' },
                    409: { description: 'Room unavailable' },
                },
            },
        },
        '/bookings/{reference}': {
            get: {
                summary: 'Lookup Booking By Reference (Data Minimized)',
                tags: ['Bookings & Holds'],
                parameters: [
                    { name: 'reference', in: 'path', required: true, schema: { type: 'string' }, example: 'GOR-20261020-A1B2' },
                    { name: 'email', in: 'query', schema: { type: 'string' } },
                    { name: 'mobile', in: 'query', schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Booking details retrieved' },
                    401: { description: 'Verification required' },
                    404: { description: 'Booking reference not found' },
                },
            },
        },
        '/qr/{token}/validate': {
            get: {
                summary: 'Validate QR Digital Check-in Link',
                tags: ['QR Registration'],
                parameters: [
                    { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
                ],
                responses: {
                    200: { description: 'Token validated, returns summary for check-in form' },
                    401: { description: 'Expired token' },
                    404: { description: 'Invalid token' },
                },
            },
        },
        '/guest-registrations': {
            post: {
                summary: 'Submit Guest Digital Registration',
                tags: ['QR Registration'],
                responses: {
                    201: { description: 'Registration submitted for staff review' },
                    400: { description: 'Validation failed' },
                },
            },
        },
        '/stays/{id}/check-in': {
            post: {
                summary: 'Complete Guest Check-in',
                tags: ['Stays & PMS'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Guest checked in successfully' },
                },
            },
        },
        '/stays/{id}/check-out': {
            post: {
                summary: 'Complete Check-out & Settle Bill',
                tags: ['Stays & PMS'],
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Stay completed, room flagged DIRTY for housekeeping' },
                },
            },
        },
        '/admin/dashboard': {
            get: {
                summary: 'PMS Real-Time Operational Dashboard',
                tags: ['Admin & PMS'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Live database occupancy, operations, and financial metrics' },
                },
            },
        },
    },
};
const setupSwagger = (app) => {
    app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(exports.swaggerDocument));
    app.get('/api/docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(exports.swaggerDocument);
    });
};
exports.setupSwagger = setupSwagger;
//# sourceMappingURL=swagger.js.map