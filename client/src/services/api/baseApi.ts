import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { ALL_TAG_TYPES } from './apiTags';
import { storage } from '@/utils/storage';

const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as any;
    const token = state?.auth?.token || storage.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResult = await rawBaseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const resData = refreshResult.data as any;
          const newAccessToken =
            resData?.data?.tokens?.accessToken ||
            resData?.tokens?.accessToken ||
            resData?.data?.accessToken ||
            resData?.accessToken;
          const newRefreshToken =
            resData?.data?.tokens?.refreshToken ||
            resData?.tokens?.refreshToken ||
            resData?.data?.refreshToken ||
            resData?.refreshToken;

          if (newAccessToken) {
            storage.setToken(newAccessToken);
            if (newRefreshToken) {
              storage.setRefreshToken(newRefreshToken);
            }
            // Retry the original query with the new token
            result = await rawBaseQuery(args, api, extraOptions);
            return result;
          }
        }
      } catch (e) {
        console.warn('Auto token refresh failed:', e);
      }
    }

    // If refresh failed or not available, clear stale credentials
    storage.clearAuth();
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/login?expired=true';
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ALL_TAG_TYPES,
  endpoints: () => ({}),
});
