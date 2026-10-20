import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { fleetApi } from '../../api/fleetApi';
import { C, F } from '../../lib/theme';
import { Btn, Card, Chip, Disp, Eyebrow, Icon, IconBtn, Mono, Row, Sheet, T } from '../ui';
import { useAircraft } from '../../lib/queries';

export const SORTIES = [
  { key: 'Combat Air Patrol (CAP)', label: 'Air defence CAP', icon: 'shield-airplane-outline' as const },
  { key: 'Tactical Intercept', label: 'Strike', icon: 'target' as const },
  { key: 'Combat Training', label: 'Training', icon: 'school-outline' as const },
  { key: 'Reconnaissance', label: 'Recce / ferry', icon: 'binoculars' as const },
];

export function SortieSheet({ tail, visible, onClose }: { tail: string; visible: boolean; onClose: () => void }) {
  const [type, setType] = useState(SORTIES[0].key);
  const [hours, setHours] = useState(2);
  const aq = useAircraft();
  const m = useMutation({ mutationFn: () => fleetApi.evaluateSortie(tail, type, hours) });
  useEffect(() => { if (visible) m.mutate(); }, [visible, type, hours, tail]);
  const r = m.data?.data;
  const go = r?.decision === 'MISSION_GO', cond = r?.decision === 'CONDITIONAL_GO';
  const col = go ? C.ok : cond ? C.wa : C.bad;
  const label = go ? 'GO' : cond ? 'CONDITIONAL' : 'NO-GO';
  const sub = (aq.data?.data || []).filter((a) => a.tail_no !== tail && a.status === 'MISSION_CAPABLE' && a.aircraft_type === r?.aircraft_type).sort((a, b) => b.health_score - a.health_score)[0];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Row>
        <View style={{ flex: 1 }}>
          <Disp style={{ fontSize: 22 }}>Evaluate sortie</Disp>
          <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }}>{tail} · {r?.aircraft_type?.split(' ')[0] || ''}</T>
        </View>
        <IconBtn icon="close" onPress={onClose} label="Close" />
      </Row>
      <Eyebrow style={{ marginTop: 18, marginBottom: 8, textTransform: 'none', letterSpacing: 0, fontSize: 12.5, color: C.mu }}>Mission type</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SORTIES.map((s) => <Chip key={s.key} label={s.label} icon={s.icon} on={type === s.key} onPress={() => setType(s.key)} />)}
      </ScrollView>
      <Row style={{ marginTop: 18 }}>
        <T style={{ flex: 1, fontSize: 12.5, color: C.mu }}>Duration</T>
        <Mono style={{ fontSize: 15 }}>{hours.toFixed(1)} h</Mono>
      </Row>
      <Row style={{ gap: 10, marginTop: 8 }}>
        <IconBtn icon="minus" label="Shorter" onPress={() => setHours(Math.max(0.5, hours - 0.5))} />
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ width: `${(hours / 8) * 100}%`, height: 6, borderRadius: 3, backgroundColor: C.ac }} />
        </View>
        <IconBtn icon="plus" label="Longer" onPress={() => setHours(Math.min(8, hours + 0.5))} />
      </Row>
      {r ? (
        <>
          <View style={{ marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: col + '55', backgroundColor: col + '14', padding: 16 }}>
            <Row style={{ gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: col + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={go ? 'check-circle-outline' : cond ? 'alert-outline' : 'cancel'} size={24} color={col} />
              </View>
              <View style={{ flex: 1 }}>
                <Disp style={{ fontSize: 28, color: col }}>{label}</Disp>
                <T style={{ fontSize: 12, color: C.mu }}>{r.clearance_code?.replace(/_/g, ' ').toLowerCase()} · {m.data?.isLive ? 'live' : 'demo'} evaluation</T>
              </View>
            </Row>
            <T style={{ marginTop: 12, fontSize: 14, lineHeight: 20 }}>
              Conservative RUL <T style={{ fontFamily: F.uiB, color: col }}>{r.prognostic_state?.conservative_rul_hours} h</T> vs required margin <T style={{ fontFamily: F.uiB }}>{r.mission_requested?.required_margin_hours} h</T> for a {hours} h sortie.
            </T>
          </View>
          <Eyebrow style={{ marginTop: 18, marginBottom: 8 }}>Why</Eyebrow>
          {[...(r.reasons || []), ...(r.recommendations || [])].map((t: string, i: number) => (
            <Row key={i} style={{ gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i < (r.reasons || []).length ? col : C.mu, marginTop: 7 }} />
              <T style={{ flex: 1, fontSize: 14, lineHeight: 20, color: i < (r.reasons || []).length ? C.tx : C.mu }}>{t}</T>
            </Row>
          ))}
          {r.spares_status ? (
            <Row style={{ gap: 10, marginBottom: 10 }}>
              <Icon name="package-variant-closed" size={18} color={r.spares_status.stock_sufficient ? C.ok : C.bad} />
              <T style={{ flex: 1, fontSize: 13, color: C.mu }}>{r.spares_status.component_name} · {r.spares_status.quantity_on_hand} on hand</T>
            </Row>
          ) : null}
          {!go && sub ? (
            <Card style={{ padding: 14, marginTop: 6, borderColor: 'rgba(52,211,153,0.3)' }} onPress={() => { onClose(); router.push(`/aircraft/${sub.tail_no}`); }}>
              <T style={{ fontSize: 12, color: C.mu }}>Suggested substitute</T>
              <Row style={{ gap: 8, marginTop: 4 }}>
                <Icon name="swap-horizontal" size={18} color={C.ok} />
                <Mono style={{ fontSize: 15 }}>{sub.tail_no}</Mono>
                <T style={{ color: C.ok, fontFamily: F.uiS, fontSize: 13 }}>GO · health {Math.round(sub.health_score)}</T>
              </Row>
            </Card>
          ) : null}
          <View style={{ flexDirection: 'row', marginTop: 18 }}>
            {go || cond ? <Btn label="Clear for sortie" icon="check" onPress={onClose} /> : sub ? <Btn label={`Assign ${sub.tail_no}`} onPress={() => { onClose(); router.push(`/aircraft/${sub.tail_no}`); }} /> : <Btn label="Dispatch triage" onPress={() => { onClose(); router.push(`/triage/${tail}`); }} />}
          </View>
        </>
      ) : <T style={{ color: C.mu, marginTop: 20 }}>Evaluating…</T>}
    </Sheet>
  );
}
