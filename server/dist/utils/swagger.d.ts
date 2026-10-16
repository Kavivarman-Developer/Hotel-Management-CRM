import { Express } from 'express';
export declare const swaggerDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            email: string;
            phone: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
            idempotencyHeader: {
                type: string;
                in: string;
                name: string;
                description: string;
            };
        };
        schemas: {
            StandardSuccessResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                };
            };
            StandardErrorResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    error: {
                        type: string;
                        properties: {
                            code: {
                                type: string;
                                example: string;
                            };
                            message: {
                                type: string;
                                example: string;
                            };
                            details: {
                                type: string;
                            };
                        };
                    };
                };
            };
            AvailabilitySearchQuery: {
                type: string;
                required: string[];
                properties: {
                    checkIn: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    checkOut: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    guests: {
                        type: string;
                        minimum: number;
                        example: number;
                    };
                    rooms: {
                        type: string;
                        minimum: number;
                        default: number;
                        example: number;
                    };
                    roomTypeId: {
                        type: string;
                    };
                    discountCode: {
                        type: string;
                        example: string;
                    };
                };
            };
        };
    };
    paths: {
        '/auth/login': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/auth/refresh': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    refreshToken: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/auth/me': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/rooms/availability': {
            get: {
                summary: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                    example: string;
                } | {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                    example: number;
                })[];
                responses: {
                    200: {
                        description: string;
                    };
                    422: {
                        description: string;
                    };
                };
            };
        };
        '/holds': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    roomTypeId: {
                                        type: string;
                                    };
                                    checkInDate: {
                                        type: string;
                                        example: string;
                                    };
                                    checkOutDate: {
                                        type: string;
                                        example: string;
                                    };
                                    numberOfGuests: {
                                        type: string;
                                        example: number;
                                    };
                                    discountCode: {
                                        type: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                    409: {
                        description: string;
                    };
                };
            };
        };
        '/bookings': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    holdId: {
                                        type: string;
                                    };
                                    holdToken: {
                                        type: string;
                                    };
                                    roomTypeId: {
                                        type: string;
                                    };
                                    checkInDate: {
                                        type: string;
                                        example: string;
                                    };
                                    checkOutDate: {
                                        type: string;
                                        example: string;
                                    };
                                    numberOfGuests: {
                                        type: string;
                                        example: number;
                                    };
                                    guest: {
                                        type: string;
                                        required: string[];
                                        properties: {
                                            fullName: {
                                                type: string;
                                                example: string;
                                            };
                                            email: {
                                                type: string;
                                                example: string;
                                            };
                                            mobile: {
                                                type: string;
                                                example: string;
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                    409: {
                        description: string;
                    };
                };
            };
        };
        '/bookings/{reference}': {
            get: {
                summary: string;
                tags: string[];
                parameters: ({
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                    example: string;
                } | {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                    };
                    required?: undefined;
                    example?: undefined;
                })[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
        '/qr/{token}/validate': {
            get: {
                summary: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
        '/guest-registrations': {
            post: {
                summary: string;
                tags: string[];
                responses: {
                    201: {
                        description: string;
                    };
                    400: {
                        description: string;
                    };
                };
            };
        };
        '/stays/{id}/check-in': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/stays/{id}/check-out': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/admin/dashboard': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
    };
};
export declare const setupSwagger: (app: Express) => void;
