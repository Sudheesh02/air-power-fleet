/**
 * Live Copilot: answers fleet questions from the backend's real data using intent matching.
 * No LLM and no keys on the device; methodology questions fall back to the bundled knowledge brain.
 */
import { fleetApi } from '../api/fleetApi';
import { queryVayuBrain, prepareSpeechText } from '../data/copilotBrain';

export type Reply = {
  displayText: string;
  spokenText: string;
  suggestions: string[];
  formulaCard?: { title: string; formula: string };
  live?: boolean;
  intent?: string;
};

const TAIL_RE = /\b([A-Z]{2})[\s-]?(\d{3,4})\b/i;
const pct = (n: number) => `${Math.round(n)}%`;
const hrs = (n: number) => `${Number(n).toFixed(n < 10 ? 1 : 0)} h`;
const statusWord = (s?: string) =>
  s === 'MISSION_CAPABLE' ? 'mission capable' : s === 'CONDITIONAL_STANDBY' ? 'on conditional standby' : s === 'MAINTENANCE_GROUNDED' ? 'grounded for maintenance' : (s || 'unknown').toLowerCase().replace(/_/g, ' ');
const short = (t?: string) => (t || '').split(' ').slice(0, 2).join(' ');
const sqn = (s?: string) => { const m = (s || '').match(/['"]([^'"]+)['"]/); return m ? m[1] : s || ''; };
const base = (b?: string) => (b || '').replace(/^AFS\s*/, '');
const has = (q: string, ...w: (string | RegExp)[]) => w.some((x) => (typeof x === 'string' ? q.includes(x) : x.test(q)));

const SORTIES: [RegExp, string][] = [
  [/\bcap\b|combat air patrol|patrol/, 'Combat Air Patrol (CAP)'],
  [/intercept/, 'Tactical Intercept'],
  [/recce|recon/, 'Reconnaissance'],
  [/training|practice/, 'Combat Training'],
];

function reply(lines: string[], spoken: string, suggestions: string[], live: boolean, intent: string): Reply {
  return { displayText: lines.join('\n'), spokenText: prepareSpeechText(spoken), suggestions, live, intent };
}

async function aircraftList() {
  const r: any = await fleetApi.getFleetAircraft();
  return { list: (r.data || []) as any[], live: !!r.isLive };
}

function findTail(q: string, list: any[]) {
  const m = q.match(TAIL_RE);
  if (!m) return null;
  const tail = `${m[1].toUpperCase()}-${m[2]}`;
  return list.find((a) => a.tail_no === tail) ? tail : null;
}

function findBase(q: string, list: any[]) {
  const bases = Array.from(new Set(list.map((a) => a.base_station))) as string[];
  return bases.find((b) => q.includes(base(b).toLowerCase())) || null;
}

async function readiness(scopeBase: string | null): Promise<Reply> {
  const [{ list, live }, r]: [{ list: any[]; live: boolean }, any] = await Promise.all([aircraftList(), fleetApi.getFleetReadiness()]);
  const rd = r.data || {};
  const scoped = scopeBase ? list.filter((a) => a.base_station === scopeBase) : list;
  const mc = scoped.filter((a) => a.status === 'MISSION_CAPABLE').length;
  const deg = scoped.filter((a) => a.status === 'CONDITIONAL_STANDBY');
  const gr = scoped.filter((a) => a.status === 'MAINTENANCE_GROUNDED');
  const total = scoped.length || rd.total_aircraft || 0;
  const rate = total ? (mc / total) * 100 : rd.mission_capable_rate_pct || 0;
  const target = rd.target_mc_rate_pct || 75;
  const where = scopeBase ? `at ${scopeBase}` : 'across the fleet';
  const gap = rate >= target ? `above the ${target}% target` : `${Math.round(target - rate)} points under the ${target}% target`;
  const lines = [
    `${mc} of ${total} aircraft are mission capable ${where}, a ${pct(rate)} MC rate, ${gap}.`,
    '',
    'Breakdown:',
    `• Capable: ${mc}`,
    `• Degraded: ${deg.length}${deg.length ? ` (${deg.map((a) => a.tail_no).join(', ')})` : ''}`,
    `• Grounded: ${gr.length}${gr.length ? ` (${gr.map((a) => a.tail_no).join(', ')})` : ''}`,
  ];
  if (!scopeBase && rd.active_depot_requisitions != null) lines.push(`• Depot requisitions open: ${rd.active_depot_requisitions}`);
  const worst = [...scoped].sort((a, b) => a.health_score - b.health_score)[0];
  if (worst) lines.push('', `Lowest health is ${worst.tail_no} (${short(worst.aircraft_type)}) at ${pct(worst.health_score)}.`);
  const spoken = `${mc} of ${total} aircraft are mission capable ${where}, ${Math.round(rate)} percent, ${gap}. ${gr.length} grounded and ${deg.length} degraded.${worst ? ` Lowest health is ${worst.tail_no}.` : ''}`;
  return reply(lines, spoken, [worst ? `Why is ${worst.tail_no} grounded?` : 'Show work orders', 'Which parts are below safety stock?', 'Open work orders'], live, 'readiness');
}

async function tailStatus(tail: string, q: string): Promise<Reply> {
  const r: any = await fleetApi.getAircraftDigitalTwin(tail);
  const t = r.data || {};
  const p = t.prognostics || {};
  const stages = Object.values(t.stages || {}) as any[];
  const weak = [...stages].sort((a, b) => a.health_pct - b.health_pct)[0];
  const sortie = SORTIES.find(([re]) => re.test(q));
  if (sortie || has(q, 'sortie', 'clear', 'fly', 'mission', 'go/no', 'go or no')) return sortieCheck(tail, sortie ? sortie[1] : 'Combat Air Patrol (CAP)', q);
  const lines = [
    `${tail} is ${statusWord(t.status)}. It's a ${short(t.aircraft_type)} with ${sqn(t.squadron)} at ${base(t.base_station)}.`,
    '',
    'Health:',
    `• Overall: ${pct(t.overall_health_pct)}`,
    `• Predicted RUL: ${hrs(p.predicted_rul_hours)} (conservative ${hrs(p.conservative_rul_hours)})`,
    weak ? `• Weakest stage: ${weak.name} at ${pct(weak.health_pct)}` : '',
    t.wear_mode ? `• Wear mode: ${t.wear_mode}` : '',
    `• Airframe hours: ${Math.round(t.airframe_hours || 0)}`,
  ].filter((x) => x !== '');
  const wo: any = await fleetApi.getWorkOrders();
  const order = (wo.data || []).find((w: any) => w.tail_no === tail && w.status !== 'COMPLETED');
  if (order) lines.push('', `Work order ${order.order_id} is ${order.status.toLowerCase().replace(/_/g, ' ')}: ${order.action_required}`);
  const why = t.status === 'MAINTENANCE_GROUNDED' && weak ? ` It is grounded because the ${weak.name} is at ${Math.round(weak.health_pct)} percent.` : '';
  const spoken = `${tail} is ${statusWord(t.status)}, overall health ${Math.round(t.overall_health_pct)} percent, conservative remaining life ${Math.round(p.conservative_rul_hours)} hours.${why}`;
  return reply(lines, spoken, [`Can ${tail} fly a 2 hour CAP?`, 'Fleet readiness', 'Which parts are below safety stock?'], !!r.isLive, 'tail');
}

async function sortieCheck(tail: string, type: string, q: string): Promise<Reply> {
  const dm = q.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour)/);
  const dur = dm ? Math.min(12, Number(dm[1])) : 2;
  const r: any = await fleetApi.evaluateSortie(tail, type, dur);
  const d = r.data || {};
  const go = d.decision === 'MISSION_GO';
  const verdict = go ? 'GO' : d.decision === 'NO_GO' ? 'NO-GO' : (d.decision || 'review').replace(/_/g, ' ');
  const ps = d.prognostic_state || {};
  const lines = [
    `${verdict} for ${tail}: ${type}, ${dur} h.`,
    '',
    'Margin:',
    `• Required: ${hrs(d.mission_requested?.required_margin_hours ?? dur)}`,
    `• Conservative RUL: ${hrs(ps.conservative_rul_hours ?? 0)}`,
    `• Clearance: ${(d.clearance_code || '').replace(/_/g, ' ').toLowerCase()}`,
    ...((d.reasons || []).slice(0, 2).map((x: string) => `• ${x}`)),
    ...((d.recommendations || []).slice(0, 1).map((x: string) => `• Advice: ${x}`)),
  ];
  const spoken = `${verdict.replace('-', ' ')} for ${tail} on a ${dur} hour ${type.replace(/\(.*\)/, '')}. ${(d.reasons || [])[0] || ''}`;
  return reply(lines, spoken, [`Status of ${tail}`, 'Fleet readiness', 'Open work orders'], !!r.isLive, 'sortie');
}

async function workOrders(tail: string | null): Promise<Reply> {
  const r: any = await fleetApi.getWorkOrders();
  let all = (r.data || []) as any[];
  if (tail) all = all.filter((w) => w.tail_no === tail);
  const open = all.filter((w) => w.status !== 'COMPLETED');
  const aog = open.filter((w) => /AOG|CRITICAL/.test(w.severity_label || ''));
  const by = (s: string) => open.filter((w) => w.status === s).length;
  const lines = [
    open.length ? `${open.length} open work order${open.length > 1 ? 's' : ''}${tail ? ` on ${tail}` : ''}, ${aog.length} critical.` : `No open work orders${tail ? ` on ${tail}` : ''}.`,
  ];
  if (open.length) {
    lines.push('', 'By status:', `• In progress: ${by('IN_PROGRESS')}`, `• Pending: ${open.length - by('IN_PROGRESS')}`, '', 'Top priority:');
    [...open].sort((a, b) => (b.severity_tier || 0) - (a.severity_tier || 0)).slice(0, 3).forEach((w) =>
      lines.push(`• ${w.tail_no}: ${w.fault_subsystem}, ${(w.severity_label || '').replace(/_/g, ' ').toLowerCase()}, ${w.status.replace(/_/g, ' ').toLowerCase()}`));
  }
  const top = open.sort((a, b) => (b.severity_tier || 0) - (a.severity_tier || 0))[0];
  const spoken = open.length ? `${open.length} open work orders, ${aog.length} critical.${top ? ` Highest priority is ${top.tail_no}, ${top.fault_subsystem}.` : ''}` : 'There are no open work orders.';
  return reply(lines, spoken, [top ? `Status of ${top.tail_no}` : 'Fleet readiness', 'Which parts are below safety stock?', 'Fleet readiness'], !!r.isLive, 'workorders');
}

async function inventory(q: string, scopeBase: string | null): Promise<Reply> {
  const r: any = await fleetApi.getLogisticsInventory();
  let spares = (r.data?.base_spares || []) as any[];
  if (scopeBase) spares = spares.filter((s) => s.base_station === scopeBase);
  const words = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3 && !['parts', 'part', 'stock', 'spares', 'spare', 'inventory', 'what', 'which', 'have', 'many', 'below', 'safety', 'level', 'status', 'there', 'about'].includes(w));
  const match = words.length ? spares.filter((s) => words.some((w) => `${s.component_name} ${s.subsystem} ${s.part_number}`.toLowerCase().includes(w))) : [];
  if (match.length) {
    const lines = [`Found ${match.length} matching line${match.length > 1 ? 's' : ''}:`, ...match.slice(0, 5).map((s) => `• ${s.component_name} at ${base(s.base_station)}: ${s.quantity_on_hand} on hand (safety ${s.safety_stock_threshold}), ${s.location_bin}`)];
    const s0 = match[0];
    return reply(lines, `${s0.component_name} at ${base(s0.base_station)}: ${s0.quantity_on_hand} on hand against a safety stock of ${s0.safety_stock_threshold}.`, ['Which parts are below safety stock?', 'Depot pipeline status', 'Fleet readiness'], !!r.isLive, 'parts');
  }
  const low = spares.filter((s) => s.quantity_on_hand < s.safety_stock_threshold);
  const out = low.filter((s) => s.quantity_on_hand === 0);
  const lines = [
    `${spares.length} stock lines tracked${scopeBase ? ` at ${scopeBase}` : ''}. ${low.length} are below safety stock, ${out.length} at zero.`,
  ];
  if (low.length) lines.push('', 'Below safety stock:', ...low.slice(0, 6).map((s) => `• ${s.component_name} (${base(s.base_station)}): ${s.quantity_on_hand}/${s.safety_stock_threshold}`));
  const spoken = `${low.length} stock lines are below safety level, ${out.length} of them at zero.${low[0] ? ` Most urgent is ${low[0].component_name} at ${base(low[0].base_station)}.` : ''}`;
  return reply(lines, spoken, ['Depot pipeline status', 'Open work orders', 'Fleet readiness'], !!r.isLive, 'parts');
}

async function pipeline(): Promise<Reply> {
  const r: any = await fleetApi.getLogisticsInventory();
  const p = (r.data?.depot_pipeline || []) as any[];
  const aog = p.filter((x) => /AOG/.test(x.priority || ''));
  const lines = [`${p.length} depot requisition${p.length === 1 ? '' : 's'} in the pipeline, ${aog.length} AOG.`, ...(p.length ? ['', 'Shipments:'] : []), ...p.slice(0, 5).map((x) => `• ${x.req_id} for ${x.tail_no}: ${x.component_name}, ${(x.status || '').replace(/_/g, ' ').toLowerCase()}${x.eta_hours != null ? `, ETA ${x.eta_hours} h` : ''}`)];
  const soon = [...p].filter((x) => x.eta_hours != null).sort((a, b) => a.eta_hours - b.eta_hours)[0];
  const spoken = `${p.length} depot requisitions in the pipeline, ${aog.length} aircraft on ground priority.${soon ? ` Next arrival is for ${soon.tail_no} in ${soon.eta_hours} hours.` : ''}`;
  return reply(lines, spoken, ['Which parts are below safety stock?', 'Open work orders', 'Fleet readiness'], !!r.isLive, 'logistics');
}

async function ranking(q: string, scopeBase: string | null): Promise<Reply> {
  const { list, live } = await aircraftList();
  const scoped = scopeBase ? list.filter((a) => a.base_station === scopeBase) : list;
  const best = has(q, 'best', 'healthiest', 'strongest', 'most ready');
  const sorted = [...scoped].sort((a, b) => (best ? b.health_score - a.health_score : a.health_score - b.health_score)).slice(0, 5);
  const lines = [`${best ? 'Healthiest' : 'Lowest health'} aircraft${scopeBase ? ` at ${scopeBase}` : ''}:`, ...sorted.map((a) => `• ${a.tail_no} (${short(a.aircraft_type)}): ${pct(a.health_score)}, RUL ${hrs(a.conservative_rul_hours)}, ${statusWord(a.status)}`)];
  const a = sorted[0];
  return reply(lines, a ? `${best ? 'Healthiest' : 'Most at risk'} is ${a.tail_no} at ${Math.round(a.health_score)} percent health.` : 'No aircraft found.', a ? [`Status of ${a.tail_no}`, 'Fleet readiness', 'Open work orders'] : ['Fleet readiness'], live, 'ranking');
}

const FALLBACK = ['Fleet readiness', 'Open work orders', 'Which parts are below safety stock?', 'Can SB-024 fly a 2 hour CAP?'];

export async function answer(prompt: string): Promise<Reply> {
  const q = (prompt || '').toLowerCase().trim();
  try {
    const { list } = await aircraftList();
    const tail = findTail(prompt, list);
    const scopeBase = findBase(q, list);
    // Methodology / how-it-works questions use the bundled knowledge brain.
    if (has(q, 'how does', 'how do you', 'explain', 'conformal', 'formula', 'methodology', 'c-mapss', 'cmapss', 'algorithm', 'model work')) {
      const b = queryVayuBrain(prompt);
      return { ...b, live: false, intent: 'method' };
    }
    if (has(q, 'work order', 'workorder', 'job card', 'maintenance task', 'hangar', 'technician', /\bwos?\b/)) return workOrders(tail);
    if (tail) return tailStatus(tail, q);
    if (has(q, 'sortie', 'clear', 'can fly', 'ready to fly')) {
      const { list: l } = await aircraftList();
      const ok = l.filter((a) => a.status === 'MISSION_CAPABLE').sort((a, b) => b.conservative_rul_hours - a.conservative_rul_hours).slice(0, 4);
      return reply(['For a sortie clearance, name a tail, e.g. "Can SB-024 fly a 2 hour CAP?"', '', 'Best candidates right now:', ...ok.map((a) => `• ${a.tail_no} (${short(a.aircraft_type)}): RUL ${hrs(a.conservative_rul_hours)}`)],
        `Name a tail number for a clearance check. Best candidates are ${ok.slice(0, 3).map((a) => a.tail_no).join(', ')}.`, ok.slice(0, 3).map((a) => `Can ${a.tail_no} fly a 2 hour CAP?`), true, 'sortie');
    }
    if (has(q, 'depot', 'pipeline', 'requisition', 'shipment', 'transit', 'eta', 'logistic', 'delivery')) return pipeline();
    if (has(q, 'part', 'stock', 'spare', 'inventory', 'bin', 'shortage', 'lru')) return inventory(q, scopeBase);
    if (has(q, 'worst', 'lowest', 'at risk', 'riskiest', 'best', 'healthiest', 'weakest')) return ranking(q, scopeBase);
    if (has(q, 'ready', 'readiness', 'mc rate', 'mission capable', 'status', 'overview', 'summary', 'brief', 'fleet', 'grounded', 'how many', 'aircraft')) return readiness(scopeBase);
    const m = prompt.match(TAIL_RE);
    if (m) return reply([`I couldn't find ${m[1].toUpperCase()}-${m[2]} in the fleet.`, '', 'Tails on record include:', `• ${list.slice(0, 6).map((a) => a.tail_no).join(', ')}`], `I couldn't find that tail number in the fleet.`, list.slice(0, 3).map((a) => `Status of ${a.tail_no}`), true, 'unknown');
    return reply(["I can answer from live fleet data. Try asking about:", '• Readiness: "What is our readiness at Thanjavur?"', '• A tail: "Why is SB-024 grounded?"', '• Sorties: "Can KH-204 fly a 2 hour CAP?"', '• Work orders, spares, or the depot pipeline'],
      "I didn't catch a fleet question there. Ask about readiness, a tail number, a sortie, work orders, or spares.", FALLBACK, true, 'unknown');
  } catch {
    return reply(["I couldn't reach fleet data just now. Check the connection in Settings and try again."], "I couldn't reach fleet data just now.", FALLBACK, false, 'error');
  }
}
