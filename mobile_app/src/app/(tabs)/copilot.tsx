import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { VOICE_SPEAKERS } from '../../data/copilotBrain';
import { C, F } from '../../lib/theme';
import { useCopilot } from '../../lib/copilot';
import { useSettings, useThemeMode } from '../../lib/settings';
import { speak, stopSpeaking } from '../../lib/voice';
import { Backdrop, Card, Chip, Disp, Icon, Mono, Row, T, Tag } from '../../components/ui';
import { Rich } from '../../components/Rich';
import { PersonaSheet } from '../../components/PersonaSheet';

const STARTERS = ['What is our fleet readiness?', 'Why is SB-024 grounded?', 'Which parts are below safety stock?', 'Can KH-204 fly a 2 hour CAP?', 'Open work orders'];

export default function Copilot() {
  useThemeMode();
  const ins = useSafeAreaInsets();
  const { msgs, ask } = useCopilot();
  const { s } = useSettings();
  const [text, setText] = useState('');
  const [persona, setPersona] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const sp = VOICE_SPEAKERS.find((v) => v.id === s.speaker) || VOICE_SPEAKERS[0];
  const last = [...msgs].reverse().find((m) => m.role === 'ai');
  const sugg = last?.reply?.suggestions?.slice(0, 3) || STARTERS;
  const send = (q: string) => {
    if (!q.trim()) return;
    ask(q.trim());
    setText('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
  };
  const play = (id: string, t: string) => {
    if (playing === id) { stopSpeaking(); setPlaying(null); return; }
    setPlaying(id);
    speak(t, { speaker: s.speaker, rate: s.speed, lang: s.language, onDone: () => setPlaying(null) });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Backdrop />
      <Row style={{ paddingTop: ins.top + 4, paddingHorizontal: 20, height: ins.top + 72 }}>
        <Disp style={{ flex: 1, fontSize: 26 }}>Copilot</Disp>
        <Pressable onPress={() => setPersona(true)} accessibilityLabel="Change briefing voice" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingLeft: 6, paddingRight: 12, borderRadius: 20, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.ac, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontFamily: F.uiB, fontSize: 13, color: C.onac }}>{sp.name.split(' ').pop()![0]}</T></View>
          <T style={{ fontFamily: F.uiS, fontSize: 14 }}>{sp.name}</T>
          <Icon name="chevron-down" size={18} color={C.mu} />
        </Pressable>
      </Row>
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {!msgs.length ? (
          <View style={{ marginTop: 40 }}>
            <Row style={{ gap: 8 }}><Icon name="waveform" size={18} color={C.ac} /><T style={{ color: C.mu, fontSize: 13 }}>{sp.name.split(' ').pop()} · {sp.callsign}</T></Row>
            <Disp style={{ fontSize: 26, marginTop: 10, lineHeight: 32 }}>Ask about readiness, a tail, spares or a sortie.</Disp>
            <T style={{ color: C.mu, marginTop: 10, lineHeight: 21 }}>Answers come from live fleet data. Type below or tap the amber button to talk; any answer can be read aloud in your briefing voice.</T>
          </View>
        ) : msgs.map((m) => m.role === 'user' ? (
          <View key={m.id} style={{ alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: C.track, borderRadius: 22, borderBottomRightRadius: 6, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 }}>
            <T style={{ fontSize: 16, lineHeight: 23 }}>{m.text}</T>
          </View>
        ) : (
          <View key={m.id} style={{ marginTop: 18 }}>
            <Row style={{ gap: 8, marginBottom: 8 }}><Icon name="waveform" size={16} color={C.ac} /><T style={{ color: C.mu, fontSize: 13 }}>{sp.name.split(' ').pop()} · <Mono style={{ fontSize: 12, color: C.mu }}>{sp.callsign}</Mono></T>{m.reply?.live ? <Tag tone="ok">LIVE DATA</Tag> : null}</Row>
            {m.pending ? <Row style={{ gap: 10, paddingVertical: 6 }}><ActivityIndicator size="small" color={C.ac} /><T style={{ color: C.mu, fontSize: 14 }}>Checking live fleet data…</T></Row> : <Rich text={m.text} />}
            {m.reply?.formulaCard ? (
              <Card style={{ padding: 14, marginTop: 12, borderRadius: 18 }}>
                <T style={{ fontSize: 12, color: C.mu }}>{m.reply.formulaCard.title}</T>
                <Mono style={{ fontSize: 13.5, marginTop: 4, lineHeight: 20 }}>{m.reply.formulaCard.formula}</Mono>
              </Card>
            ) : null}
            {m.pending ? null : <Row style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Pressable onPress={() => play(m.id, m.reply?.spokenText || m.text)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: C.tintLine }} accessibilityLabel="Read aloud">
                <Icon name={playing === m.id ? 'stop' : 'play'} size={16} color={C.ac} />
                <T style={{ fontSize: 12.5, fontFamily: F.uiS, color: C.ac }}>{playing === m.id ? 'Stop' : 'Listen'}</T>
              </Pressable>
              <Chip label="Copy" icon="content-copy" onPress={() => Clipboard.setStringAsync(m.text)} />
              {(m.text.match(/\b(SB|KH|RB|IA|CB|ZD)-\d{3,4}\b/) || []).slice(0, 1).map((t) => <Chip key={t} label={`Open ${t}`} onPress={() => router.push(`/aircraft/${t}`)} />)}
            </Row>}
          </View>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}>
        {sugg.map((q) => <Chip key={q} label={q.length > 40 ? q.slice(0, 38) + '…' : q} onPress={() => send(q)} />)}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <Row style={{ minHeight: 60, borderRadius: 30, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, paddingLeft: 20, paddingRight: 6, gap: 8 }}>
          <TextInput value={text} onChangeText={setText} onSubmitEditing={() => send(text)} returnKeyType="send" placeholder="Ask about the fleet..." placeholderTextColor={C.mu} style={{ flex: 1, color: C.tx, fontFamily: F.ui, fontSize: 16, paddingVertical: 12 }} />
          {text ? null : <Pressable onPress={() => router.push('/voice')} hitSlop={8} accessibilityLabel="Dictate"><Icon name="microphone-outline" size={20} color={C.mu} /></Pressable>}
          <Pressable onPress={() => (text ? send(text) : router.push('/voice'))} accessibilityLabel={text ? 'Send' : 'Voice mode'} style={{ borderRadius: 24, overflow: 'hidden' }}>
            <LinearGradient colors={[C.g1, C.g2]} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={text ? 'arrow-up' : 'waveform'} size={22} color={C.onac} />
            </LinearGradient>
          </Pressable>
        </Row>
      </View>
      <PersonaSheet visible={persona} onClose={() => setPersona(false)} />
    </KeyboardAvoidingView>
  );
}
