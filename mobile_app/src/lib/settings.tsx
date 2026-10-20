import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { applyTheme, ThemeMode } from './theme';
import { configureApi } from '../api/fleetApi';

export type Settings = {
  backendUrl: string;
  demoMode: boolean;
  speaker: string;
  language: string;
  speed: number;
  reduceMotion: boolean;
  theme: 'day' | 'night' | 'system';
  unitName: string;
  role: string;
  unitBase: string;
};

const DEFAULTS: Settings = {
  backendUrl: 'https://vayuai-backend.onrender.com',
  demoMode: false,
  speaker: 'shubh',
  language: 'en-IN',
  speed: 1,
  reduceMotion: false,
  theme: 'night',
  unitName: '',
  role: 'Squadron Commander',
  unitBase: '',
};

type Ctx = { s: Settings; set: (p: Partial<Settings>) => void; ready: boolean; systemReduceMotion: boolean; mode: ThemeMode };
const SettingsCtx = createContext<Ctx>({ s: DEFAULTS, set: () => {}, ready: false, systemReduceMotion: false, mode: 'night' });
const KEY = 'vayu.settings.v2';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [systemReduceMotion, setSRM] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setS({ ...DEFAULTS, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
    AccessibilityInfo.isReduceMotionEnabled().then(setSRM).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSRM);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    configureApi({ baseUrl: s.backendUrl, demoMode: s.demoMode });
  }, [s.backendUrl, s.demoMode]);
  const set = (p: Partial<Settings>) =>
    setS((prev) => {
      const next = { ...prev, ...p };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  const sys = useColorScheme();
  const mode: ThemeMode = s.theme === 'system' ? (sys === 'light' ? 'day' : 'night') : s.theme;
  applyTheme(mode);
  return <SettingsCtx.Provider value={{ s, set, ready, systemReduceMotion, mode }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
export const useReducedMotion = () => {
  const { s, systemReduceMotion } = useSettings();
  return s.reduceMotion || systemReduceMotion;
};
/** Subscribe a screen to theme changes so its inline styles re-read the live palette. */
export const useThemeMode = () => useSettings().mode;
