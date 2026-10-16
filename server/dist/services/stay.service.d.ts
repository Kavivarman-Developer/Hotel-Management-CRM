import { IStayRecord } from '../models/StayRecord';
export interface CheckInInput {
    bookingId: string;
    staffUserId: string;
    roomId?: string;
    bypassRegistrationCheck?: boolean;
    notes?: string;
}
export interface CheckOutInput {
    stayId: string;
    staffUserId: string;
    additionalCharges?: Array<{
        description: string;
        amount: number;
        category: 'MINI_BAR' | 'ROOM_SERVICE' | 'LAUNDRY' | 'DAMAGE' | 'OVERSTAY' | 'OTHER';
    }>;
    autoCalculateOverstay?: boolean;
    finalPaidAmount?: number;
    notes?: string;
}
export declare class StayService {
    /**
     * Complete digital / front-desk check-in
     */
    static checkIn(input: CheckInInput): Promise<{
        stay: IStayRecord;
        booking: any;
    }>;
    /**
     * Complete check-out, record final billing, and set room to DIRTY for housekeeping
     */
    static checkOut(input: CheckOutInput): Promise<{
        stay: IStayRecord;
        booking: any;
    }>;
    /**
     * Preview real-time overstay charges for a currently active stay
     */
    static getOverstayPreview(stayId: string): Promise<any>;
}
