import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { AvailableRoomOption, AvailabilitySearchResponse } from '@/types';

export interface CheckAvailabilityParams {
  checkIn: string;
  checkOut: string;
  guests?: number;
  rooms?: number;
  discountCode?: string;
}

export const availabilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    checkAvailability: builder.query<
      ApiResponse<AvailabilitySearchResponse | AvailableRoomOption[]>,
      CheckAvailabilityParams
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append('checkIn', params.checkIn);
        queryParams.append('checkOut', params.checkOut);
        if (params.guests) queryParams.append('guests', String(params.guests));
        if (params.rooms) queryParams.append('rooms', String(params.rooms));
        if (params.discountCode) queryParams.append('discountCode', params.discountCode);

        return `/rooms/availability?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.AVAILABILITY],
    }),
  }),
});

export const { useCheckAvailabilityQuery } = availabilityApi;
