import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { PartnerHotel } from '@/types';

export const partnersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicPartners: builder.query<ApiResponse<PartnerHotel[]>, void>({
      query: () => '/partners',
      providesTags: [API_TAGS.PARTNERS],
    }),

    getAdminPartners: builder.query<ApiResponse<PartnerHotel[]>, void>({
      query: () => '/admin/partners',
      providesTags: [API_TAGS.PARTNERS],
    }),

    adminCreatePartner: builder.mutation<ApiResponse<PartnerHotel>, Partial<PartnerHotel>>({
      query: (body) => ({
        url: '/admin/partners',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.PARTNERS],
    }),

    adminUpdatePartner: builder.mutation<
      ApiResponse<PartnerHotel>,
      { id: string; body: Partial<PartnerHotel> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/partners/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [API_TAGS.PARTNERS],
    }),

    adminDeletePartner: builder.mutation<ApiResponse<any>, string>({
      query: (id) => ({
        url: `/admin/partners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [API_TAGS.PARTNERS],
    }),
  }),
});

export const {
  useGetPublicPartnersQuery,
  useGetAdminPartnersQuery,
  useAdminCreatePartnerMutation,
  useAdminUpdatePartnerMutation,
  useAdminDeletePartnerMutation,
} = partnersApi;
