import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function GlassCard({ children, className = '', glow = false, glowColor = 'purple', onClick }) {
  const { isDark } = useTheme();

  const glowStyles = {
    purple: 'hover:shadow-lg hover:shadow-purple-900/20 hover:border-purple-500/40',
    blue: 'hover:shadow-lg hover:shadow-sky-900/20 hover:border-sky-500/40',
    emerald: 'hover:shadow-lg hover:shadow-emerald-900/20 hover:border-emerald-500/40',
    amber: 'hover:shadow-lg hover:shadow-amber-900/20 hover:border-amber-500/40',
    rose: 'hover:shadow-lg hover:shadow-rose-900/20 hover:border-rose-500/40',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'vision-glass text-white shadow-vision-card-dark'
          : 'vision-glass-light text-slate-800'
      } ${glow ? glowStyles[glowColor] : ''} ${className}`}
    >
      {children}
    </div>
  );
}
