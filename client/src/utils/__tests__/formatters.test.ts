import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  paiseToRupees,
  rupeesToPaise,
  maskMobile,
  maskEmail,
  maskIdNumber,
} from '../formatters';

describe('Formatters Utilities', () => {
  it('converts paise to rupees correctly', () => {
    expect(paiseToRupees(179900)).toBe(1799);
    expect(paiseToRupees(0)).toBe(0);
    expect(paiseToRupees(249950)).toBe(2499.5);
  });

  it('converts rupees to integer paise correctly', () => {
    expect(rupeesToPaise(1799)).toBe(179900);
    expect(rupeesToPaise(2499.5)).toBe(249950);
  });

  it('formats currency in Indian Rupees format', () => {
    const formatted = formatCurrency(179900);
    expect(formatted).toContain('1,799');
    expect(formatted).toMatch(/₹|INR/);
  });

  it('masks phone numbers leaving last 4 digits visible', () => {
    expect(maskMobile('8110018708')).toBe('••••••8708');
  });

  it('masks email addresses preserving domain and head/tail', () => {
    expect(maskEmail('contact@grandomrresidency.com')).toBe('co***t@grandomrresidency.com');
  });

  it('masks government ID numbers', () => {
    expect(maskIdNumber('123456789012')).toBe('•••• •••• 9012');
  });
});
