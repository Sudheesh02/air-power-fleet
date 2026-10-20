import { C } from './theme';
export const WO_STAGES = ['DISPATCHED', 'IN_PROGRESS', 'QA_CHECK', 'RESOLVED'] as const;
export const stageOf = (s: string) => (s === 'RESOLVED' ? 3 : s === 'QA_CHECK' ? 2 : s === 'IN_PROGRESS' ? 1 : 0);
export const groupOf = (s: string) => (s === 'RESOLVED' ? 'closed' : s === 'IN_PROGRESS' || s === 'QA_CHECK' ? 'progress' : 'open');
export const prio = (w: any) =>
  w.severity_label === 'CRITICAL_AOG' ? { label: 'CRITICAL', color: C.bad, tone: 'bad' as const }
  : w.severity_label === 'PREVENTIVE_ADVISORY' ? { label: 'HIGH', color: C.wa, tone: 'wa' as const }
  : { label: 'MEDIUM', color: C.info, tone: 'info' as const };
export const shortId = (id: string) => id.replace(/^WO-[A-Z]+-\d+-/, 'WO-').replace(/-AUTO$/, '');
export const techName = (t?: string) => (t ? t.replace(/\s*\(.*\)$/, '') : '');
export const initials = (t?: string) => techName(t).split(' ').filter((p) => /^[A-Z]/.test(p)).slice(-2).map((p) => p[0]).join('');
export const bayShort = (b?: string) => { const m = (b || '').match(/Bay\s*0?(\d+)/); return m ? `Bay ${m[1]}` : '—'; };
export const woTitle = (w: any) => {
  const f = String(w.fault_subsystem || '').replace(/\s*\(.*\)/, '');
  const a = String(w.action_required || '').replace(/^[A-Z ]+:\s*/, '');
  return a.split(/[.;]/)[0].slice(0, 80) || `${f} inspection`;
};
export const TECHS = ['Sqn Ldr R. Sharma', 'Flt Lt K. Patel', 'Sgt P. Nambiar', 'JWO A. Verma', 'Sgt M. Singh', 'WO D. Mukherjee'];
/** Parses "8.0h ago" / "Just now" (demo) or "YYYY-MM-DD HH:MM[:SS]" (live) into hours ago. */
export function hoursAgo(v?: string): number | null {
  const s = String(v || '');
  if (/just now/i.test(s)) return 0;
  const m = s.match(/([\d.]+)\s*h\s*ago/);
  if (m) return Number(m[1]);
  const t = Date.parse(s.replace(' ', 'T'));
  return Number.isNaN(t) ? null : Math.max(0, (Date.now() - t) / 3600000);
}
export function ago(v?: string) {
  const h = hoursAgo(v);
  if (h == null) return String(v || '');
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}
