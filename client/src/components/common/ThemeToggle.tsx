import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = true }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
        theme === 'light'
          ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 shadow-slate-200'
          : 'bg-stone-900 text-stone-200 border-stone-700 hover:bg-stone-800 shadow-black/40'
      } ${className}`}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'White / Light'} Theme`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          {showLabel && <span>White Theme</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-gold-400 fill-gold-400/20" />
          {showLabel && <span>Dark Theme</span>}
        </>
      )}
    </button>
  );
};
