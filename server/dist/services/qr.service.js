"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const Booking_1 = require("../models/Booking");
const GuestRegistration_1 = require("../models/GuestRegistration");
const Guest_1 = require("../models/Guest");
const types_1 = require("../types");
const errors_1 = require("../utils/errors");
const audit_1 = require("../utils/audit");
const policy_service_1 = require("./policy.service");
class QrService {
    /**
     * Masks sensitive ID proof numbers (e.g. Aadhaar, Passport)
     */
    static maskIdNumber(idNumber) {
        const clean = idNumber.replace(/\s+/g, '');
        if (clean.length <= 4)
            return '****';
        const visibleSuffix = clean.slice(-4);
        const maskedPrefix = '*'.repeat(clean.length - 4);
        return `${maskedPrefix}${visibleSuffix}`;
    }
    /**
     * Hashes token with SHA-256
     */
    static hashToken(token) {
        return crypto_1.default.createHash('sha256').update(token.trim()).digest('hex');
    }
    /**
     * Validates a QR / digital check-in token without exposing full PII.
     */
    static async validateToken(token) {
        if (!token || token.length < 16) {
            throw new errors_1.BadRequestError('Invalid QR token format');
        }
        const hashedToken = this.hashToken(token);
        const booking = await Booking_1.Booking.findOne({ qrTokenHash: hashedToken })
            .populate('roomTypeId', 'name code category images')
            .populate('assignedRoomId', 'roomNumber floor');
        if (!booking) {
            throw new errors_1.NotFoundError('Invalid or unrecognised QR check-in token');
        }
        if (booking.reservationStatus === types_1.ReservationStatus.CANCELLED) {
            throw new errors_1.BadRequestError('This reservation has been cancelled');
        }
        if (booking.qrTokenExpiresAt && booking.qrTokenExpiresAt < new Date()) {
            throw new errors_1.UnauthorizedError('This QR check-in link has expired', 'TOKEN_EXPIRED');
        }
        // Find registration record
        let registration = await GuestRegistration_1.GuestRegistration.findOne({ bookingId: booking._id });
        if (!registration) {
            registration = await GuestRegistration_1.GuestRegistration.create({
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
                verificationStatus: types_1.RegistrationStatus.PENDING,
            });
        }
        const roomType = booking.roomTypeId;
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
    static async submitRegistration(token, input) {
        const hashedToken = this.hashToken(token);
        const booking = await Booking_1.Booking.findOne({ qrTokenHash: hashedToken });
        if (!booking) {
            throw new errors_1.NotFoundError('Invalid check-in token');
        }
        if (booking.qrTokenExpiresAt && booking.qrTokenExpiresAt < new Date()) {
            throw new errors_1.UnauthorizedError('This check-in link has expired');
        }
        if (!input.consentGranted) {
            throw new errors_1.BadRequestError('Consent for terms and digital registration is required');
        }
        const maskedId = this.maskIdNumber(input.primaryGuest.idProofNumber);
        let registration = await GuestRegistration_1.GuestRegistration.findOne({ bookingId: booking._id });
        if (!registration) {
            registration = new GuestRegistration_1.GuestRegistration({
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
        registration.verificationStatus = types_1.RegistrationStatus.SUBMITTED;
        registration.submittedAt = new Date();
        registration.consentRecords.push({
            consentType: 'SELF_CHECKIN_SUBMISSION',
            granted: true,
            timestamp: new Date(),
        });
        await registration.save();
        // Also update guest model with masked ID proof
        await Guest_1.Guest.findByIdAndUpdate(booking.guestId, {
            idProofType: input.primaryGuest.idProofType,
            idProofNumberMasked: maskedId,
        });
        await (0, audit_1.logAudit)({
            action: 'GUEST_REGISTRATION_SUBMITTED',
            entityType: 'GuestRegistration',
            entityId: registration._id.toString(),
            changes: {
                after: {
                    verificationStatus: types_1.RegistrationStatus.SUBMITTED,
                    bookingReference: booking.bookingReference,
                },
            },
        });
        return registration;
    }
    /**
     * Staff approval of registration.
     */
    static async approveRegistration(registrationId, staffUserId, notes) {
        const registration = await GuestRegistration_1.GuestRegistration.findById(registrationId);
        if (!registration) {
            throw new errors_1.NotFoundError('Registration record not found');
        }
        registration.verificationStatus = types_1.RegistrationStatus.VERIFIED;
        registration.verifiedAt = new Date();
        registration.reviewedBy = new mongoose_1.default.Types.ObjectId(staffUserId);
        if (notes)
            registration.reviewNotes = notes;
        await registration.save();
        await (0, audit_1.logAudit)({
            action: 'GUEST_REGISTRATION_APPROVED',
            entityType: 'GuestRegistration',
            entityId: registration._id.toString(),
            userId: staffUserId,
            changes: {
                after: { verificationStatus: types_1.RegistrationStatus.VERIFIED, notes },
            },
        });
        return registration;
    }
    /**
     * Staff rejection of registration.
     */
    static async rejectRegistration(registrationId, staffUserId, reason) {
        const registration = await GuestRegistration_1.GuestRegistration.findById(registrationId);
        if (!registration) {
            throw new errors_1.NotFoundError('Registration record not found');
        }
        registration.verificationStatus = types_1.RegistrationStatus.REJECTED;
        registration.reviewedBy = new mongoose_1.default.Types.ObjectId(staffUserId);
        registration.reviewNotes = reason;
        await registration.save();
        await (0, audit_1.logAudit)({
            action: 'GUEST_REGISTRATION_REJECTED',
            entityType: 'GuestRegistration',
            entityId: registration._id.toString(),
            userId: staffUserId,
            changes: {
                after: { verificationStatus: types_1.RegistrationStatus.REJECTED, reason },
            },
        });
        return registration;
    }
    /**
     * Submit walk-in digital registration at the hotel front desk via counter QR code
     */
    static async submitWalkInRegistration(input) {
        if (!input.consentGranted) {
            throw new errors_1.BadRequestError('Consent for hotel terms and identity registration is required');
        }
        // Check Hotel Short-Stay Policy
        if (input.stayRequirements?.stayType === 'HOURLY') {
            const policyCheck = policy_service_1.HotelPolicyService.validateBookingPolicy({
                bookingType: 'HOURLY',
                durationHours: input.stayRequirements.durationHours || 2,
                numberOfRooms: input.stayRequirements.numberOfRooms || 1,
                malesCount: input.stayRequirements.malesCount ?? 1,
                femalesCount: input.stayRequirements.femalesCount ?? 0,
            });
            if (!policyCheck.isAllowed) {
                throw new errors_1.BadRequestError(policyCheck.message);
            }
        }
        const maskedId = this.maskIdNumber(input.primaryGuest.idProofNumber);
        const email = input.primaryGuest.email.trim().toLowerCase();
        const phone = input.primaryGuest.phone.trim();
        // Upsert guest record
        let guest = await Guest_1.Guest.findOne({
            $or: [{ email }, { mobile: phone }],
        });
        if (!guest) {
            guest = await Guest_1.Guest.create({
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
        }
        else {
            guest.idProofType = input.primaryGuest.idProofType;
            guest.idProofNumberMasked = maskedId;
            await guest.save();
        }
        const walkInRef = `WALKIN-${Date.now().toString().slice(-6)}`;
        const registration = await GuestRegistration_1.GuestRegistration.create({
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
            verificationStatus: types_1.RegistrationStatus.PENDING,
            reviewNotes: `Front Counter QR Self-Registration (${input.stayRequirements?.stayType || 'DAILY'} stay, ${input.stayRequirements?.stayType === 'HOURLY'
                ? `${input.stayRequirements?.durationHours || 2} Hours`
                : 'Standard Stay'})`,
            submittedAt: new Date(),
            consentRecords: [
                {
                    consentType: 'WALKIN_EXPRESS_CHECKIN',
                    granted: true,
                    timestamp: new Date(),
                },
            ],
        });
        await (0, audit_1.logAudit)({
            action: 'GUEST_REGISTRATION_SUBMITTED',
            entityType: 'GuestRegistration',
            entityId: registration._id.toString(),
            changes: {
                after: {
                    verificationStatus: types_1.RegistrationStatus.PENDING,
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
    static async reissueQrToken(bookingId, staffUserId) {
        const booking = await Booking_1.Booking.findById(bookingId);
        if (!booking) {
            throw new errors_1.NotFoundError('Booking not found');
        }
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(`${booking.checkOutDate}T23:59:59Z`);
        booking.qrTokenHash = hashedToken;
        booking.qrTokenExpiresAt = expiresAt;
        await booking.save();
        await (0, audit_1.logAudit)({
            action: 'QR_TOKEN_REISSUED',
            entityType: 'Booking',
            entityId: booking._id.toString(),
            userId: staffUserId,
        });
        return { rawToken, expiresAt };
    }
}
exports.QrService = QrService;
//# sourceMappingURL=qr.service.js.map