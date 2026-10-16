import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';

export interface ValidatedQrTokenData {
  valid: boolean;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  stayStatus: string;
  paymentStatus: string;
  verificationStatus: string;
  roomType: {
    name: string;
    category: string;
    images: string[];
  };
}

export interface GuestRegistrationSubmitPayload {
  token: string;
  primaryGuest: {
    fullName: string;
    phone: string;
    email: string;
    nationality: string;
    idProofType: 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Other';
    idProofNumber: string;
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

export const registrationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateQrToken: builder.query<ApiResponse<ValidatedQrTokenData>, string>({
      query: (token) => `/qr/${token}/validate`,
      providesTags: (_result, _error, token) => [{ type: API_TAGS.REGISTRATIONS, id: token }],
    }),

    submitRegistration: builder.mutation<
      ApiResponse<{ id: string; verificationStatus: string; submittedAt: string }>,
      GuestRegistrationSubmitPayload
    >({
      query: ({ token, ...body }) => ({
        url: '/guest-registrations',
        method: 'POST',
        headers: {
          'x-qr-token': token,
        },
        body: {
          token,
          ...body,
        },
      }),
      invalidatesTags: [API_TAGS.REGISTRATIONS, API_TAGS.BOOKINGS],
    }),

    submitWalkInRegistration: builder.mutation<
      ApiResponse<{
        registrationId: string;
        walkInReference: string;
        verificationStatus: string;
        guestName: string;
      }>,
      any
    >({
      query: (body) => ({
        url: '/guest-registrations/walk-in',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.REGISTRATIONS, API_TAGS.BOOKINGS],
    }),
  }),
});

export const {
  useValidateQrTokenQuery,
  useSubmitRegistrationMutation,
  useSubmitWalkInRegistrationMutation,
} = registrationApi;
