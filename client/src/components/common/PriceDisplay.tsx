import React from 'react';
import { formatCurrency } from '@/utils/formatters';

interface PriceDisplayProps {
  amountPaise: number;
  originalAmountPaise?: number;
  currency?: string;
  perNight?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTaxNote?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amountPaise,
  originalAmountPaise,
  currency = 'INR',
  perNight = true,
  size = 'md',
  showTaxNote = false,
  className = '',
}) => {
  const hasDiscount = originalAmountPaise && originalAmountPaise > amountPaise;

  const sizeClasses = {
    sm: 'text-base font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl md:text-3xl font-bold',
    xl: 'text-3xl md:text-4xl font-extrabold',
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        {hasDiscount && (
          <span className="text-sm line-through text-stone-500">
            {formatCurrency(originalAmountPaise, currency)}
          </span>
        )}
        <span className={`text-gold-400 font-serif ${sizeClasses[size]}`}>
          {formatCurrency(amountPaise, currency)}
        </span>
        {perNight && (
          <span className="text-xs text-stone-400 font-normal">/ night</span>
        )}
      </div>
      {showTaxNote && (
        <span className="text-[11px] text-stone-400 mt-0.5">+ Taxes & Fees</span>
      )}
    </div>
  );
};
