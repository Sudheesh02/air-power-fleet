import { useThemeMode } from '../../lib/settings';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, baseShort, healthTone, sqnShort, statusLabel, statusTone, toneColor } from '../../lib/theme';
import { Backdrop, Card, Chip, Divider, Eyebrow, Icon, IconBtn, Loading, Mono, Ring, Row, StackBar, T, Tag, TopBar } from '../../components/ui';
import { fleetCounts, useAircraft } from '../../lib/queries';

const TYPES = ['Su-30MKI', 'Tejas', 'Rafale', 'C-17', 'ALH'];
const RISK: Record<string, number> = { MAINTENANCE_GROUNDED: 0, CONDITIONAL_STANDBY: 1, MISSION_CAPABLE: 2 };

export default function Fleet() {
  useThemeMode();
  const ins = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  const aq = useAircraft();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [byRisk, setByRisk] = useState(true);
  useEffect(() => { if (params.filter) setFilter(params.filter); }, [params.filter]);

  const list = aq.data?.data || [];
  const c = fleetCounts(list);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return list
      .filter((a) => filter === 'all' ? true : filter === 'action' ? a.status !== 'MISSION_CAPABLE' : filter === 'ready' ? a.status === 'MISSION_CAPABLE' : a.aircraft_type.includes(filter))
      .filter((a) => !s || [a.tail_no, a.engine_serial, a.next_fault, a.squadron, a.base_station, a.aircraft_type].join(' ').toLowerCase().includes(s))
      .sort((a, b) => byRisk ? (RISK[a.status] - RISK[b.status]) || (a.health_score - b.health_score) : a.tail_no.localeCompare(b.tail_no));
  }, [list, q, filter, byRisk]);

  const header = (
    <View>
      <TopBar title="Fleet" sub={`${c.total} airframes · ${new Set(list.map((a) => a.squadron)).size} squadrons`} right={<IconBtn icon="sort-variant" label={byRisk ? 'Sort by tail' : 'Sort by risk'} onPress={() => setByRisk(!byRisk)} />} />
      <Row style={{ height: 52, borderRadius: 26, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, paddingLeft: 16, paddingRight: 8, gap: 10, marginTop: 4 }}>
        <Icon name="magnify" size={21} color={C.mu} />
        <TextInput value={q} onChangeText={setQ} placeholder="Tail, engine serial or fault" placeholderTextColor={C.mu} style={{ flex: 1, color: C.tx, fontFamily: F.ui, fontSize: 15.5 }} />
        <Pressable onPress={() => router.push('/voice')} accessibilityLabel="Search by voice" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="microphone-outline" size={19} color={C.ac} />
        </Pressable>
      </Row>
      <Card style={{ padding: 14, marginTop: 14, borderRadius: 18 }}>
        <StackBar parts={[{ n: c.mc, color: C.ok }, { n: c.deg, color: C.wa }, { n: c.gr, color: C.bad }]} />
        <Row style={{ gap: 16, marginTop: 10 }}>
          {[{ n: c.mc, l: 'Capable', col: C.ok }, { n: c.deg, l: 'Degraded', col: C.wa }, { n: c.gr, l: 'Grounded', col: C.bad }].map((k) => (
            <Row key={k.l} style={{ gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: k.col }} />
              <T style={{ fontFamily: F.uiB, fontSize: 13.5 }}>{k.n}</T>
              <T style={{ fontSize: 13.5, color: C.mu }}>{k.l}</T>
            </Row>
          ))}
        </Row>
      </Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 14 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <Chip label="All" on={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Needs action" count={c.deg + c.gr} on={filter === 'action'} onPress={() => setFilter('action')} />
        <Chip label="Ready" on={filter === 'ready'} onPress={() => setFilter('ready')} />
        {TYPES.map((t) => <Chip key={t} label={t} on={filter === t} onPress={() => setFilter(t)} />)}
      </ScrollView>
      <Row style={{ marginTop: 16, marginBottom: 4 }}>
        <Eyebrow style={{ flex: 1 }}>{byRisk ? 'Sorted by risk' : 'Sorted by tail'}</Eyebrow>
        <T style={{ fontSize: 11.5, color: C.fa }}>health · RUL</T>
      </Row>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      {!aq.data ? <View style={{ paddingTop: ins.top + 80 }}><Loading /></View> : (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.tail_no}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: ins.top, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <Divider style={{ marginLeft: 60 }} />}
          ListEmptyComponent={<T style={{ color: C.mu, textAlign: 'center', marginTop: 40 }}>No airframes match.</T>}
          renderItem={({ item: a }) => {
            const tone = statusTone(a.status);
            const h = Math.round(a.health_score);
            return (
              <Row style={{ paddingVertical: 12, gap: 14 }} onPress={() => router.push(`/aircraft/${a.tail_no}`)}>
                <Ring size={46} stroke={4} pct={h} color={toneColor(healthTone(h))}>
                  <T style={{ fontFamily: F.disp, fontSize: 15 }}>{h}</T>
                </Ring>
                <View style={{ flex: 1 }}>
                  <Row style={{ gap: 8 }}>
                    <Mono style={{ fontSize: 15.5 }}>{a.tail_no}</Mono>
                    <T style={{ fontSize: 13, color: C.mu }} numberOfLines={1}>{a.aircraft_type.split(' ').slice(0, 2).join(' ').replace(/ (Twin-Jet|Light|Omnirole|Globemaster|Combat|\/).*$/, '')}</T>
                  </Row>
                  <T style={{ fontSize: 13, color: C.fa, marginTop: 3 }} numberOfLines={1}>{sqnShort(a.squadron)} · {baseShort(a.base_station)}</T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Tag tone={tone}>{statusLabel(a.status)}</Tag>
                  <Mono style={{ fontSize: 12.5, color: C.mu, fontFamily: F.mono }}>RUL {a.status === 'MAINTENANCE_GROUNDED' && a.conservative_rul_hours ? `${Math.round(a.conservative_rul_hours)}–` : ''}{Math.round(a.rul_hours)} h</Mono>
                </View>
              </Row>
            );
          }}
        />
      )}
    </View>
  );
}
