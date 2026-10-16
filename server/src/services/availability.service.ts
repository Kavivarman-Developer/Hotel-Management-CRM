import mongoose from 'mongoose';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { RoomHold } from '../models/RoomHold';
import { PricingService } from './pricing.service';
import { ReservationStatus, HoldStatus, RoomStatus } from '../types';
import { BadRequestError } from '../utils/errors';

export interface AvailabilitySearchParams {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests: number;
  rooms?: number;
  roomTypeId?: string;
  discountCode?: string;
}

export interface AvailableRoomOption {
  roomType: {
    id: string;
    name: string;
    code: string;
    description: string;
    tagline?: string;
    category: string;
    bedConfiguration: string;
    maxOccupancy: {
      adults: number;
      children: number;
      total: number;
    };
    amenities: string[];
    features: string[];
    images: string[];
    sizeSqFt?: number;
  };
  availableRoomsCount: number;
  availableRoomIds: string[];
  pricing: {
    currency: string;
    nightCount: number;
    subtotal: number; // paise
    discount: number; // paise
    discountCode?: string;
    taxes: number; // paise
    taxRatePercentage: number;
    additionalCharges: number; // paise
    totalAmount: number; // paise
    formattedTotalAmount: string; // e.g. "₹3,598.00"
    perNightBreakdown: Array<{
      date: string;
      baseRate: number;
      effectiveRate: number;
      discountedRate: number;
      extraGuestCharge: number;
      totalNightRate: number;
    }>;
  };
}

export class AvailabilityService {
  /**
   * Helper to format paise into INR string
   */
  public static formatINR(paise: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  }

  /**
   * Checks if two date ranges overlap. Checkout date is exclusive.
   * Overlap rule: existing.checkIn < requested.checkOut && existing.checkOut > requested.checkIn
   */
  public static isDateOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ): boolean {
    return startA < endB && endA > startB;
  }

  /**
   * Find available room types and eligible physical rooms.
   */
  public static async checkAvailability(
    params: AvailabilitySearchParams,
    session: mongoose.ClientSession | null = null
  ) {
    const { checkIn, checkOut, guests, rooms = 1, roomTypeId, discountCode } = params;

    // 1. Basic date checks
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      throw new BadRequestError('Dates must be in YYYY-MM-DD format');
    }

    if (checkIn >= checkOut) {
      throw new BadRequestError('checkIn must be strictly before checkOut date');
    }

    if (guests < 1) {
      throw new BadRequestError('guests count must be a positive integer');
    }

    if (rooms < 1) {
      throw new BadRequestError('rooms count must be a positive integer');
    }

    // 2. Fetch all active physical rooms
    const roomQuery: any = {
      status: RoomStatus.ACTIVE,
    };
    if (roomTypeId) {
      roomQuery.roomTypeId = new mongoose.Types.ObjectId(roomTypeId);
    }

    const allActiveRooms = await Room.find(roomQuery).session(session).lean();
    if (allActiveRooms.length === 0) {
      return {
        searchCriteria: { checkIn, checkOut, guests, rooms, roomTypeId },
        available: false,
        totalAvailableRooms: 0,
        roomTypes: [],
      };
    }

    const roomIds = allActiveRooms.map((r) => r._id);

    // 3. Find confirmed overlapping bookings
    // Rule: reservationStatus blocks unless CANCELLED or EXPIRED
    const blockingBookings = await Booking.find({
      assignedRoomId: { $in: roomIds },
      reservationStatus: {
        $in: [ReservationStatus.CONFIRMED, ReservationStatus.PENDING_PAYMENT, ReservationStatus.HELD],
      },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    })
      .session(session)
      .select('assignedRoomId')
      .lean();

    const bookedRoomIds = new Set(blockingBookings.map((b) => b.assignedRoomId.toString()));

    // 4. Find active, unexpired holds
    // Expired holds MUST NOT block inventory even without background cleanup!
    const now = new Date();
    const activeHolds = await RoomHold.find({
      roomId: { $in: roomIds },
      status: HoldStatus.ACTIVE,
      expirationTimestamp: { $gt: now },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    })
      .session(session)
      .select('roomId')
      .lean();

    const heldRoomIds = new Set(activeHolds.map((h) => h.roomId.toString()));

    // 5. Filter out rooms in maintenance during requested dates
    const availableRooms = allActiveRooms.filter((room) => {
      const roomIdStr = room._id.toString();

      // Check bookings
      if (bookedRoomIds.has(roomIdStr)) return false;

      // Check holds
      if (heldRoomIds.has(roomIdStr)) return false;

      // Check maintenance blocks
      if (room.maintenanceInfo && room.maintenanceInfo.length > 0) {
        const inMaintenance = room.maintenanceInfo.some((block) =>
          this.isDateOverlap(block.startDate, block.endDate, checkIn, checkOut)
        );
        if (inMaintenance) return false;
      }

      return true;
    });

    // 6. Group available rooms by roomTypeId and evaluate capacity & pricing
    const roomsByType = new Map<string, typeof availableRooms>();
    for (const room of availableRooms) {
      const typeIdStr = room.roomTypeId.toString();
      if (!roomsByType.has(typeIdStr)) {
        roomsByType.set(typeIdStr, []);
      }
      roomsByType.get(typeIdStr)!.push(room);
    }

    // 7. Calculate pricing for each room type
    const eligibleRoomTypes: AvailableRoomOption[] = [];

    for (const [typeIdStr, typeRooms] of roomsByType.entries()) {
      if (typeRooms.length < rooms) {
        // Not enough rooms to satisfy requested room count
        continue;
      }

      const roomType = await RoomType.findById(typeIdStr).session(session);
      if (!roomType || !roomType.isActive) continue;

      // Capacity check
      if (roomType.maxOccupancy.total < guests) {
        continue;
      }

      // Find active RatePlan
      const ratePlan = await RatePlan.findOne({
        roomTypeId: roomType._id,
        isActive: true,
      }).session(session);

      if (!ratePlan) {
        continue;
      }

      try {
        const pricing = PricingService.calculatePricing(
          ratePlan,
          roomType,
          checkIn,
          checkOut,
          guests,
          discountCode
        );

        eligibleRoomTypes.push({
          roomType: {
            id: roomType._id.toString(),
            name: roomType.name,
            code: roomType.code,
            description: roomType.description,
            tagline: roomType.tagline,
            category: roomType.category,
            bedConfiguration: roomType.bedConfiguration,
            maxOccupancy: roomType.maxOccupancy,
            amenities: roomType.amenities,
            features: roomType.features,
            images: roomType.images,
            sizeSqFt: roomType.sizeSqFt,
          },
          availableRoomsCount: typeRooms.length,
          availableRoomIds: typeRooms.map((r) => r._id.toString()),
          pricing: {
            ...pricing,
            formattedTotalAmount: this.formatINR(pricing.totalAmount),
          },
        });
      } catch (err: any) {
        console.warn(`[Availability] Pricing calculation failed for roomType ${roomType.code}:`, err.message);
      }
    }

    return {
      searchCriteria: { checkIn, checkOut, guests, rooms, roomTypeId },
      available: eligibleRoomTypes.length > 0,
      totalAvailableRooms: availableRooms.length,
      roomTypes: eligibleRoomTypes,
    };
  }
}
