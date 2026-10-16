import mongoose from 'mongoose';
import { Voucher, IVoucher } from '../models/Voucher';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';

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

export class VoucherService {
  /**
   * Validate voucher code and compute real-time discount for a subtotal
   */
  public static async validateAndCalculate(
    code: string,
    subtotalPaise: number
  ): Promise<VoucherCalculationResult> {
    const normalizedCode = code.toUpperCase().trim();
    const voucher = await Voucher.findOne({ code: normalizedCode });

    if (!voucher) {
      throw new NotFoundError(`Voucher code '${normalizedCode}' is invalid`);
    }

    if (!voucher.isActive) {
      throw new BadRequestError(`Voucher code '${normalizedCode}' is currently inactive`);
    }

    const now = new Date();
    if (voucher.validFrom && now < new Date(voucher.validFrom)) {
      throw new BadRequestError(`Voucher '${normalizedCode}' is not active yet`);
    }

    if (voucher.validUntil && now > new Date(voucher.validUntil)) {
      throw new BadRequestError(`Voucher '${normalizedCode}' has expired`);
    }

    if (voucher.usageLimit && voucher.timesUsed >= voucher.usageLimit) {
      throw new BadRequestError(`Voucher '${normalizedCode}' usage limit has been reached`);
    }

    if (voucher.minBookingAmount && subtotalPaise < voucher.minBookingAmount) {
      const minRupees = Math.round(voucher.minBookingAmount / 100);
      throw new BadRequestError(
        `Voucher '${normalizedCode}' requires a minimum booking subtotal of ₹${minRupees}`
      );
    }

    // Calculate discount amount
    let discountPaise = 0;
    if (voucher.discountType === 'PERCENTAGE') {
      discountPaise = Math.round((subtotalPaise * voucher.discountValue) / 100);
      if (voucher.maxDiscountAmount && discountPaise > voucher.maxDiscountAmount) {
        discountPaise = voucher.maxDiscountAmount;
      }
    } else {
      // FIXED_AMOUNT (discountValue is in paise)
      discountPaise = Math.min(subtotalPaise, voucher.discountValue);
    }

    const discountedSubtotalPaise = Math.max(0, subtotalPaise - discountPaise);

    return {
      isValid: true,
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountPaise,
      discountedSubtotalPaise,
      message: `Voucher '${voucher.code}' applied successfully! Saved ₹${Math.round(discountPaise / 100)}`,
    };
  }

  /**
   * Increment redemption counter
   */
  public static async incrementUsage(code: string): Promise<void> {
    if (!code) return;
    const normalizedCode = code.toUpperCase().trim();
    await Voucher.updateOne({ code: normalizedCode }, { $inc: { timesUsed: 1 } });
  }

  /**
   * Create a new voucher
   */
  public static async createVoucher(data: any, staffUserId?: string): Promise<IVoucher> {
    const normalizedCode = data.code.toUpperCase().trim();
    const existing = await Voucher.findOne({ code: normalizedCode });
    if (existing) {
      throw new ConflictError(`Voucher with code '${normalizedCode}' already exists`);
    }

    const voucher = new Voucher({
      ...data,
      code: normalizedCode,
      createdBy: staffUserId ? new mongoose.Types.ObjectId(staffUserId) : undefined,
    });

    return await voucher.save();
  }

  /**
   * List vouchers with optional search and pagination
   */
  public static async listVouchers(filter: any = {}, page = 1, limit = 50): Promise<{
    vouchers: IVoucher[];
    total: number;
    stats: {
      totalVouchers: number;
      activeVouchers: number;
      totalRedemptions: number;
    };
  }> {
    const skip = (page - 1) * limit;
    const query: any = {};

    if (filter.search) {
      query.$or = [
        { code: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive === true || filter.isActive === 'true';
    }

    const [vouchers, total, allVouchers] = await Promise.all([
      Voucher.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('createdBy', 'name email'),
      Voucher.countDocuments(query),
      Voucher.find().select('isActive timesUsed'),
    ]);

    const activeVouchers = allVouchers.filter((v) => v.isActive).length;
    const totalRedemptions = allVouchers.reduce((acc, v) => acc + (v.timesUsed || 0), 0);

    return {
      vouchers,
      total,
      stats: {
        totalVouchers: allVouchers.length,
        activeVouchers,
        totalRedemptions,
      },
    };
  }

  /**
   * Update voucher details or active status
   */
  public static async updateVoucher(id: string, data: any): Promise<IVoucher> {
    const voucher = await Voucher.findById(id);
    if (!voucher) {
      throw new NotFoundError('Voucher not found');
    }

    Object.assign(voucher, data);
    return await voucher.save();
  }

  /**
   * Delete voucher
   */
  public static async deleteVoucher(id: string): Promise<void> {
    const result = await Voucher.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError('Voucher not found');
    }
  }

  /**
   * Seed standard promotional vouchers if none exist
   */
  public static async seedDefaultVouchers(): Promise<void> {
    const count = await Voucher.countDocuments();
    if (count > 0) return;

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 2);

    const defaultVouchers = [
      {
        code: 'GRAND10',
        description: 'Direct Website Special: 10% discount on all room bookings',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minBookingAmount: 100000, // ₹1,000
        maxDiscountAmount: 100000, // max ₹1,000
        validUntil: nextYear,
        usageLimit: 1000,
        isActive: true,
      },
      {
        code: 'FLAT500',
        description: 'Grand OMR Welcome Offer: Flat ₹500 off on stays above ₹2,500',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000, // ₹500
        minBookingAmount: 250000, // ₹2,500
        validUntil: nextYear,
        usageLimit: 500,
        isActive: true,
      },
      {
        code: 'OMRSPECIAL',
        description: 'Luxury Suite Promotion: Flat ₹1,000 off on reservations above ₹5,000',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000, // ₹1,000
        minBookingAmount: 500000, // ₹5,000
        validUntil: nextYear,
        usageLimit: 300,
        isActive: true,
      },
      {
        code: 'CHENNAI20',
        description: 'Festival Saver: 20% discount on multi-night family stays',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minBookingAmount: 300000, // ₹3,000
        maxDiscountAmount: 200000, // max ₹2,000
        validUntil: nextYear,
        usageLimit: 200,
        isActive: true,
      },
    ];

    await Voucher.insertMany(defaultVouchers);
    console.log('[VoucherService] Successfully seeded 4 default hotel promotional vouchers.');
  }
}
