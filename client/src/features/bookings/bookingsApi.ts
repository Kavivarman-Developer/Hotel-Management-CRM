import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { HoldResult, Booking } from '@/types';

export interface CreateHoldPayload {
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  discountCode?: string;
  specificRoomId?: string;
}

export interface CreateBookingPayload {
  holdId?: string;
  holdToken?: string;
  roomTypeId?: string;
  specificRoomId?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  discountCode?: string;
  guest: {
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
  };
  bookingType?: string;
  durationHours?: number;
  guestComposition?: {
    males: number;
    females: number;
  };
  source?: string;
  specialRequests?: string;
}

export interface BookingResponseData {
  bookingReference: string;
  reservationStatus: string;
  paymentStatus: string;
  stayStatus: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  currency: string;
  pricing: any;
  qrToken?: string;
  qrCheckInUrl?: string;
  _id?: string;
  booking?: any;
}

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createHold: builder.mutation<ApiResponse<HoldResult>, CreateHoldPayload>({
      query: (body) => ({
        url: '/holds',
        method: 'POST',
        body,
        headers: {
          'Idempotency-Key': `hold_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
      }),
      invalidatesTags: [API_TAGS.AVAILABILITY],
    }),

    createBooking: builder.mutation<ApiResponse<BookingResponseData>, CreateBookingPayload>({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
        headers: {
          'Idempotency-Key': `book_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
      }),
      invalidatesTags: [API_TAGS.BOOKINGS, API_TAGS.AVAILABILITY, API_TAGS.DASHBOARD],
    }),

    getBookingByReference: builder.query<
      ApiResponse<Booking>,
      { reference: string; email?: string; mobile?: string }
    >({
      query: ({ reference, email, mobile }) => {
        const queryParams = new URLSearchParams();
        if (email) queryParams.append('email', email);
        if (mobile) queryParams.append('mobile', mobile);
        const queryStr = queryParams.toString();
        return `/bookings/${reference}${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: (_result, _error, { reference }) => [
        { type: API_TAGS.BOOKINGS, id: reference },
      ],
    }),

    cancelBooking: builder.mutation<
      ApiResponse<any>,
      { reference: string; reason: string }
    >({
      query: ({ reference, reason }) => ({
        url: `/bookings/${reference}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [API_TAGS.BOOKINGS, API_TAGS.AVAILABILITY, API_TAGS.DASHBOARD],
    }),
  }),
});

export const {
  useCreateHoldMutation,
  useCreateBookingMutation,
  useGetBookingByReferenceQuery,
  useLazyGetBookingByReferenceQuery,
  useCancelBookingMutation,
} = bookingsApi;
