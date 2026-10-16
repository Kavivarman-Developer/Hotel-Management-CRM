import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { User, Room, Booking, RoomType, GuestRegistrationData } from '@/types';

export interface DashboardMetrics {
  date?: string;
  occupancy?: {
    totalRooms: number;
    activeRooms: number;
    availableInventory: number;
    occupiedRooms: number;
    reservedRooms: number;
    maintenanceRooms: number;
    occupancyRatePercentage: number;
  };
  operations?: {
    arrivalsToday: number;
    departuresToday: number;
    checkedInGuests: number;
    confirmedBookings: number;
  };
  financials?: {
    currency: string;
    paidRevenuePaise: number;
    paidRevenueFormatted: string;
    outstandingPaymentsPaise: number;
    outstandingPaymentsFormatted: string;
    totalRefundsPaise: number;
    totalRefundsFormatted: string;
    netRevenuePaise: number;
  };
  channelBreakdown?: {
    directCount: number;
    walkInCount: number;
    partnerCount: number;
    otherCount: number;
    directPercentage: number;
    walkInPercentage: number;
    partnerPercentage: number;
    otherPercentage: number;
    offlineRevenuePaise: number;
    platformRevenuePaise: number;
  };
  dailyTimeline?: Array<{
    name: string;
    date: string;
    occupied: number;
    available: number;
    notReady: number;
    total: number;
  }>;
  totalRooms?: number;
  occupiedRooms?: number;
  availableRooms?: number;
  maintenanceRooms?: number;
  occupancyRate?: number;
  todayCheckIns?: number;
  todayCheckOuts?: number;
  pendingRegistrations?: number;
  totalRevenuePaise?: number;
  activeBookingsCount?: number;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query<ApiResponse<DashboardMetrics>, void>({
      query: () => '/admin/dashboard',
      providesTags: [API_TAGS.DASHBOARD],
    }),

    getAdminBookings: builder.query<
      ApiResponse<Booking[]>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', String(params.page));
        if (params.limit) queryParams.append('limit', String(params.limit));
        if (params.status) queryParams.append('status', params.status);
        if (params.search) queryParams.append('search', params.search);
        return `/admin/bookings?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.BOOKINGS],
    }),

    adminCancelBooking: builder.mutation<
      ApiResponse<any>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admin/bookings/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [API_TAGS.BOOKINGS, API_TAGS.DASHBOARD],
    }),

    adminReissueQr: builder.mutation<ApiResponse<{ qrToken: string }>, string>({
      query: (id) => ({
        url: `/admin/bookings/${id}/reissue-qr`,
        method: 'POST',
      }),
      invalidatesTags: [API_TAGS.BOOKINGS],
    }),

    getAdminRooms: builder.query<ApiResponse<Room[]>, { status?: string; floor?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.floor) queryParams.append('floor', String(params.floor));
        return `/admin/rooms?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.ROOMS],
    }),

    adminCreateRoom: builder.mutation<ApiResponse<Room>, Partial<Room>>({
      query: (body) => ({
        url: '/admin/rooms',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.ROOMS, API_TAGS.DASHBOARD],
    }),

    adminUpdateRoom: builder.mutation<ApiResponse<Room>, { id: string; body: Partial<Room> }>({
      query: ({ id, body }) => ({
        url: `/admin/rooms/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [API_TAGS.ROOMS, API_TAGS.DASHBOARD],
    }),

    adminSetRoomMaintenance: builder.mutation<
      ApiResponse<Room>,
      { id: string; reason: string; blockedFrom?: string; blockedUntil?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/rooms/${id}/maintenance`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.ROOMS, API_TAGS.DASHBOARD],
    }),

    adminRemoveRoomMaintenance: builder.mutation<ApiResponse<Room>, string>({
      query: (id) => ({
        url: `/admin/rooms/${id}/maintenance`,
        method: 'DELETE',
      }),
      invalidatesTags: [API_TAGS.ROOMS, API_TAGS.DASHBOARD],
    }),

    getAdminStaff: builder.query<ApiResponse<User[]>, void>({
      query: () => '/admin/staff',
      providesTags: [API_TAGS.STAFF],
    }),

    adminCreateStaff: builder.mutation<
      ApiResponse<User>,
      { name: string; email: string; mobile: string; password?: string; role: string }
    >({
      query: (body) => ({
        url: '/admin/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: [API_TAGS.STAFF],
    }),

    adminToggleStaffStatus: builder.mutation<ApiResponse<User>, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/admin/staff/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: [API_TAGS.STAFF],
    }),

    getAdminRegistrations: builder.query<
      ApiResponse<GuestRegistrationData[]>,
      { page?: number; limit?: number; status?: string }
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.status) queryParams.append('status', params.status);
        return `/admin/registrations?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.REGISTRATIONS],
    }),

    adminApproveRegistration: builder.mutation<
      ApiResponse<GuestRegistrationData>,
      { id: string; notes?: string }
    >({
      query: ({ id, notes }) => ({
        url: `/admin/registrations/${id}/approve`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: [API_TAGS.REGISTRATIONS, API_TAGS.BOOKINGS, API_TAGS.DASHBOARD],
    }),

    adminRejectRegistration: builder.mutation<
      ApiResponse<GuestRegistrationData>,
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/admin/registrations/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: [API_TAGS.REGISTRATIONS, API_TAGS.BOOKINGS, API_TAGS.DASHBOARD],
    }),

    getOccupancyReport: builder.query<ApiResponse<any>, { startDate?: string; endDate?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        return `/admin/reports/occupancy?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.REPORTS],
    }),

    getRevenueReport: builder.query<ApiResponse<any>, { startDate?: string; endDate?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        return `/admin/reports/revenue?${queryParams.toString()}`;
      },
      providesTags: [API_TAGS.REPORTS],
    }),

    getAuditLogs: builder.query<ApiResponse<any[]>, { page?: number; limit?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        return `/admin/audit-logs?${queryParams.toString()}`;
      },
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetAdminBookingsQuery,
  useAdminCancelBookingMutation,
  useAdminReissueQrMutation,
  useGetAdminRoomsQuery,
  useAdminCreateRoomMutation,
  useAdminUpdateRoomMutation,
  useAdminSetRoomMaintenanceMutation,
  useAdminRemoveRoomMaintenanceMutation,
  useGetAdminStaffQuery,
  useAdminCreateStaffMutation,
  useAdminToggleStaffStatusMutation,
  useGetAdminRegistrationsQuery,
  useAdminApproveRegistrationMutation,
  useAdminRejectRegistrationMutation,
  useGetOccupancyReportQuery,
  useGetRevenueReportQuery,
  useGetAuditLogsQuery,
} = dashboardApi;
