import { describe, it, expect } from 'vitest';
import {
  calculateNights,
  getDefaultCheckIn,
  getDefaultCheckOut,
  getMinCheckOutDate,
  formatDisplayDate,
} from '../dates';

describe('Dates Utilities', () => {
  it('calculates nights accurately between two dates', () => {
    expect(calculateNights('2026-10-15', '2026-10-17')).toBe(2);
    expect(calculateNights('2026-10-15', '2026-10-16')).toBe(1);
    expect(calculateNights('2026-10-15', '2026-10-22')).toBe(7);
  });

  it('guarantees at least 1 night duration for invalid or same day checkout', () => {
    expect(calculateNights('2026-10-15', '2026-10-15')).toBe(1);
    expect(calculateNights('', '')).toBe(1);
  });

  it('calculates next day as minimum check-out date', () => {
    expect(getMinCheckOutDate('2026-10-15')).toBe('2026-10-16');
  });

  it('formats dates into readable display text', () => {
    const formatted = formatDisplayDate('2026-10-15');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
  });
});
