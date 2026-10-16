import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';

export interface CheckInPayload {
  assignedRoomId?: string;
  notes?: string;
  depositCollected?: number;
}

export interface CheckOutPayload {
  additionalCharges?: Array<{
    description: string;
    amount: number;
    category: string;
  }>;
  damageCharges?: number; // paise
  minibarCharges?: number; // paise
  lateCheckoutFee?: number; // paise
  notes?: string;
  paymentMethod?: string;
}

export const staysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStays: builder.query<ApiResponse<any[]>, { status?: string; page?: number; limit?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.status) queryParams.append('status', params.status);
        if (params.page) queryParams.append('page', String(params.page));
        if (params.limit) queryParams.append('limit', String(params.limit));
        return `/admin/stays?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.STAYS],
    }),

    getArrivals: builder.query<ApiResponse<any[]>, void>({
      query: () => `/admin/stays/arrivals`,
      providesTags: [API_TAGS.ARRIVALS],
    }),

    getStayById: builder.query<ApiResponse<any>, string>({
      query: (id) => `/admin/stays/${id}`,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.STAYS, id }],
    }),

    checkInStay: builder.mutation<ApiResponse<any>, { id: string; body: CheckInPayload }>({
      query: ({ id, body }) => ({
        url: `/stays/${id}/check-in`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        API_TAGS.STAYS,
        API_TAGS.ARRIVALS,
        API_TAGS.ROOMS,
        API_TAGS.BOOKINGS,
        API_TAGS.DASHBOARD,
      ],
    }),

    checkOutStay: builder.mutation<ApiResponse<any>, { id: string; body: CheckOutPayload }>({
      query: ({ id, body }) => ({
        url: `/stays/${id}/check-out`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        API_TAGS.STAYS,
        API_TAGS.ARRIVALS,
        API_TAGS.ROOMS,
        API_TAGS.BOOKINGS,
        API_TAGS.DASHBOARD,
      ],
    }),

    addStayCharge: builder.mutation<
      ApiResponse<any>,
      { id: string; body: { description: string; amount: number; category?: string } }
    >({
      query: ({ id, body }) => ({
        url: `/stays/${id}/charge`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.STAYS, API_TAGS.BOOKINGS, API_TAGS.DASHBOARD],
    }),
  }),
});

export const {
  useGetStaysQuery,
  useGetArrivalsQuery,
  useGetStayByIdQuery,
  useCheckInStayMutation,
  useCheckOutStayMutation,
  useAddStayChargeMutation,
} = staysApi;
