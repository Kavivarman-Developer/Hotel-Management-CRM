import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './setup';
import { app } from '../app';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { GuestRegistration } from '../models/GuestRegistration';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { UserRole, DEFAULT_ROLE_PERMISSIONS, RoomStatus, HousekeepingStatus, StayStatus } from '../types';

describe('QR Digital Registration & Check-in / Check-out PMS Lifecycle', () => {
  let staffToken: string;
  let staffUserId: string;
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

    // Create staff user
    const passwordHash = await AuthService.hashPassword('Staff@2026');
    const staff = await User.create({
      name: 'Duty Manager',
      email: 'duty@grandomrresidency.com',
      mobile: '+91 8110018708',
      passwordHash,
      role: UserRole.MANAGER,
      permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER],
    });
    staffUserId = staff._id.toString();
    const login = await AuthService.login('duty@grandomrresidency.com', 'Staff@2026');
    staffToken = login.tokens.accessToken;

    // Room Type & Room
    const roomType = await RoomType.create({
      name: 'Deluxe King Room',
      code: 'deluxe-king',
      description: 'Deluxe room',
      category: 'deluxe',
      maxOccupancy: { adults: 2, children: 1, total: 3 },
      bedConfiguration: 'King Bed',
      baseRate: 220000,
      defaultNightlyRate: 179900,
    });
    roomTypeId = roomType._id.toString();

    await RatePlan.create({
      roomTypeId: roomType._id,
      currency: 'INR',
      defaultRate: 179900,
      isActive: true,
      taxConfiguration: { gstPercentage: 12, name: 'GST' },
    });

    const room = await Room.create({
      roomNumber: '102',
      roomTypeId: roomType._id,
      floor: 1,
      maxGuests: 3,
      status: RoomStatus.ACTIVE,
      housekeepingStatus: HousekeepingStatus.CLEAN,
    });
    roomId = room._id.toString();
  });

  describe('QR Digital Registration Lifecycle', () => {
    it('should validate QR token, submit guest registration, and verify by staff', async () => {
      // 1. Create a booking
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Siddharth Roy',
          email: 'siddharth@example.com',
          mobile: '+91 9888812345',
        },
      });

      const qrToken = created.qrToken;
      expect(qrToken).toBeDefined();

      // 2. Guest scans QR code: Validate token
      const valRes = await request(app).get(`/api/qr/${qrToken}/validate`);
      expect(valRes.status).toBe(200);
      expect(valRes.body.data.valid).toBe(true);
      expect(valRes.body.data.bookingReference).toBe(created.booking.bookingReference);

      // 3. Guest submits registration details
      const regRes = await request(app)
        .post('/api/guest-registrations')
        .set('x-qr-token', qrToken)
        .send({
          primaryGuest: {
            fullName: 'Siddharth Roy',
            phone: '+91 9888812345',
            email: 'siddharth@example.com',
            nationality: 'Indian',
            idProofType: 'Aadhaar',
            idProofNumber: '1234-5678-9012',
          },
          additionalGuests: [{ name: 'Sunita Roy', age: 30, relation: 'Spouse' }],
          vehicleNumber: 'TN 07 CB 1234',
          consentGranted: true,
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.data.verificationStatus).toBe('SUBMITTED');

      // Check that registration does NOT automatically check the guest in
      const checkBooking = await Booking.findById(created.booking._id);
      expect(checkBooking?.stayStatus).toBe(StayStatus.NOT_CHECKED_IN);

      // 4. Staff approves registration
      const regRecord = await GuestRegistration.findOne({ bookingId: created.booking._id });
      const approveRes = await request(app)
        .post(`/api/admin/registrations/${regRecord!._id}/approve`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ notes: 'Govt Aadhaar verified against original' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('Check-in and Check-out PMS Operations', () => {
    it('should complete check-in, reject duplicate check-in, complete check-out, and set room to DIRTY', async () => {
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Meenakshi Iyer',
          email: 'meenakshi@example.com',
          mobile: '+91 9840999888',
        },
      });

      const bookingId = created.booking._id.toString();

      // 1. Staff completes check-in
      const checkInRes = await request(app)
        .post(`/api/stays/${bookingId}/check-in`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ notes: 'Keycard #102 issued' });

      expect(checkInRes.status).toBe(200);
      expect(checkInRes.body.data.stay.stayStatus).toBe('ACTIVE');

      // Verify booking stayStatus updated
      const bookingAfterCheckIn = await Booking.findById(bookingId);
      expect(bookingAfterCheckIn?.stayStatus).toBe(StayStatus.CHECKED_IN);

      // 2. Duplicate check-in attempt should fail with 409 Conflict
      const dupCheckInRes = await request(app)
        .post(`/api/stays/${bookingId}/check-in`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(dupCheckInRes.status).toBe(409);

      // 3. Complete check-out with additional mini-bar charge
      const stayId = checkInRes.body.data.stay._id;
      const checkOutRes = await request(app)
        .post(`/api/stays/${stayId}/check-out`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          additionalCharges: [
            {
              description: 'Mini Bar Beverages',
              amount: 45000, // ₹450
              category: 'MINI_BAR',
            },
          ],
          finalPaidAmount: bookingAfterCheckIn!.totalAmount + 45000,
          notes: 'Guest checked out smoothly, bill settled via UPI',
        });

      expect(checkOutRes.status).toBe(200);
      expect(checkOutRes.body.data.stay.stayStatus).toBe('COMPLETED');
      expect(checkOutRes.body.data.stay.finalBillReference).toBeDefined();

      // Verify physical room housekeeping status changed to DIRTY
      const roomAfterCheckOut = await Room.findById(roomId);
      expect(roomAfterCheckOut?.housekeepingStatus).toBe(HousekeepingStatus.DIRTY);

      // 4. Duplicate checkout should fail with 409 Conflict
      const dupCheckOutRes = await request(app)
        .post(`/api/stays/${stayId}/check-out`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(dupCheckOutRes.status).toBe(409);
    });
  });
});
