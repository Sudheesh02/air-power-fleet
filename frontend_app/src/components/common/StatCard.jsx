import React from 'react';
import GlassCard from './GlassCard';
import { useTheme } from '../../context/ThemeContext';

function Sparkline({ data, color = '#0075FF', height = 28 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const width = 80;
  const paddingX = 6;
  const paddingY = 5;

  // Map data to coordinates with guaranteed safe padding margins
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const normalized = (val - min) / range;
    const y = (height - paddingY) - normalized * (height - paddingY * 2);
    return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
  });

  // Smooth cubic Bezier spline with horizontal tangent at origin and termination
  let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const cp1x = p0.x + dx * 0.45;
    const cp1y = p0.y;
    const cp2x = p0.x + dx * 0.55;
    const cp2y = p1.y;
    pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }

  const baselineY = height - 2;
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${baselineY} L ${points[0].x.toFixed(1)},${baselineY} Z`;

  const gradientId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="w-20 h-7 shrink-0 overflow-hidden flex items-center justify-end">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full block">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="2.5" fill={color} />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="4.5" fill={color} opacity="0.25" />
      </svg>
    </div>
  );
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive', // positive, negative, neutral, amber
  icon: Icon,
  subtitle,
  progress = null,
  glowColor = 'blue',
  sparklineData = null
}) {
  const { isDark } = useTheme();

  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25',
    negative: 'text-rose-400 bg-rose-500/10 border border-rose-500/25',
    neutral: 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border border-amber-500/25',
  };

  const strokeColors = {
    blue: '#0075FF',
    emerald: '#01B574',
    amber: '#FFB547',
    rose: '#EE5D50',
    purple: '#7551FF',
  };

  const iconTonalStyles = {
    blue: 'bg-[#0075FF]/10 text-cyan-400 border border-[#0075FF]/20 shadow-[0_0_12px_rgba(0,117,255,0.15)]',
    emerald: 'bg-[#01B574]/10 text-emerald-400 border border-[#01B574]/20 shadow-[0_0_12px_rgba(1,181,116,0.15)]',
    amber: 'bg-[#FFB547]/10 text-amber-400 border border-[#FFB547]/20 shadow-[0_0_12px_rgba(255,181,71,0.15)]',
    rose: 'bg-[#EE5D50]/10 text-rose-400 border border-[#EE5D50]/20 shadow-[0_0_12px_rgba(238,93,80,0.15)]',
    purple: 'bg-[#7551FF]/10 text-purple-400 border border-[#7551FF]/20 shadow-[0_0_12px_rgba(117,81,255,0.15)]',
  };

  // Helper to parse composite values like "12 / 18" or "3 Tails" or "3 Grounded"
  const renderFormattedValue = (val) => {
    if (typeof val !== 'string') {
      return <span>{val}</span>;
    }

    // Pattern 1: Fraction like "12 / 18"
    if (val.includes('/')) {
      const parts = val.split('/');
      return (
        <span className="inline-flex items-baseline whitespace-nowrap">
          <span className="font-extrabold">{parts[0].trim()}</span>
          <span className="text-lg sm:text-xl font-medium opacity-50 ml-2 whitespace-nowrap">/ {parts[1].trim()}</span>
        </span>
      );
    }

    // Pattern 2: Number + Unit like "3 Tails" or "3 Grounded"
    const match = val.match(/^(\d+[\.\d*%]?)\s+(.+)$/);
    if (match) {
      return (
        <span className="inline-flex items-baseline whitespace-nowrap">
          <span className="font-extrabold">{match[1]}</span>
          <span className="text-base sm:text-lg font-semibold opacity-70 ml-2 whitespace-nowrap">{match[2]}</span>
        </span>
      );
    }

    return <span className="whitespace-nowrap">{val}</span>;
  };

  return (
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 relative group">
      {/* 1. TOP HEADER ROW: Icon + Title on Left, Status/Trend Badge on Right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <div className={`w-8 h-8 rounded-xl ${iconTonalStyles[glowColor] || iconTonalStyles.blue} flex items-center justify-center shrink-0`}>
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </div>
          )}
          <span className={`text-xs font-semibold tracking-tight font-sans truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`} title={title}>
            {title}
          </span>
        </div>

        {change && (
          <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold font-sans whitespace-nowrap shrink-0 ml-1 ${changeColors[changeType] || changeColors.neutral}`}>
            {change}
          </span>
        )}
      </div>

      {/* 2. DEDICATED METRIC ROW: Big Value on Left, Sparkline on Right */}
      <div className="mt-3 mb-2 flex items-center justify-between gap-3">
        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans whitespace-nowrap ${isDark ? 'text-white' : 'text-[#1B2559]'}`}>
          {renderFormattedValue(value)}
        </div>

        {sparklineData && (
          <Sparkline
            data={sparklineData}
            color={strokeColors[glowColor] || '#0075FF'}
            height={28}
          />
        )}
      </div>

      {/* 3. CONTEXT FOOTER ROW: Clean Subtitle with 100% Horizontal Space (Zero Ellipses/Truncation) */}
      <div className="pt-2 border-t border-white/5 dark:border-white/5 flex items-center justify-between">
        {progress !== null ? (
          <div className="w-full">
            <div className="flex justify-between text-[11px] mb-1 font-sans font-medium">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{subtitle || 'Readiness index'}</span>
              <span className="font-bold text-cyan-400 ml-1">{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-700/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0075FF] to-[#00D5FF] transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={`text-xs font-sans font-normal leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
