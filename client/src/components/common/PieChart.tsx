import React, { useState } from 'react';

export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
  secondaryText?: string;
}

export interface PieChartProps {
  title?: string;
  subtitle?: string;
  data: PieChartSlice[];
  size?: number;
  donut?: boolean;
  centerValue?: string | number;
  centerLabel?: string;
  className?: string;
  valueFormatter?: (val: number) => string;
}

export const PieChart: React.FC<PieChartProps> = ({
  title,
  subtitle,
  data,
  size = 200,
  donut = true,
  centerValue,
  centerLabel,
  className = '',
  valueFormatter = (val) => String(val),
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + Math.max(0, item.value), 0);

  // SVG Geometry for Donut
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let accumulatedPercent = 0;

  const slices = data.map((item, index) => {
    const percent = total > 0 ? (Math.max(0, item.value) / total) * 100 : 0;
    const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent * circumference) / 100);
    accumulatedPercent += percent;

    return {
      ...item,
      percent: percent.toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  return (
    <div
      className={`p-6 rounded-2xl bg-white dark:bg-stone-900/70 border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-between ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h4 className="font-serif text-base font-bold text-slate-900 dark:text-stone-100">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
        {/* SVG Circle Chart */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full -rotate-90 transform drop-shadow-sm transition-all"
          >
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={donut ? '14' : '40'}
              className="text-slate-100 dark:text-stone-800/80"
            />

            {/* Slices */}
            {total > 0 &&
              slices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                return (
                  <circle
                    key={slice.index}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={donut ? (isHovered ? '17' : '14') : '40'}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      transformOrigin: 'center',
                      opacity: hoveredIndex === null || isHovered ? 1 : 0.6,
                    }}
                  />
                );
              })}
          </svg>

          {/* Center Label in Donut */}
          {donut && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="font-serif text-2xl font-black text-slate-900 dark:text-stone-100 tracking-tight leading-none">
                {hoveredIndex !== null
                  ? valueFormatter(slices[hoveredIndex].value)
                  : centerValue !== undefined
                  ? centerValue
                  : total}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-stone-400 mt-1 line-clamp-1">
                {hoveredIndex !== null
                  ? slices[hoveredIndex].label
                  : centerLabel || 'Total'}
              </span>
            </div>
          )}
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2.5">
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <div
                key={slice.index}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-stone-800'
                    : 'hover:bg-slate-50 dark:hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 dark:text-stone-200 block truncate">
                      {slice.label}
                    </span>
                    {slice.secondaryText && (
                      <span className="text-[10px] text-slate-500 dark:text-stone-400 block truncate">
                        {slice.secondaryText}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-2">
                  <span className="font-bold text-slate-900 dark:text-stone-100 block">
                    {valueFormatter(slice.value)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-stone-400 block">
                    {slice.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
