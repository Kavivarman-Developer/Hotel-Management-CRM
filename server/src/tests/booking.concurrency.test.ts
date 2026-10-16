import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './setup';
import { app } from '../app';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { BookingService } from '../services/booking.service';
import { RoomStatus, HousekeepingStatus } from '../types';

describe('Booking API & Concurrency Control', () => {
  let roomTypeId: string;
  let roomId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    const roomType = await RoomType.create({
      name: 'Executive Business Suite',
      code: 'executive-suite',
      description: 'Corporate suite along OMR',
      category: 'suite',
      maxOccupancy: { adults: 2, children: 2, total: 4 },
      bedConfiguration: 'King Bed',
      baseRate: 290000,
      defaultNightlyRate: 239900,
      isActive: true,
    });
    roomTypeId = roomType._id.toString();

    await RatePlan.create({
      roomTypeId: roomType._id,
      currency: 'INR',
      defaultRate: 239900,
      isActive: true,
      taxConfiguration: { gstPercentage: 12, name: 'GST' },
    });

    // Create ONLY ONE physical room so concurrent attempts must fight for this single inventory
    const room = await Room.create({
      roomNumber: '201',
      roomTypeId: roomType._id,
      floor: 2,
      maxGuests: 4,
      status: RoomStatus.ACTIVE,
      housekeepingStatus: HousekeepingStatus.CLEAN,
    });
    roomId = room._id.toString();
  });

  describe('Single Inventory Collision / Concurrency Protection', () => {
    it('CRITICAL: simultaneous booking requests for the same room must result in exactly 1 confirmation and 1 rejection', async () => {
      // Initiate two simultaneous booking requests for the identical dates and room
      const guestA = {
        fullName: 'Karthik Raja',
        email: 'karthik@example.com',
        mobile: '+91 9840111111',
      };

      const guestB = {
        fullName: 'Priya Sundaram',
        email: 'priya@example.com',
        mobile: '+91 9840222222',
      };

      const bookingPromiseA = BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: guestA,
      });

      const bookingPromiseB = BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: guestB,
      });

      const results = await Promise.allSettled([bookingPromiseA, bookingPromiseB]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly one must succeed, and the other must be rejected
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      // Verify in database: exactly ONE confirmed booking exists
      const totalBookings = await Booking.countDocuments({
        assignedRoomId: roomId,
        reservationStatus: 'CONFIRMED',
      });
      expect(totalBookings).toBe(1);
    });

    it('should prevent overlapping holds from conflicting on the same physical room', async () => {
      const holdPromise1 = BookingService.createHold({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
      });

      const holdPromise2 = BookingService.createHold({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
      });

      const results = await Promise.allSettled([holdPromise1, holdPromise2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
    });
  });

  describe('Booking Snapshot & Guest Data Security', () => {
    it('should freeze historical pricing snapshot so later RatePlan changes do not alter confirmed reservation', async () => {
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Arun Natarajan',
          email: 'arun@example.com',
          mobile: '+91 9888877777',
        },
      });

      const originalTotal = created.booking.totalAmount;

      // Update rate plan to a much higher price
      await RatePlan.findOneAndUpdate(
        { roomTypeId },
        { $set: { defaultRate: 500000 } } // ₹5,000
      );

      // Fetch booking from database
      const fetched = await Booking.findById(created.booking._id);
      expect(fetched?.totalAmount).toBe(originalTotal);
    });

    it('should reject unauthorized lookup of booking without matching email or mobile', async () => {
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Deepa V',
          email: 'deepa@example.com',
          mobile: '+91 9123456780',
        },
      });

      const ref = created.booking.bookingReference;

      // Missing verification credentials -> 401
      const resNoCreds = await request(app).get(`/api/bookings/${ref}`);
      expect(resNoCreds.status).toBe(401);

      // Wrong email -> 401
      const resWrongCreds = await request(app).get(`/api/bookings/${ref}?email=intruder@example.com`);
      expect(resWrongCreds.status).toBe(401);

      // Matching email -> 200
      const resCorrect = await request(app).get(`/api/bookings/${ref}?email=deepa@example.com`);
      expect(resCorrect.status).toBe(200);
      expect(resCorrect.body.data.bookingReference).toBe(ref);
    });

    it('should support idempotent booking submissions using Idempotency-Key header', async () => {
      const idempotencyKey = 'unique-key-123456';
      const payload = {
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Vikram Seth',
          email: 'vikram@example.com',
          mobile: '+91 9777766666',
        },
      };

      const res1 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(201);
      const ref1 = res1.body.data.bookingReference;

      // Send identical request with same idempotency key
      const res2 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(201);
      expect(res2.body.data.bookingReference).toBe(ref1);

      // Database should only have 1 booking record
      const count = await Booking.countDocuments();
      expect(count).toBe(1);
    });
  });
});
