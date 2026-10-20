import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { VOICE_SPEAKERS } from '../data/copilotBrain';
import { C, F } from '../lib/theme';
import { LANGS, speak, stopSpeaking } from '../lib/voice';
import { useSettings } from '../lib/settings';
import { Btn, Chip, Disp, Eyebrow, Icon, IconBtn, Mono, Row, Sheet, T } from './ui';

export function PersonaSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { s, set } = useSettings();
  const [sel, setSel] = useState(s.speaker);
  const [lang, setLang] = useState(s.language);
  const [speed, setSpeed] = useState(s.speed);
  const [playing, setPlaying] = useState<string | null>(null);
  const p = VOICE_SPEAKERS.find((v) => v.id === sel) || VOICE_SPEAKERS[0];
  const sample = (id: string) => {
    if (playing === id) { stopSpeaking(); setPlaying(null); return; }
    const v = VOICE_SPEAKERS.find((x) => x.id === id)!;
    setPlaying(id);
    speak(`This is ${v.name}, ${v.role}. Fleet readiness is sixty five percent.`, { speaker: id, rate: speed, lang, onDone: () => setPlaying(null) });
  };
  return (
    <Sheet visible={visible} onClose={() => { stopSpeaking(); onClose(); }}>
      <Disp style={{ fontSize: 22 }}>Briefing voice</Disp>
      <T style={{ fontSize: 13, color: C.mu, marginTop: 4 }}>Tap the play button to hear a sample</T>
      <View style={{ gap: 8, marginTop: 16 }}>
        {VOICE_SPEAKERS.map((v, i) => {
          const on = v.id === sel;
          return (
            <Pressable key={v.id} onPress={() => setSel(v.id)} accessibilityState={{ selected: on }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? C.tintLine : C.line, backgroundColor: on ? C.tintSoft : C.s1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: i === 0 ? C.ac : C.s2, alignItems: 'center', justifyContent: 'center' }}>
                <T style={{ fontFamily: F.uiB, color: i === 0 ? C.onac : C.tx }}>{v.name.split(' ').pop()![0]}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: F.uiS, fontSize: 15 }}>{v.name}</T>
                <T style={{ fontSize: 12, color: C.mu, marginTop: 1 }} numberOfLines={1}>{v.role} · <Mono style={{ fontSize: 11.5, color: C.mu }}>{v.callsign}</Mono></T>
              </View>
              <IconBtn icon={playing === v.id ? 'stop' : 'play'} label={`Sample ${v.name}`} onPress={() => sample(v.id)} />
              {on ? <Icon name="check-circle" size={22} color={C.ac} /> : <View style={{ width: 22 }} />}
            </Pressable>
          );
        })}
      </View>
      <Eyebrow style={{ marginTop: 20, marginBottom: 10 }}>Language</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {LANGS.map((l) => <Chip key={l.code} label={l.label} on={l.code === lang} onPress={() => setLang(l.code)} />)}
      </ScrollView>
      <Row style={{ marginTop: 20 }}>
        <Eyebrow style={{ flex: 1 }}>Speed</Eyebrow>
        <Mono style={{ fontSize: 13 }}>{speed.toFixed(2).replace(/0$/, '')}×</Mono>
      </Row>
      <Row style={{ gap: 6, marginTop: 10 }}>
        {[0.8, 0.9, 1, 1.1, 1.25].map((x) => <View key={x} style={{ flex: 1 }}><Chip label={`${x}×`} on={speed === x} onPress={() => setSpeed(x)} /></View>)}
      </Row>
      <View style={{ flexDirection: 'row', marginTop: 22 }}>
        <Btn label={`Use ${p.name}`} onPress={() => { set({ speaker: sel, language: lang, speed }); stopSpeaking(); onClose(); }} />
      </View>
    </Sheet>
  );
}
