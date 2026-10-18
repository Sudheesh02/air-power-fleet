import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || '').toUpperCase().trim();

  let text = 'Unknown';
  let bgClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  let dotClass = 'bg-slate-400';

  if (norm === 'MISSION_CAPABLE' || norm === 'MISSION READY') {
    text = 'Mission Ready';
    bgClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 dark:bg-emerald-500/10';
    dotClass = 'bg-emerald-400';
  } else if (norm === 'CONDITIONAL_STANDBY' || norm === 'PREDICTIVE MAINTENANCE SCHEDULED' || norm === 'PREDICTIVE MAINT SCHEDULED') {
    text = 'Maintenance Scheduled';
    bgClass = 'bg-amber-500/10 text-amber-200/90 border-amber-500/25 dark:bg-amber-500/10';
    dotClass = 'bg-amber-400';
  } else if (norm === 'MAINTENANCE_GROUNDED' || norm === 'CRITICAL ALERT') {
    text = 'Grounded';
    bgClass = 'bg-red-500/10 text-red-300 border-red-500/25 dark:bg-red-950/30';
    dotClass = 'bg-red-400';
  } else if (norm === 'CRITICAL' || norm === 'CRITICAL_AOG' || norm === 'AOG EXHAUSTED') {
    text = 'Critical';
    bgClass = 'bg-red-500/10 text-red-300 border-red-500/25 dark:bg-red-950/30';
    dotClass = 'bg-red-400';
  } else if (norm === 'CAUTION' || norm === 'WARNING' || norm === 'SAFETY WARNING') {
    text = 'Advisory';
    bgClass = 'bg-amber-500/10 text-amber-200/90 border-amber-500/25 dark:bg-amber-500/10';
    dotClass = 'bg-amber-400';
  } else if (norm.includes('CAPABLE') || norm === 'READY' || norm === 'NOMINAL' || norm === 'MISSION_GO' || norm === 'OPTIMAL' || norm === 'RESOLVED' || norm === 'HEALTHY') {
    text = norm === 'HEALTHY' ? 'Healthy' : norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 dark:bg-emerald-500/10';
    dotClass = 'bg-emerald-400';
  } else if (norm.includes('STANDBY') || norm === 'CONDITIONAL_GO' || norm === 'DISPATCHED' || norm === 'PREVENTIVE_ADVISORY') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-amber-500/10 text-amber-200/90 border-amber-500/25 dark:bg-amber-500/10';
    dotClass = 'bg-amber-400';
  } else if (norm.includes('GROUNDED') || norm === 'NO_GO' || norm === 'AWAITING_SPARES') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-red-500/10 text-red-300 border-red-500/25 dark:bg-red-950/30';
    dotClass = 'bg-red-400';
  } else if (norm === 'IN_TRANSIT' || norm === 'IN_PROGRESS') {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    bgClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25 dark:bg-cyan-500/10';
    dotClass = 'bg-cyan-400';
  } else {
    text = norm.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-medium',
    lg: 'text-xs px-3 py-1 font-semibold',
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

