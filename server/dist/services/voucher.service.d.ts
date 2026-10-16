import { IVoucher } from '../models/Voucher';
export interface VoucherCalculationResult {
    isValid: boolean;
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    discountPaise: number;
    discountedSubtotalPaise: number;
    message: string;
}
export declare class VoucherService {
    /**
     * Validate voucher code and compute real-time discount for a subtotal
     */
    static validateAndCalculate(code: string, subtotalPaise: number): Promise<VoucherCalculationResult>;
    /**
     * Increment redemption counter
     */
    static incrementUsage(code: string): Promise<void>;
    /**
     * Create a new voucher
     */
    static createVoucher(data: any, staffUserId?: string): Promise<IVoucher>;
    /**
     * List vouchers with optional search and pagination
     */
    static listVouchers(filter?: any, page?: number, limit?: number): Promise<{
        vouchers: IVoucher[];
        total: number;
        stats: {
            totalVouchers: number;
            activeVouchers: number;
            totalRedemptions: number;
        };
    }>;
    /**
     * Update voucher details or active status
     */
    static updateVoucher(id: string, data: any): Promise<IVoucher>;
    /**
     * Delete voucher
     */
    static deleteVoucher(id: string): Promise<void>;
    /**
     * Seed standard promotional vouchers if none exist
     */
    static seedDefaultVouchers(): Promise<void>;
}
