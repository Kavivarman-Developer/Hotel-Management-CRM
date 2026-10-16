import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';

export interface ExtraStayRequest {
  _id: string;
  bookingId: string | any;
  stayId?: string | any;
  bookingReference: string;
  guestName: string;
  guestMobile: string;
  roomNumber: string;
  currentCheckOutDate: string;
  currentCheckOutTime: string;
  requestedExtraHours: number;
  newExpectedCheckOutTime: string;
  reason: string;
  hourlyRatePaise: number;
  chargeAmountPaise: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'ADDED_TO_FOLIO' | 'PAID';
  staffNotes?: string;
  rejectionReason?: string;
  actionedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  actionedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitExtraStayInput {
  bookingReference: string;
  requestedExtraHours: number;
  reason: string;
}

export const extraStaysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitExtraStayRequest: builder.mutation<ApiResponse<ExtraStayRequest>, SubmitExtraStayInput>({
      query: (body) => ({
        url: '/extra-stays/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.EXTRA_STAYS, API_TAGS.STAYS, API_TAGS.BOOKINGS],
    }),

    getBookingExtraStays: builder.query<ApiResponse<ExtraStayRequest[]>, string>({
      query: (reference) => `/extra-stays/booking/${reference}`,
      providesTags: [API_TAGS.EXTRA_STAYS],
    }),

    getAdminExtraStays: builder.query<
      ApiResponse<ExtraStayRequest[]>,
      { status?: string; search?: string; page?: number; limit?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && params.status) queryParams.append('status', params.status);
        if (params && params.search) queryParams.append('search', params.search);
        if (params && params.page) queryParams.append('page', String(params.page));
        if (params && params.limit) queryParams.append('limit', String(params.limit));
        return `/extra-stays?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.EXTRA_STAYS],
    }),

    approveExtraStay: builder.mutation<
      ApiResponse<ExtraStayRequest>,
      { id: string; body: { addToFolio?: boolean; staffNotes?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/extra-stays/${id}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        API_TAGS.EXTRA_STAYS,
        API_TAGS.STAYS,
        API_TAGS.BOOKINGS,
        API_TAGS.DASHBOARD,
      ],
    }),

    rejectExtraStay: builder.mutation<
      ApiResponse<ExtraStayRequest>,
      { id: string; body: { rejectionReason: string } }
    >({
      query: ({ id, body }) => ({
        url: `/extra-stays/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.EXTRA_STAYS],
    }),
  }),
});

export const {
  useSubmitExtraStayRequestMutation,
  useGetBookingExtraStaysQuery,
  useGetAdminExtraStaysQuery,
  useApproveExtraStayMutation,
  useRejectExtraStayMutation,
} = extraStaysApi;
