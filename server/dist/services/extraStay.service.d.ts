import { IExtraStayRequest } from '../models/ExtraStayRequest';
export declare class ExtraStayService {
    /**
     * Guest or Front Desk submits an extra stay / late checkout extension request
     */
    static createRequest(input: {
        bookingReference: string;
        requestedExtraHours: number;
        reason: string;
    }): Promise<IExtraStayRequest>;
    /**
     * List all extra stay requests with filter, pagination & stats
     */
    static listRequests(filter?: any, page?: number, limit?: number): Promise<{
        requests: IExtraStayRequest[];
        total: number;
        stats: {
            pending: number;
            approved: number;
            rejected: number;
            totalRevenuePaise: number;
        };
    }>;
    /**
     * Approve an extra stay request and append charge to Folio / StayRecord
     */
    static approveRequest(id: string, staffUserId: string, addToFolio?: boolean, staffNotes?: string): Promise<IExtraStayRequest>;
    /**
     * Reject an extra stay request with explanation
     */
    static rejectRequest(id: string, staffUserId: string, rejectionReason: string): Promise<IExtraStayRequest>;
    /**
     * Check status of requests for a specific booking reference
     */
    static getRequestsForBooking(bookingReference: string): Promise<IExtraStayRequest[]>;
}
