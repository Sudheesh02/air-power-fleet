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
