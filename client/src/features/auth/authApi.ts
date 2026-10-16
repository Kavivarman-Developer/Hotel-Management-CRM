import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { User } from '@/types';
import { setCredentials, updateUser, logout } from './authSlice';

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponseData {
  user: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: string;
  };
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponseData>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: [API_TAGS.AUTH],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            const token =
              data.data.tokens?.accessToken || data.data.accessToken || '';
            const refreshToken =
              data.data.tokens?.refreshToken || data.data.refreshToken || '';
            dispatch(
              setCredentials({
                user: data.data.user,
                accessToken: token,
                refreshToken: refreshToken,
              })
            );
          }
        } catch {
          // handled in component
        }
      },
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: [API_TAGS.AUTH],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(updateUser(data.data));
          }
        } catch {
          // ignore
        }
      },
    }),

    logoutUser: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: [API_TAGS.AUTH],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
        }
      },
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery, useLogoutUserMutation } = authApi;
