import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './setup';
import { AvailabilityService } from '../services/availability.service';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { RoomHold } from '../models/RoomHold';
import { Guest } from '../models/Guest';
import { ReservationStatus, HoldStatus, RoomStatus, HousekeepingStatus } from '../types';

describe('AvailabilityService', () => {
  let roomTypeId: string;
  let roomId: string;
  let guestId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Create room type
    const roomType = await RoomType.create({
      name: 'Deluxe King Room',
      code: 'deluxe-king',
      description: 'Deluxe King room with ambient lighting',
      category: 'deluxe',
      maxOccupancy: { adults: 2, children: 1, total: 3 },
      bedConfiguration: 'King Bed',
      amenities: ['AC', 'WiFi'],
      baseRate: 220000,
      defaultNightlyRate: 179900,
      isActive: true,
    });
    roomTypeId = roomType._id.toString();

    // Create rate plan
    await RatePlan.create({
      roomTypeId: roomType._id,
      currency: 'INR',
      defaultRate: 179900,
      isActive: true,
      taxConfiguration: { gstPercentage: 12, name: 'GST' },
    });

    // Create physical room 101
    const room = await Room.create({
      roomNumber: '101',
      roomTypeId: roomType._id,
      floor: 1,
      maxGuests: 3,
      status: RoomStatus.ACTIVE,
      housekeepingStatus: HousekeepingStatus.CLEAN,
    });
    roomId = room._id.toString();

    // Create guest
    const guest = await Guest.create({
      fullName: 'Anita Sharma',
      email: 'anita@example.com',
      mobile: '+91 9840112233',
    });
    guestId = guest._id.toString();
  });

  describe('isDateOverlap logic', () => {
    it('should accurately detect overlapping intervals with exclusive checkout', () => {
      // Overlap rule: startA < endB && endA > startB
      // Stay 1: 2026-10-20 to 2026-10-22
      // Stay 2: 2026-10-21 to 2026-10-23 -> Overlaps
      expect(AvailabilityService.isDateOverlap('2026-10-20', '2026-10-22', '2026-10-21', '2026-10-23')).toBe(true);

      // Adjacent stays: Stay 1 checkout = 2026-10-22, Stay 2 checkin = 2026-10-22 -> DOES NOT OVERLAP
      expect(AvailabilityService.isDateOverlap('2026-10-20', '2026-10-22', '2026-10-22', '2026-10-24')).toBe(false);

      // Distinct non-overlapping stays
      expect(AvailabilityService.isDateOverlap('2026-10-20', '2026-10-22', '2026-10-25', '2026-10-28')).toBe(false);
    });
  });

  describe('checkAvailability', () => {
    it('should find room available when no conflicting bookings exist', async () => {
      const result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        guests: 2,
        rooms: 1,
      });

      expect(result.available).toBe(true);
      expect(result.totalAvailableRooms).toBe(1);
      expect(result.roomTypes.length).toBe(1);
      expect(result.roomTypes[0].roomType.code).toBe('deluxe-king');
    });

    it('should block availability when confirmed booking overlaps', async () => {
      // Create confirmed booking for 2026-10-20 to 2026-10-22
      await Booking.create({
        bookingReference: 'GOR-20261020-TEST1',
        guestId,
        assignedRoomId: roomId,
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        reservationStatus: ReservationStatus.CONFIRMED,
        nightlyPriceBreakdown: [],
        subtotal: 359800,
        taxes: 43176,
        totalAmount: 402976,
      });

      // Search for overlapping dates: 2026-10-21 to 2026-10-23
      const result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-21',
        checkOut: '2026-10-23',
        guests: 2,
        rooms: 1,
      });

      expect(result.available).toBe(false);
      expect(result.totalAvailableRooms).toBe(0);
    });

    it('should NOT block availability for adjacent booking (exclusive checkout date)', async () => {
      // Confirmed booking checking OUT on 2026-10-22
      await Booking.create({
        bookingReference: 'GOR-20261020-ADJ1',
        guestId,
        assignedRoomId: roomId,
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        reservationStatus: ReservationStatus.CONFIRMED,
        nightlyPriceBreakdown: [],
        subtotal: 359800,
        taxes: 43176,
        totalAmount: 402976,
      });

      // Search checking IN on 2026-10-22
      const result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-22',
        checkOut: '2026-10-24',
        guests: 2,
        rooms: 1,
      });

      expect(result.available).toBe(true);
      expect(result.totalAvailableRooms).toBe(1);
    });

    it('should NOT block availability when booking is CANCELLED', async () => {
      // Cancelled booking for 2026-10-20 to 2026-10-22
      await Booking.create({
        bookingReference: 'GOR-20261020-CANC1',
        guestId,
        assignedRoomId: roomId,
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        reservationStatus: ReservationStatus.CANCELLED,
        nightlyPriceBreakdown: [],
        subtotal: 359800,
        taxes: 43176,
        totalAmount: 402976,
      });

      const result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        guests: 2,
        rooms: 1,
      });

      expect(result.available).toBe(true);
      expect(result.totalAvailableRooms).toBe(1);
    });

    it('should block availability for active unexpired hold, but NOT for expired hold', async () => {
      // 1. Expired hold (expires in past)
      await RoomHold.create({
        roomId,
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        secureTokenHash: 'dummy_hash',
        expirationTimestamp: new Date(Date.now() - 60000), // 1 min ago
        status: HoldStatus.ACTIVE,
        guestsCount: 2,
        calculatedPrice: 359800,
      });

      // Expired hold must stop blocking inventory even if not yet purged
      let result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        guests: 2,
        rooms: 1,
      });
      expect(result.available).toBe(true);

      // 2. Active unexpired hold (expires in future)
      await RoomHold.create({
        roomId,
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        secureTokenHash: 'dummy_hash_2',
        expirationTimestamp: new Date(Date.now() + 15 * 60 * 1000), // 15 mins in future
        status: HoldStatus.ACTIVE,
        guestsCount: 2,
        calculatedPrice: 359800,
      });

      result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        guests: 2,
        rooms: 1,
      });
      expect(result.available).toBe(false);
    });

    it('should block availability when room is under maintenance', async () => {
      // Schedule maintenance on Room 101
      await Room.findByIdAndUpdate(roomId, {
        $push: {
          maintenanceInfo: {
            startDate: '2026-10-19',
            endDate: '2026-10-21',
            reason: 'AC filter replacement & deep cleaning',
          },
        },
      });

      const result = await AvailabilityService.checkAvailability({
        checkIn: '2026-10-20',
        checkOut: '2026-10-22',
        guests: 2,
        rooms: 1,
      });

      expect(result.available).toBe(false);
    });
  });
});
