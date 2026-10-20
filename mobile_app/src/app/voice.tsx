import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';
import { VOICE_SPEAKERS } from '../data/copilotBrain';
import { C, F } from '../lib/theme';
import { useSettings } from '../lib/settings';
import { useCopilot } from '../lib/copilot';
import { LANGS, speak, stopSpeaking } from '../lib/voice';
import { Backdrop, Chip, Disp, Icon, IconBtn, Row, T } from '../components/ui';
import { Orb, Wave } from '../components/Orb';
import { PersonaSheet } from '../components/PersonaSheet';

type Phase = 'listening' | 'thinking' | 'speaking' | 'idle' | 'error';
const STEPS = ['Read fleet readiness', 'Checked RUL and open work orders', 'Composing briefing'];

export default function Voice() {
  const ins = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const { s } = useSettings();
  const { ask } = useCopilot();
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [persona, setPersona] = useState(false);
  const [src, setSrc] = useState<'cloud' | 'device'>('device');
  const level = useSharedValue(0.25);
  const progress = useSharedValue(0);
  const [prog, setProg] = useState(0);
  const finalRef = useRef('');
  const sp = VOICE_SPEAKERS.find((v) => v.id === s.speaker) || VOICE_SPEAKERS[0];
  const langLabel = LANGS.find((l) => l.code === s.language)?.label || 'English (IN)';

  const startListening = async () => {
    stopSpeaking();
    setErr(''); setHeard(''); finalRef.current = '';
    try {
      if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) throw new Error('Speech recognition is not available on this device.');
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) throw new Error('Microphone permission is needed to talk to the copilot.');
      setPhase('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      ExpoSpeechRecognitionModule.start({ lang: s.language, interimResults: true, continuous: false, volumeChangeEventOptions: { enabled: true, intervalMillis: 90 } });
    } catch (e: any) {
      setErr(e?.message || 'Could not start listening.');
      setPhase('error');
    }
  };

  const think = (q: string) => {
    setHeard(q);
    setPhase('thinking');
    setStep(0);
    const reply = ask(q).reply!;
    let k = 0;
    const iv = setInterval(() => {
      k++; setStep(k);
      if (k >= STEPS.length) {
        clearInterval(iv);
        setAnswer(reply.spokenText);
        setPhase('speaking');
        setProg(0);
        speak(reply.spokenText, {
          speaker: s.speaker, rate: s.speed, lang: s.language,
          onStart: (source, ms) => { setSrc(source); progress.value = 0; progress.value = withTiming(1, { duration: ms }); const t0 = Date.now(); const pi = setInterval(() => { const f = Math.min(1, (Date.now() - t0) / ms); setProg(f); if (f >= 1) clearInterval(pi); }, 250); },
          onDone: () => { setProg(1); setPhase('idle'); },
        });
      }
    }, 800);
  };

  useSpeechRecognitionEvent('result', (e) => {
    const t = e.results?.[0]?.transcript || '';
    setHeard(t);
    if (e.isFinal) finalRef.current = t;
  });
  useSpeechRecognitionEvent('volumechange', (e) => { level.value = withTiming(Math.max(0.1, Math.min(1, (e.value + 2) / 12)), { duration: 90 }); });
  useSpeechRecognitionEvent('end', () => {
    const q = finalRef.current || '';
    if (q) think(q);
    else setPhase((p) => (p === 'listening' ? 'idle' : p));
  });
  useSpeechRecognitionEvent('error', (e) => {
    if (e.error === 'aborted') return;
    setErr(e.error === 'no-speech' ? "Didn't catch that. Tap the mic and try again." : e.error === 'not-allowed' ? 'Microphone access was denied.' : 'Voice input is unavailable right now. Pick a question below or type instead.');
    setPhase('error');
  });

  useEffect(() => {
    if (params.q) think(String(params.q)); else startListening();
    return () => { stopSpeaking(); try { ExpoSpeechRecognitionModule.abort(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => { stopSpeaking(); try { ExpoSpeechRecognitionModule.abort(); } catch {} router.back(); };
  const label = phase === 'listening' ? 'Listening' : phase === 'thinking' ? 'Thinking' : phase === 'speaking' ? 'Speaking' : 'Ready';
  const dot = phase === 'listening' ? C.info : phase === 'thinking' || phase === 'speaking' ? C.ac : C.mu;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      <Row style={{ paddingTop: ins.top + 8, paddingHorizontal: 20, height: ins.top + 64 }}>
        <View style={{ width: 40 }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Row style={{ gap: 6 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} /><T style={{ fontFamily: F.uiS, fontSize: 14 }}>{label}</T></Row>
          <T style={{ fontSize: 12, color: C.mu, marginTop: 2 }}>{sp.name} · {langLabel}</T>
        </View>
        <IconBtn ghost icon="tune-variant" label="Voice and language" onPress={() => setPersona(true)} />
      </Row>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {phase === 'speaking' || (phase === 'idle' && answer) ? (
          <View style={{ flex: 1, paddingTop: 12 }}>
            <Row style={{ gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.ac, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontFamily: F.uiB, color: C.onac, fontSize: 17 }}>{sp.name.split(' ').pop()![0]}</T></View>
              <View><T style={{ fontFamily: F.uiS, fontSize: 16 }}>{sp.name}</T><T style={{ fontSize: 12.5, color: C.mu }}>{sp.role}</T></View>
            </Row>
            <View style={{ marginTop: 18 }}><Wave color={C.ok} bars={44} active={phase === 'speaking'} height={64} /></View>
            <T style={{ fontSize: 21, lineHeight: 30, fontFamily: F.uiM, marginTop: 18 }}>
              <T style={{ fontSize: 21, lineHeight: 30, fontFamily: F.uiM }}>{answer.slice(0, Math.ceil(answer.length * prog))}</T>
              <T style={{ fontSize: 21, lineHeight: 30, fontFamily: F.uiM, color: C.fa }}>{answer.slice(Math.ceil(answer.length * prog))}</T>
            </T>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 18 }}><View style={{ width: `${prog * 100}%`, height: 3, borderRadius: 2, backgroundColor: C.ok }} /></View>
            <Row style={{ gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {(answer.match(/\b(SB|KH|RB|IA)-\d{3,4}\b/) || []).slice(0, 1).map((t) => <Chip key={t} label={`Open ${t}`} icon="airplane" onPress={() => { stopSpeaking(); router.replace(`/aircraft/${t}`); }} />)}
              <Chip label="Work orders" icon="wrench-outline" onPress={() => { stopSpeaking(); router.replace('/orders'); }} />
              <Chip label="Full answer" icon="text-long" onPress={() => { stopSpeaking(); router.replace('/copilot'); }} />
            </Row>
            <T style={{ fontSize: 11.5, color: C.fa, marginTop: 14 }}>{src === 'cloud' ? 'Voice generated by the VayuAI server. No keys are stored on this phone.' : 'On-device voice (backend voice unavailable in demo mode). No keys are stored on this phone.'}</T>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Orb tone={phase === 'thinking' ? 'amber' : 'blue'} size={250} level={phase === 'listening' ? level : undefined} orbit={phase === 'thinking'} />
            {phase === 'listening' ? <View style={{ marginTop: -12 }}><Wave color={C.info} level={level} height={56} /></View> : <View style={{ height: 44 }} />}
            <T style={{ fontSize: 22, lineHeight: 30, fontFamily: F.uiM, textAlign: 'center', marginTop: 18, color: phase === 'thinking' ? C.mu : C.tx }}>
              {heard ? `“${heard}”` : phase === 'listening' ? 'Go ahead, I’m listening…' : phase === 'error' ? err : 'Tap the mic to ask'}
            </T>
            {phase === 'listening' ? <Row style={{ gap: 6, marginTop: 12 }}><Icon name="lock-outline" size={13} color={C.fa} /><T style={{ fontSize: 12, color: C.fa }}>Speech is recognised on the device</T></Row> : null}
            {phase === 'thinking' ? (
              <View style={{ marginTop: 26, gap: 12, alignItems: 'flex-start' }}>
                {STEPS.map((st, i) => (
                  <Row key={st} style={{ gap: 10 }}>
                    {i < step ? <Icon name="check" size={16} color={C.ok} /> : i === step ? <ActivityIndicator size="small" color={C.ac} style={{ width: 16 }} /> : <View style={{ width: 16 }} />}
                    <T style={{ fontSize: 14, color: i < step ? C.fa : i === step ? C.tx : C.fa }}>{st}</T>
                  </Row>
                ))}
              </View>
            ) : null}
            {phase === 'error' || phase === 'idle' ? (
              <View style={{ marginTop: 22, gap: 8, alignItems: 'center' }}>
                {['Brief me on fleet readiness', 'Why is SB-024 grounded?', 'Spares at risk this week'].map((q) => <Chip key={q} label={q} onPress={() => think(q)} />)}
              </View>
            ) : null}
          </View>
        )}
      </View>

      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 44, paddingBottom: ins.bottom + 28, paddingTop: 12 }}>
        <IconBtn icon="keyboard-outline" label="Type instead" onPress={() => { stopSpeaking(); router.replace('/copilot'); }} />
        <Pressable
          accessibilityLabel={phase === 'listening' ? 'Stop listening' : 'Start listening'}
          onPress={() => (phase === 'listening' ? ExpoSpeechRecognitionModule.stop() : startListening())}
          style={{ width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: phase === 'listening' ? 'rgba(96,165,250,0.6)' : 'rgba(255,181,71,0.6)', backgroundColor: phase === 'listening' ? 'rgba(96,165,250,0.12)' : 'rgba(255,181,71,0.14)' }}
        >
          <Icon name={phase === 'listening' ? 'stop' : 'microphone'} size={28} color={phase === 'listening' ? C.info : C.ac} />
        </Pressable>
        <IconBtn icon="close" color={C.bad} label="Close voice" onPress={close} />
      </Row>
      {phase === 'speaking' ? <T style={{ position: 'absolute', bottom: ins.bottom + 8, alignSelf: 'center', fontSize: 11.5, color: C.fa }}>Tap the mic to interrupt</T> : null}
      <PersonaSheet visible={persona} onClose={() => setPersona(false)} />
    </View>
  );
}
