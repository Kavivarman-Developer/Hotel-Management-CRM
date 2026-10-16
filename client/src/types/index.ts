export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'FRONT_DESK';

export const ALL_PERMISSIONS = [
  'dashboard.view',
  'rooms.view',
  'rooms.manage',
  'bookings.view',
  'bookings.create',
  'bookings.update',
  'bookings.cancel',
  'guests.view',
  'guest_details.view',
  'identity_documents.view',
  'qr_registrations.view',
  'qr_registrations.approve',
  'checkin.complete',
  'checkout.complete',
  'payments.view',
  'payments.refund',
  'rates.manage',
  'staff.manage',
  'permissions.manage',
  'partners.manage',
  'reports.view',
  'reports.export',
  'audit_logs.view',
  'settings.manage',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type ReservationStatus =
  | 'SEARCHED'
  | 'HELD'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export type StayStatus = 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT';

export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type HousekeepingStatus = 'CLEAN' | 'DIRTY' | 'INSPECTED' | 'OUT_OF_SERVICE';

export type HoldStatus = 'ACTIVE' | 'RELEASED' | 'CONVERTED_TO_BOOKING' | 'EXPIRED';

export type RegistrationStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export type BookingSource =
  | 'WEBSITE'
  | 'FRONT_DESK'
  | 'ADMIN'
  | 'WALK_IN'
  | 'PARTNER_OTA';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
}

export interface RoomType {
  _id: string;
  id?: string;
  name: string;
  code: string;
  category: 'deluxe' | 'suite' | 'cottage' | 'standard' | string;
  description: string;
  maxGuests?: number;
  maxOccupancy?: {
    adults: number;
    children: number;
    total: number;
  };
  bedConfiguration: string;
  amenities: string[];
  images: string[];
  defaultNightlyRate?: number; // in integer paise
  baseRate?: number;
  isActive?: boolean;
}

export interface Room {
  _id: string;
  id?: string;
  roomNumber: string;
  roomTypeId: RoomType | string;
  floor: number;
  maxGuests: number;
  amenities: string[];
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceBlock?: {
    isBlocked: boolean;
    reason?: string;
    blockedFrom?: string;
    blockedUntil?: string;
  };
  isOccupied?: boolean;
  currentBooking?: {
    bookingReference: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    stayType?: string;
  };
}

export interface NightlyRateBreakdown {
  date: string;
  baseRate: number; // paise
  effectiveRate: number; // paise
  discountedRate: number; // paise
  extraGuestCharge: number; // paise
  totalNightRate: number; // paise
}

export interface PricingCalculationResult {
  currency: string;
  nightCount: number;
  perNightBreakdown: NightlyRateBreakdown[];
  subtotal: number; // paise
  discount: number; // paise
  discountCode?: string;
  taxes: number; // paise
  taxRatePercentage: number;
  additionalCharges: number; // paise
  totalAmount: number; // paise
}

export interface GuestDetails {
  fullName: string;
  email: string;
  mobile: string;
  nationality?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

export interface Booking {
  _id: string;
  bookingReference: string;
  guestId: {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    nationality?: string;
  } | string;
  roomTypeId: RoomType | string;
  assignedRoomId?: Room | string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  reservationStatus: ReservationStatus;
  paymentStatus: PaymentStatus;
  stayStatus: StayStatus;
  totalAmount: number; // in integer paise
  currency: string;
  source: BookingSource;
  pricingSnapshot: PricingCalculationResult;
  specialRequests?: string;
  qrToken?: string;
  qrTokenExpiresAt?: string;
  cancellation?: {
    cancelledAt: string;
    reason: string;
    fee: number;
    refundAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AvailableRoomOption {
  roomType: RoomType;
  availableRoomsCount: number;
  pricing: PricingCalculationResult;
}

export interface HoldResult {
  holdId: string;
  holdToken: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  expiresAt: string;
  pricing: PricingCalculationResult;
}

export interface GuestRegistrationData {
  _id: string;
  bookingId: string | Booking;
  guestId: string | any;
  registrationDetails: {
    primaryGuest: {
      fullName: string;
      phone: string;
      email: string;
      nationality: string;
      idProofType: string;
      idProofNumberMasked: string;
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
  };
  verificationStatus: RegistrationStatus;
  reviewedBy?: {
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
  submittedAt?: string;
  createdAt: string;
}

export interface AvailabilitySearchResponse {
  searchCriteria: {
    checkIn: string;
    checkOut: string;
    guests: number;
    rooms: number;
    roomTypeId?: string;
  };
  available: boolean;
  totalAvailableRooms: number;
  roomTypes: AvailableRoomOption[];
}

export interface PartnerHotel {
  _id: string;
  hotelName?: string;
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  location?: {
    address: string;
    city: string;
    state?: string;
    pincode?: string;
  };
  contactInformation?: {
    phone: string;
    email: string;
  };
  contact?: {
    phone: string;
    email: string;
    managerName?: string;
  };
  amenities?: string[];
  images?: string[];
  officialWebsiteUrl?: string;
  externalBookingUrl?: string;
  listingStatus?: string;
  approvalStatus?: string;
}

