export const C = {
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
  sheet: '#11151D',
  nav: 'rgba(10,13,19,0.96)',
};

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
export const toneBg: Record<Tone, string> = {
  ok: 'rgba(52,211,153,0.12)',
  wa: 'rgba(251,191,36,0.12)',
  bad: 'rgba(248,113,113,0.13)',
  info: 'rgba(96,165,250,0.13)',
  mu: 'rgba(255,255,255,0.07)',
};

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
