import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';

export interface PropertySettingsData {
  _id?: string;
  propertyName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  timezone: string;
  holdDurationMinutes: number;
  defaultGstPercentage: number;
  cancellationGraceHours: number;
  allowSameDayBooking: boolean;
  extraStayHourlyRatePaise: number;
  rolePermissions?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsResponseData {
  settings: PropertySettingsData;
  rolePermissions: Record<string, string[]>;
}

export interface PermissionCatalogItem {
  id: string;
  label: string;
  description: string;
}

export interface PermissionCategory {
  category: string;
  categoryDescription: string;
  permissions: PermissionCatalogItem[];
}

export interface StaffUserSummary {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
}

export interface PermissionsMetadataResponse {
  catalog: PermissionCategory[];
  allPermissions: string[];
  rolePermissions: Record<string, string[]>;
  staffUsers: StaffUserSummary[];
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ApiResponse<SettingsResponseData>, void>({
      query: () => '/admin/settings',
      providesTags: [API_TAGS.SETTINGS],
    }),

    updateSettings: builder.mutation<ApiResponse<PropertySettingsData>, Partial<PropertySettingsData>>({
      query: (body) => ({
        url: '/admin/settings',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [API_TAGS.SETTINGS],
    }),

    getPermissionsMetadata: builder.query<ApiResponse<PermissionsMetadataResponse>, void>({
      query: () => '/admin/permissions',
      providesTags: [API_TAGS.PERMISSIONS, API_TAGS.STAFF],
    }),

    updateRolePermissions: builder.mutation<
      ApiResponse<any>,
      { role: string; permissions: string[]; applyToExistingUsers?: boolean }
    >({
      query: ({ role, permissions, applyToExistingUsers = true }) => ({
        url: `/admin/roles/${role}/permissions`,
        method: 'POST',
        body: { permissions, applyToExistingUsers },
      }),
      invalidatesTags: [API_TAGS.PERMISSIONS, API_TAGS.STAFF, API_TAGS.SETTINGS],
    }),

    updateStaffPermissions: builder.mutation<
      ApiResponse<any>,
      { id: string; permissions: string[] }
    >({
      query: ({ id, permissions }) => ({
        url: `/admin/staff/${id}/permissions`,
        method: 'PATCH',
        body: { permissions },
      }),
      invalidatesTags: [API_TAGS.PERMISSIONS, API_TAGS.STAFF],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetPermissionsMetadataQuery,
  useUpdateRolePermissionsMutation,
  useUpdateStaffPermissionsMutation,
} = settingsApi;
