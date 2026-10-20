import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { C, F, baseShort, healthTone, sqnShort, statusTone, toneBg, toneColor } from '../../lib/theme';
import { Btn, Card, Divider, Eyebrow, Icon, IconBtn, LiveBadge, Loading, Mono, Row, Screen, SectionHead, T, Disp } from '../../components/ui';
import { ReadinessGauge } from '../../components/Gauge';
import { fleetCounts, useAircraft, useReadiness } from '../../lib/queries';

const BASES: Record<string, { x: number; y: number }> = {
  'AFS Ambala': { x: 46, y: 30 }, 'AFS Hindan': { x: 52, y: 36 }, 'AFS Jodhpur': { x: 30, y: 50 },
  'AFS Sulur': { x: 44, y: 128 }, 'AFS Thanjavur': { x: 56, y: 130 },
};

function IndiaDots({ bases }: { bases: { base: string; tone: string }[] }) {
  // Stylised dot-matrix subcontinent: rows of [startX, endX] on a 6px grid.
  const rows = [[7, 9], [6, 10], [5, 11], [3, 12], [2, 14], [1, 16], [1, 18], [2, 19], [3, 17], [4, 15], [5, 14], [5, 13], [6, 12], [6, 12], [7, 11], [7, 11], [8, 11], [8, 10], [8, 10], [9, 10], [9, 9]];
  return (
    <Svg width={130} height={150}>
      {rows.flatMap((r, y) => Array.from({ length: r[1] - r[0] + 1 }, (_, i) => <Circle key={`${y}-${i}`} cx={(r[0] + i) * 6 + 3} cy={y * 7 + 6} r={1.4} fill="rgba(255,255,255,0.16)" />))}
      {bases.map((b) => {
        const p = BASES[b.base];
        if (!p) return null;
        return [
          <Circle key={b.base + 'g'} cx={p.x} cy={p.y} r={11} fill={b.tone} opacity={0.18} />,
          <Circle key={b.base} cx={p.x} cy={p.y} r={4} fill={b.tone} />,
        ];
      })}
    </Svg>
  );
}

export default function Command() {
  const rq = useReadiness();
  const aq = useAircraft();
  if (!aq.data || !rq.data) return <Screen tabs><View style={{ paddingTop: 120 }}><Loading /><T style={{ textAlign: 'center', color: C.mu, fontSize: 13 }}>Connecting to fleet server…</T></View></Screen>;
  const list = aq.data.data;
  const live = aq.data.isLive;
  const c = fleetCounts(list, rq.data.data);
  const attention = list.filter((a) => a.status !== 'MISSION_CAPABLE').sort((a, b) => a.rul_hours - b.rul_hours);
  const fighters = list.filter((a) => /Su-30|Tejas|Rafale/.test(a.aircraft_type));
  const cleared = fighters.filter((a) => a.status === 'MISSION_CAPABLE').length;
  const byBase: Record<string, { type: string; total: number; ready: number }> = {};
  list.forEach((a) => {
    const b = (byBase[a.base_station] ||= { type: a.aircraft_type.split(' ')[0], total: 0, ready: 0 });
    b.total++; if (a.status === 'MISSION_CAPABLE') b.ready++;
  });
  const bases = Object.entries(byBase).sort((a, b) => a[0].localeCompare(b[0])).map(([base, v]) => {
    const r = v.ready / v.total;
    return { base, ...v, tone: r >= 1 ? C.ok : r >= 0.6 ? C.wa : C.bad };
  });

  return (
    <Screen tabs>
      <Row style={{ height: 76, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 8 }}>
            <T style={{ fontFamily: F.dispB, fontSize: 13, letterSpacing: 2, color: C.ac }}>VAYU·AI</T>
            <LiveBadge live={live} />
          </Row>
          <Disp style={{ fontSize: 30, marginTop: 2 }}>Command</Disp>
        </View>
        <Row style={{ gap: 10 }}>
          <IconBtn icon="cog-outline" label="Settings" onPress={() => router.push('/settings')} />
          <IconBtn icon="bell-outline" badge label="Alerts and predictions" onPress={() => router.push('/predictive')} />
          <IconBtn icon="microphone-outline" color={C.ac} tint="rgba(255,181,71,0.14)" label="Voice copilot" onPress={() => router.push('/voice')} />
        </Row>
      </Row>

      <Card style={{ marginTop: 8 }}>
        <Row style={{ padding: 16, paddingBottom: 10 }}>
          <ReadinessGauge pct={c.pct} size={196} />
          <View style={{ flex: 1, paddingLeft: 14, gap: 12 }}>
            <Row style={{ gap: 6 }}>
              <Icon name="trending-up" size={16} color={C.ok} />
              <T style={{ color: C.ok, fontFamily: F.uiS, fontSize: 13 }}>{c.mc}/{c.total}</T>
              <T style={{ color: C.mu, fontSize: 13 }}>up</T>
            </Row>
            {[
              { n: c.mc, l: 'Mission capable', col: C.ok },
              { n: c.deg, l: 'Degraded', col: C.wa },
              { n: c.gr, l: 'Grounded', col: C.bad },
            ].map((k) => (
              <Row key={k.l} style={{ gap: 10 }}>
                <View style={{ width: 3, height: 34, borderRadius: 2, backgroundColor: k.col }} />
                <View>
                  <Disp style={{ fontSize: 22, lineHeight: 26 }}>{k.n}</Disp>
                  <T style={{ fontSize: 12.5, color: C.mu }}>{k.l}</T>
                </View>
              </Row>
            ))}
          </View>
        </Row>
        <Divider />
        <Row style={{ padding: 16, paddingLeft: 20, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 12.5, color: C.mu }}>Next sortie window · 06:30</T>
            <T style={{ fontSize: 16, fontFamily: F.uiS, marginTop: 3 }}>{cleared} of {fighters.length} fighters cleared</T>
          </View>
          <Btn label="Plan" icon="airplane-takeoff" width={116} onPress={() => router.push({ pathname: '/fleet', params: { filter: 'ready' } })} />
        </Row>
      </Card>

      <SectionHead title="Needs attention" action={`All ${attention.length}`} onAction={() => router.push({ pathname: '/fleet', params: { filter: 'action' } })} />
      <Card>
        {attention.slice(0, 3).map((a, i) => {
          const tone = statusTone(a.status);
          return (
            <View key={a.tail_no}>
              {i ? <Divider style={{ marginLeft: 16 }} /> : null}
              <Row style={{ padding: 14, gap: 12 }} onPress={() => router.push(`/aircraft/${a.tail_no}`)}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: toneBg[tone], alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={tone === 'bad' ? 'alert-circle-outline' : 'alert-outline'} size={20} color={toneColor(tone)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Row style={{ gap: 8 }}>
                    <Mono style={{ fontSize: 14.5 }}>{a.tail_no}</Mono>
                    <T style={{ fontSize: 12.5, color: C.mu, flex: 1 }} numberOfLines={1}>{a.aircraft_type.split(' ')[0]} · {sqnShort(a.squadron)}</T>
                  </Row>
                  <T style={{ fontSize: 15, fontFamily: F.uiM, marginTop: 2 }} numberOfLines={1}>{a.next_fault}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Mono style={{ color: toneColor(tone), fontSize: 14 }}>{Math.round(a.conservative_rul_hours ?? a.rul_hours * 0.85)}–{Math.round(a.rul_hours)} h</Mono>
                  <T style={{ fontSize: 10.5, color: C.fa, fontFamily: F.uiS }}>RUL</T>
                </View>
              </Row>
            </View>
          );
        })}
      </Card>

      <SectionHead title="Bases" action="Predictive →" onAction={() => router.push('/predictive')} />
      <Card style={{ padding: 14 }}>
        <Row style={{ gap: 10, alignItems: 'center' }}>
          <IndiaDots bases={bases} />
          <View style={{ flex: 1 }}>
            {bases.map((b, i) => (
              <View key={b.base}>
                {i ? <Divider /> : null}
                <Row style={{ height: 34, gap: 8 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: b.tone }} />
                  <T style={{ flex: 1, fontFamily: F.uiS, fontSize: 14 }}>{baseShort(b.base)}</T>
                  <T style={{ fontSize: 12, color: C.mu, width: 52 }} numberOfLines={1}>{b.type}</T>
                  <Mono style={{ fontSize: 13.5 }}>{b.ready}/{b.total}</Mono>
                </Row>
              </View>
            ))}
          </View>
        </Row>
      </Card>
      <Eyebrow style={{ textAlign: 'center', marginTop: 18 }}>{live ? 'Live backend' : 'Demo data · offline'} · {c.total} airframes</Eyebrow>
    </Screen>
  );
}
