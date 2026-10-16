import crypto from 'crypto';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { GuestRegistration, IGuestRegistration } from '../models/GuestRegistration';
import { Guest } from '../models/Guest';
import { RegistrationStatus, ReservationStatus } from '../types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { logAudit } from '../utils/audit';
import { HotelPolicyService } from './policy.service';

export interface SubmitRegistrationInput {
  primaryGuest: {
    fullName: string;
    phone: string;
    email: string;
    nationality: string;
    idProofType: string;
    idProofNumber: string; // will be masked before storage
  };
  additionalGuests?: Array<{
    name: string;
    age: number;
    relation: string;
  }>;
  vehicleNumber?: string;
  estimatedArrivalTime?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  specialRequests?: string;
  consentGranted: boolean;
}

export interface SubmitWalkInRegistrationInput {
  primaryGuest: {
    fullName: string;
    phone: string;
    email: string;
    nationality?: string;
    idProofType: string;
    idProofNumber: string;
  };
  stayRequirements?: {
    stayType?: 'DAILY' | 'HOURLY';
    durationHours?: number;
    numberOfRooms?: number;
    malesCount?: number;
    femalesCount?: number;
  };
  additionalGuests?: Array<{
    name: string;
    age: number;
    relation: string;
  }>;
  vehicleNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  specialRequests?: string;
  consentGranted: boolean;
}

export class QrService {
  /**
   * Masks sensitive ID proof numbers (e.g. Aadhaar, Passport)
   */
  public static maskIdNumber(idNumber: string): string {
    const clean = idNumber.replace(/\s+/g, '');
    if (clean.length <= 4) return '****';
    const visibleSuffix = clean.slice(-4);
    const maskedPrefix = '*'.repeat(clean.length - 4);
    return `${maskedPrefix}${visibleSuffix}`;
  }

  /**
   * Hashes token with SHA-256
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Validates a QR / digital check-in token without exposing full PII.
   */
  public static async validateToken(token: string): Promise<any> {
    if (!token || token.length < 16) {
      throw new BadRequestError('Invalid QR token format');
    }

    const hashedToken = this.hashToken(token);
    const booking = await Booking.findOne({ qrTokenHash: hashedToken })
      .populate('roomTypeId', 'name code category images')
      .populate('assignedRoomId', 'roomNumber floor');

    if (!booking) {
      throw new NotFoundError('Invalid or unrecognised QR check-in token');
    }

    if (booking.reservationStatus === ReservationStatus.CANCELLED) {
      throw new BadRequestError('This reservation has been cancelled');
    }

    if (booking.qrTokenExpiresAt && booking.qrTokenExpiresAt < new Date()) {
      throw new UnauthorizedError('This QR check-in link has expired', 'TOKEN_EXPIRED');
    }

    // Find registration record
    let registration = await GuestRegistration.findOne({ bookingId: booking._id });
    if (!registration) {
      registration = await GuestRegistration.create({
        bookingId: booking._id,
        guestId: booking.guestId,
        registrationDetails: {
          primaryGuest: {
            fullName: '',
            phone: '',
            email: '',
            nationality: 'Indian',
            idProofType: 'Aadhaar',
            idProofNumberMasked: '',
          },
        },
        verificationStatus: RegistrationStatus.PENDING,
      });
    }

    const roomType = booking.roomTypeId as any;

    return {
      valid: true,
      bookingReference: booking.bookingReference,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      numberOfGuests: booking.numberOfGuests,
      stayStatus: booking.stayStatus,
      paymentStatus: booking.paymentStatus,
      verificationStatus: registration.verificationStatus,
      roomType: {
        name: roomType?.name || 'Deluxe Room',
        category: roomType?.category || 'deluxe',
        images: roomType?.images || [],
      },
    };
  }

  /**
   * Submit registration information through QR link.
   * Does NOT check in the guest!
   */
  public static async submitRegistration(
    token: string,
    input: SubmitRegistrationInput
  ): Promise<IGuestRegistration> {
    const hashedToken = this.hashToken(token);
    const booking = await Booking.findOne({ qrTokenHash: hashedToken });
    if (!booking) {
      throw new NotFoundError('Invalid check-in token');
    }

    if (booking.qrTokenExpiresAt && booking.qrTokenExpiresAt < new Date()) {
      throw new UnauthorizedError('This check-in link has expired');
    }

    if (!input.consentGranted) {
      throw new BadRequestError('Consent for terms and digital registration is required');
    }

    const maskedId = this.maskIdNumber(input.primaryGuest.idProofNumber);

    let registration = await GuestRegistration.findOne({ bookingId: booking._id });
    if (!registration) {
      registration = new GuestRegistration({
        bookingId: booking._id,
        guestId: booking.guestId,
      });
    }

    registration.registrationDetails = {
      primaryGuest: {
        fullName: input.primaryGuest.fullName.trim(),
        phone: input.primaryGuest.phone.trim(),
        email: input.primaryGuest.email.trim().toLowerCase(),
        nationality: input.primaryGuest.nationality || 'Indian',
        idProofType: input.primaryGuest.idProofType,
        idProofNumberMasked: maskedId,
      },
      additionalGuests: input.additionalGuests,
      vehicleNumber: input.vehicleNumber,
      estimatedArrivalTime: input.estimatedArrivalTime,
      emergencyContact: input.emergencyContact,
      specialRequests: input.specialRequests,
    };

    registration.verificationStatus = RegistrationStatus.SUBMITTED;
    registration.submittedAt = new Date();
    registration.consentRecords.push({
      consentType: 'SELF_CHECKIN_SUBMISSION',
      granted: true,
      timestamp: new Date(),
    });

    await registration.save();

    // Also update guest model with masked ID proof
    await Guest.findByIdAndUpdate(booking.guestId, {
      idProofType: input.primaryGuest.idProofType,
      idProofNumberMasked: maskedId,
    });

    await logAudit({
      action: 'GUEST_REGISTRATION_SUBMITTED',
      entityType: 'GuestRegistration',
      entityId: registration._id.toString(),
      changes: {
        after: {
          verificationStatus: RegistrationStatus.SUBMITTED,
          bookingReference: booking.bookingReference,
        },
      },
    });

    return registration;
  }

  /**
   * Staff approval of registration.
   */
  public static async approveRegistration(
    registrationId: string,
    staffUserId: string,
    notes?: string
  ): Promise<IGuestRegistration> {
    const registration = await GuestRegistration.findById(registrationId);
    if (!registration) {
      throw new NotFoundError('Registration record not found');
    }

    registration.verificationStatus = RegistrationStatus.VERIFIED;
    registration.verifiedAt = new Date();
    registration.reviewedBy = new mongoose.Types.ObjectId(staffUserId);
    if (notes) registration.reviewNotes = notes;

    await registration.save();

    await logAudit({
      action: 'GUEST_REGISTRATION_APPROVED',
      entityType: 'GuestRegistration',
      entityId: registration._id.toString(),
      userId: staffUserId,
      changes: {
        after: { verificationStatus: RegistrationStatus.VERIFIED, notes },
      },
    });

    return registration;
  }

  /**
   * Staff rejection of registration.
   */
  public static async rejectRegistration(
    registrationId: string,
    staffUserId: string,
    reason: string
  ): Promise<IGuestRegistration> {
    const registration = await GuestRegistration.findById(registrationId);
    if (!registration) {
      throw new NotFoundError('Registration record not found');
    }

    registration.verificationStatus = RegistrationStatus.REJECTED;
    registration.reviewedBy = new mongoose.Types.ObjectId(staffUserId);
    registration.reviewNotes = reason;

    await registration.save();

    await logAudit({
      action: 'GUEST_REGISTRATION_REJECTED',
      entityType: 'GuestRegistration',
      entityId: registration._id.toString(),
      userId: staffUserId,
      changes: {
        after: { verificationStatus: RegistrationStatus.REJECTED, reason },
      },
    });

    return registration;
  }

  /**
   * Submit walk-in digital registration at the hotel front desk via counter QR code
   */
  public static async submitWalkInRegistration(input: SubmitWalkInRegistrationInput): Promise<any> {
    if (!input.consentGranted) {
      throw new BadRequestError('Consent for hotel terms and identity registration is required');
    }

    // Check Hotel Short-Stay Policy
    if (input.stayRequirements?.stayType === 'HOURLY') {
      const policyCheck = HotelPolicyService.validateBookingPolicy({
        bookingType: 'HOURLY',
        durationHours: input.stayRequirements.durationHours || 2,
        numberOfRooms: input.stayRequirements.numberOfRooms || 1,
        malesCount: input.stayRequirements.malesCount ?? 1,
        femalesCount: input.stayRequirements.femalesCount ?? 0,
      });

      if (!policyCheck.isAllowed) {
        throw new BadRequestError(policyCheck.message);
      }
    }

    const maskedId = this.maskIdNumber(input.primaryGuest.idProofNumber);
    const email = input.primaryGuest.email.trim().toLowerCase();
    const phone = input.primaryGuest.phone.trim();

    // Upsert guest record
    let guest = await Guest.findOne({
      $or: [{ email }, { mobile: phone }],
    });

    if (!guest) {
      guest = await Guest.create({
        fullName: input.primaryGuest.fullName.trim(),
        email,
        mobile: phone,
        nationality: input.primaryGuest.nationality || 'Indian',
        idProofType: input.primaryGuest.idProofType,
        idProofNumberMasked: maskedId,
        consentRecords: [
          {
            consentType: 'COUNTER_WALKIN_REGISTRATION',
            granted: true,
            timestamp: new Date(),
          },
        ],
      });
    } else {
      guest.idProofType = input.primaryGuest.idProofType;
      guest.idProofNumberMasked = maskedId;
      await guest.save();
    }

    const walkInRef = `WALKIN-${Date.now().toString().slice(-6)}`;

    const registration = await GuestRegistration.create({
      guestId: guest._id,
      walkInReference: walkInRef,
      registrationDetails: {
        primaryGuest: {
          fullName: input.primaryGuest.fullName.trim(),
          phone,
          email,
          nationality: input.primaryGuest.nationality || 'Indian',
          idProofType: input.primaryGuest.idProofType,
          idProofNumberMasked: maskedId,
        },
        additionalGuests: input.additionalGuests,
        vehicleNumber: input.vehicleNumber,
        emergencyContact: input.emergencyContact,
        specialRequests: input.specialRequests,
      },
      verificationStatus: RegistrationStatus.PENDING,
      reviewNotes: `Front Counter QR Self-Registration (${input.stayRequirements?.stayType || 'DAILY'} stay, ${
        input.stayRequirements?.stayType === 'HOURLY'
          ? `${input.stayRequirements?.durationHours || 2} Hours`
          : 'Standard Stay'
      })`,
      submittedAt: new Date(),
      consentRecords: [
        {
          consentType: 'WALKIN_EXPRESS_CHECKIN',
          granted: true,
          timestamp: new Date(),
        },
      ],
    });

    await logAudit({
      action: 'GUEST_REGISTRATION_SUBMITTED',
      entityType: 'GuestRegistration',
      entityId: registration._id.toString(),
      changes: {
        after: {
          verificationStatus: RegistrationStatus.PENDING,
          walkInReference: walkInRef,
          guestName: guest.fullName,
        },
      },
    });

    return {
      registrationId: registration._id,
      walkInReference: walkInRef,
      verificationStatus: registration.verificationStatus,
      submittedAt: registration.submittedAt,
      guestName: guest.fullName,
    };
  }

  /**
   * Staff reissue / renewal of QR token.
   */
  public static async reissueQrToken(bookingId: string, staffUserId: string): Promise<{ rawToken: string; expiresAt: Date }> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(`${booking.checkOutDate}T23:59:59Z`);

    booking.qrTokenHash = hashedToken;
    booking.qrTokenExpiresAt = expiresAt;
    await booking.save();

    await logAudit({
      action: 'QR_TOKEN_REISSUED',
      entityType: 'Booking',
      entityId: booking._id.toString(),
      userId: staffUserId,
    });

    return { rawToken, expiresAt };
  }
}
