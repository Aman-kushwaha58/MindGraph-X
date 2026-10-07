import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<Props> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border border-border-subtle bg-bg-surface hover:bg-bg-elevated text-text-secondary hover:text-text-primary transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-purple/40 cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
      aria-label={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-accent-purple transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium font-sans">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
