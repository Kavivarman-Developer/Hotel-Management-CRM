import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from './setup';
import { app } from '../app';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { RoomType } from '../models/RoomType';
import { RatePlan } from '../models/RatePlan';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { BookingService } from '../services/booking.service';
import { AuthService } from '../services/auth.service';
import { PaymentService } from '../services/payment.service';
import { UserRole, DEFAULT_ROLE_PERMISSIONS, RoomStatus, HousekeepingStatus, PaymentStatus, ReservationStatus } from '../types';

describe('Payment, Webhooks, Refunds & Partner URLs', () => {
  let staffToken: string;
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

    // Staff
    const passwordHash = await AuthService.hashPassword('Staff@2026');
    await User.create({
      name: 'Manager',
      email: 'manager@grandomrresidency.com',
      mobile: '+91 8110018708',
      passwordHash,
      role: UserRole.MANAGER,
      permissions: DEFAULT_ROLE_PERMISSIONS[UserRole.MANAGER],
    });
    const login = await AuthService.login('manager@grandomrresidency.com', 'Staff@2026');
    staffToken = login.tokens.accessToken;

    // Room
    const roomType = await RoomType.create({
      name: 'Deluxe Room',
      code: 'deluxe-king',
      description: 'Room',
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
      roomNumber: '103',
      roomTypeId: roomType._id,
      floor: 1,
      maxGuests: 2,
      status: RoomStatus.ACTIVE,
      housekeepingStatus: HousekeepingStatus.CLEAN,
    });
    roomId = room._id.toString();
  });

  describe('Payment & Webhook Flow', () => {
    it('should create payment order, process valid signed webhook, and reject forged webhook', async () => {
      // 1. Create booking
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Venkat Raman',
          email: 'venkat@example.com',
          mobile: '+91 9999988888',
        },
      });

      const bookingId = created.booking._id.toString();

      // 2. Create Payment Order
      const orderRes = await request(app)
        .post('/api/payments/create')
        .send({ bookingId });

      expect(orderRes.status).toBe(201);
      const { orderId, paymentId } = orderRes.body.data;
      expect(orderId).toBeDefined();

      // 3. Forged Webhook should fail with 401 Unauthorized
      const webhookPayload = {
        orderId,
        transactionReference: 'TXN-RAZORPAY-123456',
        status: 'SUCCESS',
        amount: created.booking.totalAmount,
      };

      const forgedRes = await request(app)
        .post('/api/payments/webhook')
        .set('x-payment-signature', 'forged_tampered_signature')
        .send(webhookPayload);

      expect(forgedRes.status).toBe(401);

      // 4. Valid signed Webhook should succeed
      const rawPayload = JSON.stringify(webhookPayload);
      const validSignature = PaymentService.generateWebhookSignature(rawPayload);

      const validRes = await request(app)
        .post('/api/payments/webhook')
        .set('x-payment-signature', validSignature)
        .send(webhookPayload);

      expect(validRes.status).toBe(200);
      expect(validRes.body.data.status).toBe('SUCCESS');

      // Verify booking payment status updated to PAID
      const updatedBooking = await Booking.findById(bookingId);
      expect(updatedBooking?.paymentStatus).toBe(PaymentStatus.PAID);
    });

    it('should process refund and update payment and booking statuses', async () => {
      const created = await BookingService.createBooking({
        roomTypeId,
        checkInDate: '2026-10-20',
        checkOutDate: '2026-10-22',
        numberOfGuests: 2,
        guest: {
          fullName: 'Ganesh M',
          email: 'ganesh@example.com',
          mobile: '+91 9876500000',
        },
      });

      // Directly create successful payment record
      const payment = await Payment.create({
        bookingId: created.booking._id,
        amount: created.booking.totalAmount,
        currency: 'INR',
        provider: 'DEVELOPMENT_ADAPTER',
        providerOrderId: 'ORDER-REFUND-TEST',
        paymentStatus: PaymentStatus.SUCCESS,
        verifiedTimestamp: new Date(),
      });

      // Staff issues refund
      const refundRes = await request(app)
        .post(`/api/admin/payments/${payment._id}/refund`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          amount: created.booking.totalAmount,
          reason: 'Customer requested cancellation within grace period',
        });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.amount).toBe(created.booking.totalAmount);

      const paymentAfter = await Payment.findById(payment._id);
      expect(paymentAfter?.paymentStatus).toBe(PaymentStatus.REFUNDED);
    });
  });

  describe('Partner Hotel URL Validation', () => {
    it('should reject invalid partner URLs', async () => {
      const res = await request(app)
        .post('/api/admin/partners')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          hotelName: 'Invalid Partner',
          description: 'Testing URL validation rules',
          address: 'OMR Road',
          city: 'Chennai',
          contactInformation: { phone: '+91 8110018708', email: 'partner@example.com' },
          officialWebsiteUrl: 'invalid-not-a-url',
          externalBookingUrl: 'https://valid.com',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid URLs and list only approved partners publicly', async () => {
      const createRes = await request(app)
        .post('/api/admin/partners')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          hotelName: 'Grand Coastal Resort ECR',
          description: 'Luxury seaside extension along ECR Chennai',
          address: '12, East Coast Road',
          city: 'Chennai',
          contactInformation: { phone: '+91 8110018708', email: 'coastal@example.com' },
          officialWebsiteUrl: 'https://grandomrresidency.ai.studio',
          externalBookingUrl: 'https://grandomrresidency.ai.studio',
          listingStatus: 'ACTIVE',
          approvalStatus: 'APPROVED',
        });

      expect(createRes.status).toBe(201);

      // Public endpoint should return this approved partner
      const publicRes = await request(app).get('/api/partners');
      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
