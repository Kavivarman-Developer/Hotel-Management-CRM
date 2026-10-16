import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getDefaultCheckIn, getDefaultCheckOut } from '@/utils/dates';

export interface BookingSearchState {
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  numberOfRooms: number;
  roomTypeId?: string;
  discountCode?: string;
}

const initialState: BookingSearchState = {
  checkInDate: getDefaultCheckIn(),
  checkOutDate: getDefaultCheckOut(),
  numberOfGuests: 2,
  numberOfRooms: 1,
  discountCode: '',
};

export const bookingSearchSlice = createSlice({
  name: 'bookingSearch',
  initialState,
  reducers: {
    setSearchDates: (
      state,
      action: PayloadAction<{ checkInDate: string; checkOutDate: string }>
    ) => {
      state.checkInDate = action.payload.checkInDate;
      state.checkOutDate = action.payload.checkOutDate;
    },
    setGuests: (state, action: PayloadAction<number>) => {
      state.numberOfGuests = Math.max(1, action.payload);
    },
    setRooms: (state, action: PayloadAction<number>) => {
      state.numberOfRooms = Math.max(1, action.payload);
    },
    setDiscountCode: (state, action: PayloadAction<string>) => {
      state.discountCode = action.payload;
    },
    setRoomTypeFilter: (state, action: PayloadAction<string | undefined>) => {
      state.roomTypeId = action.payload;
    },
    resetSearch: (state) => {
      state.checkInDate = getDefaultCheckIn();
      state.checkOutDate = getDefaultCheckOut();
      state.numberOfGuests = 2;
      state.numberOfRooms = 1;
      state.roomTypeId = undefined;
      state.discountCode = '';
    },
  },
});

export const {
  setSearchDates,
  setGuests,
  setRooms,
  setDiscountCode,
  setRoomTypeFilter,
  resetSearch,
} = bookingSearchSlice.actions;

export default bookingSearchSlice.reducer;
