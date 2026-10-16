import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, id, min, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-gold-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-gold-400/80">
            <Calendar className="w-4 h-4" />
          </div>
          <input
            id={inputId}
            type="date"
            ref={ref}
            min={min}
            className={twMerge(
              clsx(
                'w-full bg-stone-900/90 text-stone-100 text-sm rounded-lg border transition-all duration-200 outline-none cursor-pointer',
                'focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/80',
                'pl-10 pr-3.5 py-2.5 [color-scheme:dark]',
                error
                  ? 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500'
                  : 'border-stone-800 hover:border-stone-700',
                props.disabled && 'opacity-60 cursor-not-allowed bg-stone-950',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-400 font-medium flex items-center gap-1">
            <span>•</span> {error}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
