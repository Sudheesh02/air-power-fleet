import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || '').toUpperCase().trim();

  let text = 'Unknown';
  let bgClass = 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700/80';
  let dotClass = 'bg-slate-400';

  if (norm === 'MISSION_CAPABLE' || norm === 'MISSION READY') {
    text = 'Mission Ready';
    bgClass = 'bg-slate-100 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-emerald-600/40';
    dotClass = 'bg-emerald-400';
  } else if (norm === 'CONDITIONAL_STANDBY' || norm === 'PREDICTIVE MAINTENANCE SCHEDULED' || norm === 'PREDICTIVE MAINT SCHEDULED') {
    text = 'Maintenance Scheduled';
    bgClass = 'bg-amber-50 dark:bg-slate-900/95 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-600/40';
    dotClass = 'bg-amber-400';
  } else if (norm === 'MAINTENANCE_GROUNDED' || norm === 'CRITICAL ALERT') {
    text = 'Grounded';
    bgClass = 'bg-rose-50 dark:bg-slate-900/95 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-600/40';
    dotClass = 'bg-rose-400';
  } else if (norm === 'CRITICAL' || norm === 'CRITICAL_AOG' || norm === 'AOG EXHAUSTED') {
    text = 'Critical';
    bgClass = 'bg-rose-50 dark:bg-slate-900/95 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-600/40';
    dotClass = 'bg-rose-400';
  } else if (norm === 'CAUTION' || norm === 'WARNING' || norm === 'SAFETY WARNING') {
    text = 'Advisory';
    bgClass = 'bg-amber-50 dark:bg-slate-900/95 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-600/40';
    dotClass = 'bg-amber-400';
  } else if (norm.includes('CAPABLE') || norm === 'READY' || norm === 'NOMINAL' || norm === 'MISSION_GO' || norm === 'OPTIMAL' || norm === 'RESOLVED' || norm === 'HEALTHY') {
    text = norm === 'HEALTHY' ? 'Healthy' : norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-slate-100 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-emerald-600/40';
    dotClass = 'bg-emerald-400';
  } else if (norm.includes('STANDBY') || norm === 'CONDITIONAL_GO' || norm === 'DISPATCHED' || norm === 'PREVENTIVE_ADVISORY') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-amber-50 dark:bg-slate-900/95 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-600/40';
    dotClass = 'bg-amber-400';
  } else if (norm.includes('GROUNDED') || norm === 'NO_GO' || norm === 'AWAITING_SPARES') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-rose-50 dark:bg-slate-900/95 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-600/40';
    dotClass = 'bg-rose-400';
  } else if (norm === 'IN_TRANSIT' || norm === 'IN_PROGRESS') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-sky-50 dark:bg-slate-900/95 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-600/40';
    dotClass = 'bg-sky-400';
  } else {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium tracking-normal',
    md: 'text-xs px-2.5 py-0.5 font-medium tracking-normal',
    lg: 'text-xs px-3 py-1 font-semibold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-normal font-sans shadow-sm whitespace-nowrap select-none ${sizeClasses[size]} ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <span className="leading-none">{text}</span>
    </span>
  );
}

