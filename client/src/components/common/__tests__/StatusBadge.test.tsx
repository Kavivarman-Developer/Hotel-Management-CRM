import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';
import { PriceDisplay } from '../PriceDisplay';

describe('Common UI Components', () => {
  it('renders StatusBadge with formatted text', () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('renders StatusBadge replacing underscores with spaces', () => {
    render(<StatusBadge status="CHECKED_IN" />);
    expect(screen.getByText('CHECKED IN')).toBeInTheDocument();
  });

  it('renders PriceDisplay converting paise to rupees', () => {
    render(<PriceDisplay amountPaise={179900} />);
    expect(screen.getByText(/1,799/)).toBeInTheDocument();
  });

  it('renders PriceDisplay with strike-through original amount when discounted', () => {
    render(<PriceDisplay amountPaise={179900} originalAmountPaise={219900} />);
    expect(screen.getByText(/2,199/)).toBeInTheDocument();
    expect(screen.getByText(/1,799/)).toBeInTheDocument();
  });
});
