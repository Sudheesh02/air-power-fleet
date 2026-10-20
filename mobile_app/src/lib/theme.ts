const NIGHT = {
  bg: '#06080C',
  s1: 'rgba(255,255,255,0.035)',
  s2: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.07)',
  line2: 'rgba(255,255,255,0.12)',
  tx: '#ECEFF4',
  mu: '#8B93A3',
  fa: '#5A6272',
  ac: '#FFB547',
  ac2: '#FF8A3D',
  ok: '#34D399',
  wa: '#FBBF24',
  bad: '#F87171',
  info: '#60A5FA',
  onac: '#1B1203',
  onbad: '#2A0A0A',
  sheet: '#11151D',
  nav: 'rgba(10,13,19,0.96)',
  card1: 'rgba(255,255,255,0.055)',
  card2: 'rgba(255,255,255,0.025)',
  track: 'rgba(255,255,255,0.08)',
  grid: 'rgba(255,255,255,0.05)',
  tick: 'rgba(255,255,255,0.18)',
  segOn: 'rgba(255,255,255,0.1)',
  handle: 'rgba(255,255,255,0.25)',
  scrim: 'rgba(0,0,0,0.55)',
  fade0: 'rgba(6,8,12,0)',
  fade1: 'rgba(6,8,12,0.94)',
  tint: 'rgba(255,181,71,0.14)',
  tintSoft: 'rgba(255,181,71,0.08)',
  tintLine: 'rgba(255,181,71,0.45)',
  heatLo: 'rgba(255,181,71,0.35)',
  okLine: 'rgba(52,211,153,0.4)',
  infoLine: 'rgba(96,165,250,0.5)',
  badLine: 'rgba(248,113,113,0.6)',
  g1: '#FFC566',
  g2: '#FFA930',
  glow: '#FFAA32',
  dot: '#FFFFFF',
  thumbOff: '#8B93A3',
  ambOp: 0.1,
  dark: true,
};
export type Palette = typeof NIGHT;
const DAY: Palette = {
  bg: '#F3F4F7',
  s1: 'rgba(15,23,42,0.035)',
  s2: '#FFFFFF',
  line: 'rgba(15,23,42,0.09)',
  line2: 'rgba(15,23,42,0.16)',
  tx: '#0E1420',
  mu: '#545E6F',
  fa: '#808999',
  ac: '#C25E00',
  ac2: '#B4480C',
  ok: '#047857',
  wa: '#A35B00',
  bad: '#C8261F',
  info: '#1D5FD6',
  onac: '#FFFFFF',
  onbad: '#FFFFFF',
  sheet: '#FFFFFF',
  nav: 'rgba(255,255,255,0.97)',
  card1: '#FFFFFF',
  card2: '#FCFCFD',
  track: 'rgba(15,23,42,0.08)',
  grid: 'rgba(15,23,42,0.07)',
  tick: 'rgba(15,23,42,0.2)',
  segOn: '#FFFFFF',
  handle: 'rgba(15,23,42,0.2)',
  scrim: 'rgba(15,23,42,0.35)',
  fade0: 'rgba(243,244,247,0)',
  fade1: 'rgba(243,244,247,0.94)',
  tint: 'rgba(194,94,0,0.10)',
  tintSoft: 'rgba(194,94,0,0.06)',
  tintLine: 'rgba(194,94,0,0.4)',
  heatLo: 'rgba(194,94,0,0.25)',
  okLine: 'rgba(4,120,87,0.35)',
  infoLine: 'rgba(29,95,214,0.4)',
  badLine: 'rgba(200,38,31,0.5)',
  g1: '#E8860C',
  g2: '#C95F00',
  glow: '#C95F00',
  dot: '#FFFFFF',
  thumbOff: '#FFFFFF',
  ambOp: 0.07,
  dark: false,
};
const TONE_BG = {
  night: { ok: 'rgba(52,211,153,0.12)', wa: 'rgba(251,191,36,0.12)', bad: 'rgba(248,113,113,0.13)', info: 'rgba(96,165,250,0.13)', mu: 'rgba(255,255,255,0.07)' },
  day: { ok: 'rgba(4,120,87,0.10)', wa: 'rgba(163,91,0,0.11)', bad: 'rgba(200,38,31,0.09)', info: 'rgba(29,95,214,0.09)', mu: 'rgba(15,23,42,0.06)' },
};

/** Live palette. Mutated in place by applyTheme so inline styles pick it up on re-render. */
export const C: Palette = { ...NIGHT };
export type ThemeMode = 'day' | 'night';
export let currentMode: ThemeMode = 'night';
export function applyTheme(m: ThemeMode) {
  if (m === currentMode) return;
  currentMode = m;
  Object.assign(C, m === 'day' ? DAY : NIGHT);
  Object.assign(toneBg, TONE_BG[m]);
}

export const F = {
  disp: 'SpaceGrotesk_600SemiBold',
  dispB: 'SpaceGrotesk_700Bold',
  dispM: 'SpaceGrotesk_500Medium',
  ui: 'Inter_400Regular',
  uiM: 'Inter_500Medium',
  uiS: 'Inter_600SemiBold',
  uiB: 'Inter_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoS: 'IBMPlexMono_600SemiBold',
};

export type Tone = 'ok' | 'wa' | 'bad' | 'info' | 'mu';
export const toneColor = (t: Tone) => (t === 'mu' ? C.mu : C[t]);
export const toneBg: Record<Tone, string> = { ...TONE_BG.night };

export const statusTone = (s?: string): Tone =>
  s === 'MISSION_CAPABLE' ? 'ok' : s === 'CONDITIONAL_STANDBY' ? 'wa' : s === 'MAINTENANCE_GROUNDED' ? 'bad' : 'mu';
export const statusLabel = (s?: string) =>
  s === 'MISSION_CAPABLE' ? 'CAPABLE' : s === 'CONDITIONAL_STANDBY' ? 'DEGRADED' : s === 'MAINTENANCE_GROUNDED' ? 'GROUNDED' : (s || '').replace(/_/g, ' ');
export const healthTone = (h: number): Tone => (h >= 75 ? 'ok' : h >= 60 ? 'wa' : 'bad');
export const shortType = (t?: string) => (t || '').split(' ')[0].replace('Su-30MKI', 'Su-30MKI');
export const sqnShort = (s?: string) => {
  const m = (s || '').match(/['"]([^'"]+)['"]/);
  return m ? m[1] : (s || '').replace(/^No\.\s*\d+\s*/, '');
};
export const baseShort = (b?: string) => (b || '').replace(/^AFS\s*/, '');
