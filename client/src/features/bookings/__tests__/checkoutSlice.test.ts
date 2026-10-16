import { describe, it, expect } from 'vitest';
import checkoutReducer, {
  setSelectedRoomType,
  setHoldData,
  setStep,
  clearHold,
  resetCheckout,
} from '../checkoutSlice';
import { RoomType } from '@/types';

describe('Checkout Slice', () => {
  const dummyRoomType: RoomType = {
    _id: 'rt_123',
    name: 'Deluxe King Room',
    code: 'deluxe-king',
    category: 'deluxe',
    description: 'Spacious king room',
    maxGuests: 2,
    bedConfiguration: '1 King Bed',
    amenities: ['Wi-Fi', 'AC'],
    images: [],
    defaultNightlyRate: 179900,
    isActive: true,
  };

  it('selects room type and advances to step 2', () => {
    const state = checkoutReducer(undefined, setSelectedRoomType(dummyRoomType));
    expect(state.selectedRoomType?._id).toBe('rt_123');
    expect(state.currentStep).toBe(2);
  });

  it('sets hold data properly', () => {
    const state = checkoutReducer(
      undefined,
      setHoldData({
        holdId: 'hold_abc',
        holdToken: 'token_xyz',
        expiresAt: '2026-10-15T16:00:00.000Z',
        pricing: {
          currency: 'INR',
          nightCount: 2,
          perNightBreakdown: [],
          subtotal: 359800,
          discount: 0,
          taxes: 43176,
          taxRatePercentage: 12,
          additionalCharges: 0,
          totalAmount: 402976,
        },
      })
    );

    expect(state.holdId).toBe('hold_abc');
    expect(state.holdToken).toBe('token_xyz');
    expect(state.pricing?.totalAmount).toBe(402976);
  });

  it('clears hold data', () => {
    const stateWithHold = {
      currentStep: 3,
      selectedRoomType: dummyRoomType,
      holdId: 'hold_abc',
      holdToken: 'token_xyz',
      holdExpiresAt: '2026-10-15T16:00:00.000Z',
      pricing: null,
      guestDetails: null,
      specialRequests: '',
      confirmedBooking: null,
    };

    const nextState = checkoutReducer(stateWithHold, clearHold());
    expect(nextState.holdId).toBeNull();
    expect(nextState.holdToken).toBeNull();
  });
});
