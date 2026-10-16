import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold tracking-wider uppercase text-stone-300 mb-1.5"
          >
            {label}
            {props.required && <span className="text-gold-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full appearance-none bg-stone-900/90 text-stone-100 text-sm rounded-lg border transition-all duration-200 outline-none',
                'focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/80',
                'px-3.5 py-2.5 pr-10',
                error
                  ? 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500'
                  : 'border-stone-800 hover:border-stone-700',
                props.disabled && 'opacity-60 cursor-not-allowed bg-stone-950',
                className
              )
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-stone-900 text-stone-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
