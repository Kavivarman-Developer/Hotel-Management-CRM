import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RoomType, PricingCalculationResult, GuestDetails } from '@/types';

export interface CheckoutState {
  currentStep: number; // 1: Room, 2: Guest Details, 3: Review & Payment, 4: Confirmed
  selectedRoomType: RoomType | null;
  holdId: string | null;
  holdToken: string | null;
  holdExpiresAt: string | null;
  pricing: PricingCalculationResult | null;
  guestDetails: GuestDetails | null;
  specialRequests: string;
  confirmedBooking: any | null;
}

const initialState: CheckoutState = {
  currentStep: 1,
  selectedRoomType: null,
  holdId: null,
  holdToken: null,
  holdExpiresAt: null,
  pricing: null,
  guestDetails: null,
  specialRequests: '',
  confirmedBooking: null,
};

export const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setSelectedRoomType: (state, action: PayloadAction<RoomType>) => {
      state.selectedRoomType = action.payload;
      state.currentStep = 2; // move to guest details
    },
    setHoldData: (
      state,
      action: PayloadAction<{
        holdId: string;
        holdToken: string;
        expiresAt: string;
        pricing: PricingCalculationResult;
      }>
    ) => {
      state.holdId = action.payload.holdId;
      state.holdToken = action.payload.holdToken;
      state.holdExpiresAt = action.payload.expiresAt;
      state.pricing = action.payload.pricing;
    },
    setGuestDetails: (
      state,
      action: PayloadAction<{ guest: GuestDetails; specialRequests?: string }>
    ) => {
      state.guestDetails = action.payload.guest;
      if (action.payload.specialRequests !== undefined) {
        state.specialRequests = action.payload.specialRequests;
      }
      state.currentStep = 3; // move to review & payment
    },
    clearHold: (state) => {
      state.holdId = null;
      state.holdToken = null;
      state.holdExpiresAt = null;
    },
    setPricing: (state, action: PayloadAction<PricingCalculationResult | null>) => {
      state.pricing = action.payload;
    },
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setConfirmedBooking: (state, action: PayloadAction<any>) => {
      state.confirmedBooking = action.payload;
      state.currentStep = 4; // confirmed
      // clear hold after successful conversion
      state.holdId = null;
      state.holdToken = null;
      state.holdExpiresAt = null;
    },
    resetCheckout: (state) => {
      state.currentStep = 1;
      state.selectedRoomType = null;
      state.holdId = null;
      state.holdToken = null;
      state.holdExpiresAt = null;
      state.pricing = null;
      state.guestDetails = null;
      state.specialRequests = '';
      state.confirmedBooking = null;
    },
  },
});

export const {
  setSelectedRoomType,
  setHoldData,
  setGuestDetails,
  clearHold,
  setPricing,
  setStep,
  setConfirmedBooking,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
