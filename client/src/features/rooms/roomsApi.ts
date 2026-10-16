import { baseApi } from '@/services/api/baseApi';
import { API_TAGS } from '@/services/api/apiTags';
import { ApiResponse } from '@/types/api';
import { RoomType, Room } from '@/types';

export const roomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoomTypes: builder.query<ApiResponse<RoomType[]>, void>({
      query: () => '/room-types',
      providesTags: [API_TAGS.ROOM_TYPES],
    }),

    getPublicRooms: builder.query<ApiResponse<Room[]>, void>({
      query: () => '/rooms',
      providesTags: [API_TAGS.ROOMS],
    }),

    getPublicRoom: builder.query<ApiResponse<Room>, string>({
      query: (id) => `/rooms/${id}`,
      providesTags: (_result, _error, id) => [{ type: API_TAGS.ROOMS, id }],
    }),
  }),
});

export const { useGetRoomTypesQuery, useGetPublicRoomsQuery, useGetPublicRoomQuery } =
  roomsApi;
