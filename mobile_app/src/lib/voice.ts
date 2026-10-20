import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { fleetApi } from '../api/fleetApi';
import { prepareSpeechText } from '../data/copilotBrain';

export const LANGS = [
  { code: 'en-IN', label: 'English (IN)' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'te-IN', label: 'తెలుగు' },
];

let player: AudioPlayer | null = null;
let token = 0;

export function stopSpeaking() {
  token++;
  try { player?.pause(); player?.remove(); } catch {}
  player = null;
  Speech.stop().catch?.(() => {});
}

/**
 * Speak a briefing. Cloud voice comes only from the VayuAI backend (/api/voice/synthesize),
 * which holds the Sarvam key server-side. If the backend is unreachable (or demo mode),
 * fall back to the phone's on-device TTS. No API keys live in the app.
 */
export async function speak(text: string, opts: { speaker: string; rate: number; lang: string; onStart?: (src: 'cloud' | 'device', durationMs: number) => void; onDone?: () => void }) {
  stopSpeaking();
  const my = ++token;
  const clean = prepareSpeechText(text);
  const done = () => { if (my === token) opts.onDone?.(); };
  try {
    const res = await fleetApi.synthesize(clean, opts.speaker);
    if (my !== token) return;
    if (res?.audio_base64) {
      await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      const p = createAudioPlayer({ uri: `data:audio/wav;base64,${res.audio_base64}` });
      player = p;
      p.setPlaybackRate?.(opts.rate);
      let started = false;
      p.addListener('playbackStatusUpdate', (s) => {
        if (!started && s.isLoaded) { started = true; opts.onStart?.('cloud', (s.duration || clean.length / 14) * 1000); }
        if (s.didJustFinish) done();
      });
      p.play();
      return;
    }
  } catch {
    // backend unreachable or demo mode → on-device voice
  }
  if (my !== token) return;
  opts.onStart?.('device', (clean.length / 14) * 1000 / opts.rate);
  Speech.speak(clean, {
    language: opts.lang.startsWith('en') ? 'en-IN' : opts.lang,
    rate: Platform.OS === 'android' ? opts.rate : opts.rate * 0.55,
    pitch: 1,
    onDone: done,
    onStopped: () => {},
    onError: done,
  });
}
