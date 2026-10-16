import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EAECF0] dark:border-slate-800 mb-6 ${className}`}
    >
      <div>
        {eyebrow && (
          <span className="text-xs uppercase tracking-wider text-[#487FFF] font-bold mb-1 block">
            {eyebrow}
          </span>
        )}
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[#1E293B] dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400 max-w-2xl leading-relaxed font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};
