import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fleetApi } from '../../api/fleetApi';
import { C, F, baseShort } from '../../lib/theme';
import { Btn, Card, Disp, Divider, Icon, IconBtn, IconName, Kpis, Loading, Mono, Row, Screen, Seg, Sheet, T, Tag } from '../../components/ui';
import { useInventory } from '../../lib/queries';

const SUB_ICON: Record<string, IconName> = { HPC: 'fan', 'LPC/Fan': 'fan', LPT: 'fire', 'Fuel System': 'gas-station-outline', 'FADEC/Avionics': 'chip' };

export default function Logistics() {
  const iq = useInventory();
  const [base, setBase] = useState('AFS Thanjavur');
  const [pick, setPick] = useState(false);
  const [tab, setTab] = useState('bins');
  const [search, setSearch] = useState<string | null>(null);
  const [, force] = useState(0);
  const d = iq.data?.data;
  const bases = useMemo(() => Array.from(new Set((d?.base_spares || []).map((s: any) => s.base_station))) as string[], [d]);
  const bins = (d?.base_spares || []).filter((s: any) => s.base_station === base && (!search || s.component_name.toLowerCase().includes(search.toLowerCase())));
  const pipeline = (d?.depot_pipeline || []).filter((r: any) => r.status !== 'DELIVERED');
  const below = bins.filter((s: any) => s.quantity_on_hand < s.safety_stock_threshold).length;
  const nextEta = Math.min(...pipeline.filter((r: any) => r.base_station === base).map((r: any) => Number(r.eta_hours) || 99), 999);
  const nextDay = nextEta < 999 ? new Date(Date.now() + nextEta * 3600000).toLocaleDateString('en-GB', { weekday: 'short' }) : '—';
  const trig = fleetApi.getAiReorderTriggers().find((t) => t.status === 'ACTIVE_PENDING_APPROVAL' && (t.base_station === base));

  return (
    <Screen tabs>
      <Row style={{ minHeight: 72, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Disp style={{ fontSize: 26 }}>Logistics</Disp>
          <Pressable onPress={() => setPick(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }} accessibilityLabel="Change base">
            <T style={{ fontSize: 13.5, color: C.mu }}>{base}</T>
            <Icon name="chevron-down" size={16} color={C.mu} />
          </Pressable>
        </View>
        <Row style={{ gap: 10 }}>
          <IconBtn icon="magnify" label="Search parts" onPress={() => setSearch(search == null ? '' : null)} />
          <IconBtn icon="plus" label="New requisition" onPress={() => router.push({ pathname: '/requisition', params: { base } })} />
        </Row>
      </Row>
      {search != null ? (
        <TextInput autoFocus value={search} onChangeText={setSearch} placeholder="Search parts" placeholderTextColor={C.mu} style={{ height: 46, borderRadius: 23, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, color: C.tx, fontFamily: F.ui, marginBottom: 10 }} />
      ) : null}
      {!d ? <Loading /> : (
        <>
          <Kpis items={[
            { value: String(below), label: 'Below minimum', color: below ? C.bad : C.tx },
            { value: String(pipeline.length), label: 'On order' },
            { value: nextDay, label: 'Next delivery' },
          ]} />
          {trig ? (
            <LinearGradient colors={['rgba(255,181,71,0.14)', 'rgba(255,181,71,0.05)']} style={{ marginTop: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,181,71,0.3)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="creation" size={20} color={C.ac} />
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: F.uiS, fontSize: 15 }} numberOfLines={1}>Reorder {trig.lru_component}</T>
                <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }} numberOfLines={1}>{trig.tail_no} needs it in ~{trig.predicted_demand_hours} h · {trig.confidence_score}% conf.</T>
              </View>
              <Btn label="Review" style={{ flex: 0, width: 92 }} onPress={() => router.push({ pathname: '/requisition', params: { tail: trig.tail_no, base: trig.base_station, part: trig.lru_component, trigger: trig.trigger_id } })} />
            </LinearGradient>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <Seg options={[{ key: 'bins', label: `Base bins · ${bins.length}` }, { key: 'pipe', label: `Depot pipeline · ${pipeline.length}` }]} value={tab} onChange={setTab} />
          </View>
          {tab === 'bins' ? bins.map((s: any, i: number) => {
            const q = s.quantity_on_hand, min = s.safety_stock_threshold;
            const max = Math.max(min * 2, q, 1);
            const col = q < min ? C.bad : q < min * 1.5 || q === min ? C.wa : C.ok;
            const cover = q === 0 ? 'Out of stock' : q >= min * 1.5 ? '60+ d cover' : `${Math.round((q / Math.max(min, 1)) * 18)} d cover`;
            return (
              <View key={s.item_id}>
                {i ? <Divider style={{ marginLeft: 56 }} /> : null}
                <Row style={{ paddingVertical: 14, gap: 14 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.s1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={SUB_ICON[s.subsystem] || 'cog-outline'} size={19} color={C.mu} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Row>
                      <T style={{ flex: 1, fontSize: 15, fontFamily: F.uiS }} numberOfLines={1}>{s.component_name}</T>
                      <Mono style={{ color: col, fontSize: 14 }}>{q}</Mono>
                      <Mono style={{ color: C.fa, fontSize: 13, fontFamily: F.mono }}> / {min}</Mono>
                    </Row>
                    <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)', marginTop: 8 }}>
                      <View style={{ width: `${Math.min(100, (q / max) * 100)}%`, height: 5, borderRadius: 3, backgroundColor: col }} />
                      <View style={{ position: 'absolute', left: `${(min / max) * 100}%`, top: -3, width: 2, height: 11, borderRadius: 1, backgroundColor: C.mu }} />
                    </View>
                    <Row style={{ marginTop: 6 }}>
                      <Mono style={{ flex: 1, fontSize: 11.5, color: C.fa, fontFamily: F.mono }}>{s.part_number} · {s.location_bin}</Mono>
                      <T style={{ fontSize: 12, color: col === C.ok ? C.mu : col }}>{cover}</T>
                    </Row>
                  </View>
                </Row>
              </View>
            );
          }) : pipeline.map((r: any, i: number) => {
            const done = (r.tracking_steps || []).filter((s: any) => s.done).length;
            const tot = (r.tracking_steps || []).length || 4;
            return (
              <Card key={r.req_id} style={{ padding: 14, marginTop: i ? 10 : 14 }}>
                <Row style={{ gap: 8 }}>
                  <Mono style={{ flex: 1, fontSize: 12.5, color: C.fa, fontFamily: F.mono }}>{r.req_id} · {r.tail_no}</Mono>
                  <Tag tone={r.priority === 'CRITICAL_AOG' ? 'bad' : 'wa'}>{r.priority === 'CRITICAL_AOG' ? 'AOG' : String(r.priority).replace(/_/g, ' ')}</Tag>
                </Row>
                <T style={{ fontSize: 15.5, fontFamily: F.uiS, marginTop: 6 }}>{r.component_name}</T>
                <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }}>{r.depot_source || 'Central depot'} → {baseShort(r.base_station)}</T>
                <Row style={{ gap: 4, marginTop: 12 }}>
                  {Array.from({ length: tot }, (_, k) => <View key={k} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k < done ? C.ac : 'rgba(255,255,255,0.08)' }} />)}
                </Row>
                <Row style={{ marginTop: 8 }}>
                  <T style={{ flex: 1, fontSize: 12, color: C.mu }}>{String(r.status).replace(/_/g, ' ').toLowerCase()} · {r.transit_mode || ''}</T>
                  <Mono style={{ fontSize: 12.5, color: C.ac }}>ETA {r.eta_hours} h</Mono>
                </Row>
              </Card>
            );
          })}
          <T style={{ fontSize: 11, color: C.fa, textAlign: 'center', marginTop: 16 }}>{iq.data?.isLive ? 'Live inventory' : 'Demo inventory'}</T>
        </>
      )}
      <Sheet visible={pick} onClose={() => setPick(false)}>
        <Disp style={{ fontSize: 20, marginBottom: 10 }}>Forward base</Disp>
        {bases.map((b) => (
          <Row key={b} style={{ height: 52, gap: 12 }} onPress={() => { setBase(b); setPick(false); force((x) => x + 1); }}>
            <Icon name={b === base ? 'radiobox-marked' : 'radiobox-blank'} color={b === base ? C.ac : C.mu} />
            <T style={{ fontSize: 15.5 }}>{b}</T>
          </Row>
        ))}
      </Sheet>
    </Screen>
  );
}
