import { describe, it, expect } from 'vitest';
import bookingSearchReducer, {
  setSearchDates,
  setGuests,
  setRooms,
  setDiscountCode,
  resetSearch,
} from '../bookingSearchSlice';

describe('Booking Search Slice', () => {
  it('initializes with default dates and guest counts', () => {
    const state = bookingSearchReducer(undefined, { type: 'unknown' });
    expect(state.numberOfGuests).toBe(2);
    expect(state.numberOfRooms).toBe(1);
    expect(state.checkInDate).toBeDefined();
    expect(state.checkOutDate).toBeDefined();
  });

  it('updates search dates', () => {
    const state = bookingSearchReducer(
      undefined,
      setSearchDates({ checkInDate: '2026-11-01', checkOutDate: '2026-11-05' })
    );
    expect(state.checkInDate).toBe('2026-11-01');
    expect(state.checkOutDate).toBe('2026-11-05');
  });

  it('updates guest and room counts enforcing minimums', () => {
    let state = bookingSearchReducer(undefined, setGuests(4));
    expect(state.numberOfGuests).toBe(4);

    state = bookingSearchReducer(state, setGuests(0));
    expect(state.numberOfGuests).toBe(1); // enforced min 1

    state = bookingSearchReducer(state, setRooms(3));
    expect(state.numberOfRooms).toBe(3);
  });

  it('updates discount code', () => {
    const state = bookingSearchReducer(undefined, setDiscountCode('GRAND10'));
    expect(state.discountCode).toBe('GRAND10');
  });
});
