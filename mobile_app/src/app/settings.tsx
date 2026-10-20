import React, { useEffect, useState } from 'react';
import { Linking, Switch, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { VOICE_SPEAKERS } from '../data/copilotBrain';
import { C, F } from '../lib/theme';
import { useSettings } from '../lib/settings';
import { LANGS } from '../lib/voice';
import { Card, Divider, Eyebrow, Icon, IconName, Mono, Row, Screen, Seg, T, Tag, TopBar } from '../components/ui';
import { PersonaSheet } from '../components/PersonaSheet';

function Item({ icon, title, sub, right, onPress, mono }: { icon: IconName; title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; mono?: boolean }) {
  return (
    <Row style={{ paddingHorizontal: 16, paddingVertical: 13, gap: 16 }} onPress={onPress}>
      <Icon name={icon} size={20} color={C.mu} />
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 16, fontFamily: F.uiM }}>{title}</T>
        {sub ? (mono ? <Mono style={{ fontSize: 12.5, color: C.mu, fontFamily: F.mono, marginTop: 2 }}>{sub}</Mono> : <T style={{ fontSize: 13, color: C.mu, marginTop: 2 }}>{sub}</T>) : null}
      </View>
      {right}
    </Row>
  );
}

export default function Settings() {
  const { s, set } = useSettings();
  const qc = useQueryClient();
  const [url, setUrl] = useState(s.backendUrl);
  const [editing, setEditing] = useState(false);
  const [ping, setPing] = useState<{ ok: boolean; ms?: number } | null>(null);
  const [persona, setPersona] = useState(false);
  const sp = VOICE_SPEAKERS.find((v) => v.id === s.speaker) || VOICE_SPEAKERS[0];

  const check = async (u: string) => {
    setPing(null);
    const t0 = Date.now();
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 5000);
    try {
      const r = await fetch(`${u.replace(/\/+$/, '')}/api/fleet/readiness`, { signal: ctl.signal });
      setPing({ ok: r.ok, ms: Date.now() - t0 });
    } catch { setPing({ ok: false }); } finally { clearTimeout(to); }
  };
  useEffect(() => { check(s.backendUrl); }, [s.backendUrl]);
  const commit = () => { setEditing(false); if (url !== s.backendUrl) { set({ backendUrl: url.trim() }); qc.invalidateQueries(); } };
  const sw = (v: boolean, on: (v: boolean) => void, label: string) => (
    <Switch value={v} onValueChange={on} accessibilityLabel={label} trackColor={{ false: 'rgba(255,255,255,0.12)', true: C.ac }} thumbColor={v ? '#1B1203' : '#8B93A3'} />
  );

  return (
    <Screen>
      <TopBar back title="Settings" />
      <Card style={{ padding: 16, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <LinearGradient colors={['#FFC566', '#FF8A3D']} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shield-outline" size={24} color={C.onac} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <T style={{ fontSize: 18, fontFamily: F.uiS }}>No. 222 Tigersharks</T>
          <T style={{ fontSize: 13.5, color: C.mu, marginTop: 2 }}>AFS Thanjavur · Commander view</T>
        </View>
        <Icon name="chevron-right" size={20} color={C.fa} />
      </Card>

      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Appearance</Eyebrow>
      <Seg options={[{ key: 'day', label: '☼ Day' }, { key: 'night', label: '☾ Night' }, { key: 'system', label: 'System' }]} value={s.theme} onChange={(k) => set({ theme: k as any })} />
      {s.theme !== 'night' ? <T style={{ fontSize: 12, color: C.fa, marginTop: 6 }}>Day theme is coming soon; Night cockpit is used for now.</T> : null}

      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Data</Eyebrow>
      <Card>
        {editing ? (
          <View style={{ padding: 16, gap: 8 }}>
            <T style={{ fontSize: 13, color: C.mu }}>Backend URL</T>
            <TextInput autoFocus value={url} onChangeText={setUrl} onSubmitEditing={commit} onBlur={commit} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://your-backend.onrender.com" placeholderTextColor={C.fa}
              style={{ height: 46, borderRadius: 12, borderWidth: 1, borderColor: C.ac, paddingHorizontal: 12, color: C.tx, fontFamily: F.mono, fontSize: 14 }} />
            <T style={{ fontSize: 12, color: C.fa }}>The FastAPI server from the repo. Voice is synthesised there, so no keys live on the phone.</T>
          </View>
        ) : (
          <Item icon="server-network" title="Server" sub={s.backendUrl.replace(/^https?:\/\//, '')} mono onPress={() => setEditing(true)}
            right={ping == null ? <Tag tone="mu">CHECKING</Tag> : ping.ok ? <Tag tone="ok">{`${ping.ms} ms`}</Tag> : <Tag tone="bad">OFFLINE</Tag>} />
        )}
        <Divider style={{ marginLeft: 52 }} />
        <Item icon="cloud-off-outline" title="Offline demo mode" sub={s.demoMode ? 'Using bundled fleet data. Turn off to use the server (falls back to bundled data if unreachable).' : 'Using the server; bundled data is used if it is unreachable'}
          right={sw(s.demoMode, (v) => { set({ demoMode: v }); qc.invalidateQueries(); }, 'Offline demo mode')} />
      </Card>

      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Voice & motion</Eyebrow>
      <Card>
        <Item icon="account-voice" title="Briefing voice" sub={`${sp.name} · ${LANGS.find((l) => l.code === s.language)?.label} · ${s.speed}×`} onPress={() => setPersona(true)} right={<Icon name="chevron-right" size={20} color={C.fa} />} />
        <Divider style={{ marginLeft: 52 }} />
        <Item icon="motion-pause-outline" title="Reduce motion" sub="Shorter intro, static orb" right={sw(s.reduceMotion, (v) => set({ reduceMotion: v }), 'Reduce motion')} />
      </Card>

      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>About</Eyebrow>
      <Card>
        <Item icon="book-open-variant" title="Methodology & docs" onPress={() => Linking.openURL('https://github.com/Sudheesh02/air-power-fleet')} right={<Icon name="open-in-new" size={18} color={C.fa} />} />
        <Divider style={{ marginLeft: 52 }} />
        <Item icon="database-outline" title="NASA C-MAPSS dataset" sub="Turbofan degradation training data" onPress={() => Linking.openURL('https://data.nasa.gov/dataset/cmapss-jet-engine-simulated-data')} right={<Icon name="open-in-new" size={18} color={C.fa} />} />
        <Divider style={{ marginLeft: 52 }} />
        <Item icon="information-outline" title="Version" sub={`${Constants.expoConfig?.version || '1.0.0'} · SIH26249`} mono />
      </Card>
      <PersonaSheet visible={persona} onClose={() => setPersona(false)} />
    </Screen>
  );
}
