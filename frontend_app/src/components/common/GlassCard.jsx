import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GlassCard({ children, className = '', glow = false, glowColor = 'purple', onClick }) {
  const { isDark } = useTheme();

  const glowStyles = {
    purple: 'hover:shadow-lg hover:shadow-black/30 hover:border-[#2563EB]/50',
    blue: 'hover:shadow-lg hover:shadow-sky-900/25 hover:border-sky-500/50',
    emerald: 'hover:shadow-lg hover:shadow-emerald-900/25 hover:border-emerald-500/50',
    amber: 'hover:shadow-lg hover:shadow-amber-900/25 hover:border-amber-500/50',
    rose: 'hover:shadow-lg hover:shadow-rose-900/25 hover:border-rose-500/50',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl transition-colors duration-200 relative overflow-hidden ${
        isDark
          ? 'vision-glass text-slate-100'
          : 'vision-glass-light text-slate-800'
      } ${glow ? glowStyles[glowColor] : ''} ${className}`}
    >
      {children}
    </div>
  );
}
