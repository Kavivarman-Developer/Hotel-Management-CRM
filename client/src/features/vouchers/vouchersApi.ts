import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';

export interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  timesUsed: number;
  isActive: boolean;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VoucherCalculation {
  isValid: boolean;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountPaise: number;
  discountedSubtotalPaise: number;
  message: string;
}

export interface CreateVoucherInput {
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil: string;
  usageLimit?: number;
  isActive?: boolean;
}

export const vouchersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    validateVoucher: builder.mutation<
      ApiResponse<VoucherCalculation>,
      { code: string; subtotal: number }
    >({
      query: (body) => ({
        url: '/vouchers/validate',
        method: 'POST',
        body,
      }),
    }),

    getVouchers: builder.query<
      ApiResponse<Voucher[]>,
      { search?: string; isActive?: boolean | string; page?: number; limit?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && params.search) queryParams.append('search', params.search);
        if (params && params.isActive !== undefined)
          queryParams.append('isActive', String(params.isActive));
        if (params && params.page) queryParams.append('page', String(params.page));
        if (params && params.limit) queryParams.append('limit', String(params.limit));
        return `/vouchers?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.VOUCHERS],
    }),

    createVoucher: builder.mutation<ApiResponse<Voucher>, CreateVoucherInput>({
      query: (body) => ({
        url: '/vouchers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.VOUCHERS],
    }),

    updateVoucher: builder.mutation<
      ApiResponse<Voucher>,
      { id: string; body: Partial<CreateVoucherInput> }
    >({
      query: ({ id, body }) => ({
        url: `/vouchers/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [API_TAGS.VOUCHERS],
    }),

    deleteVoucher: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/vouchers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [API_TAGS.VOUCHERS],
    }),
  }),
});

export const {
  useValidateVoucherMutation,
  useGetVouchersQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
} = vouchersApi;
