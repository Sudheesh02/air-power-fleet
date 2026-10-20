import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import { configureApi } from '../api/fleetApi';

export type Settings = {
  backendUrl: string;
  demoMode: boolean;
  speaker: string;
  language: string;
  speed: number;
  reduceMotion: boolean;
  theme: 'day' | 'night' | 'system';
};

const DEFAULTS: Settings = {
  backendUrl: 'https://vayuai-backend.onrender.com',
  demoMode: false,
  speaker: 'shubh',
  language: 'en-IN',
  speed: 1,
  reduceMotion: false,
  theme: 'night',
};

type Ctx = { s: Settings; set: (p: Partial<Settings>) => void; ready: boolean; systemReduceMotion: boolean };
const SettingsCtx = createContext<Ctx>({ s: DEFAULTS, set: () => {}, ready: false, systemReduceMotion: false });
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
  return <SettingsCtx.Provider value={{ s, set, ready, systemReduceMotion }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
export const useReducedMotion = () => {
  const { s, systemReduceMotion } = useSettings();
  return s.reduceMotion || systemReduceMotion;
};
