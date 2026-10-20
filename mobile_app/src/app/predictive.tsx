import { useThemeMode } from '../lib/settings';
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Defs, LinearGradient, Line, Path, Stop, Text as SText } from 'react-native-svg';
import { fleetApi } from '../api/fleetApi';
import { C, F } from '../lib/theme';
import { Card, Divider, Eyebrow, IconBtn, Loading, Mono, Row, Screen, Seg, T, TopBar } from '../components/ui';
import { useAircraft } from '../lib/queries';

const heat = (p: number) => (p >= 70 ? C.bad : p >= 45 ? C.ac : p >= 25 ? C.heatLo : C.track);

function TrendChart({ data, k }: { data: any[]; k: string }) {
  const W = 340, H = 150;
  const vals = data.map((d) => d[k]);
  const base = data.map((d) => d.nominal_baseline);
  const max = 100;
  const x = (i: number) => (i / (data.length - 1)) * W;
  const y = (v: number) => H - 18 - (v / max) * (H - 26);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const bl = base.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs><LinearGradient id="pt" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={C.ac} stopOpacity="0.4" /><Stop offset="1" stopColor={C.ac} stopOpacity="0" /></LinearGradient></Defs>
      {[25, 50, 75].map((g) => <Line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} stroke={C.grid} />)}
      <Path d={`${line} L${W} ${H - 18} L0 ${H - 18} Z`} fill="url(#pt)" />
      <Path d={line} stroke={C.ac} strokeWidth={2.2} fill="none" />
      <Path d={bl} stroke={C.mu} strokeWidth={1.2} strokeDasharray="4 4" fill="none" />
      {data.filter((_, i) => i % 2 === 0).map((d, i) => <SText key={d.hours} x={Math.min(W - 26, x(i * 2))} y={H - 3} fill={C.fa} fontSize={10} fontFamily="Inter_500Medium">{d.hours}</SText>)}
    </Svg>
  );
}

export default function Predictive() {
  useThemeMode();
  const aq = useAircraft();
  const [type, setType] = useState('su30');
  const hm = fleetApi.getFailureHeatmap();
  const trend = fleetApi.getTelemetryTrends();
  const list = [...(aq.data?.data || [])].sort((a, b) => a.rul_hours - b.rul_hours).slice(0, 6);
  const maxR = 120;
  const short = ['T/O', 'CAP', 'Cruise', 'Low', 'Loiter'];
  return (
    <Screen>
      <TopBar back title="Predictive" right={<IconBtn icon="calendar-month-outline" label="Fault timeline" onPress={() => router.push('/fleet')} />} />
      <Row style={{ marginTop: 8, marginBottom: 10 }}>
        <Eyebrow style={{ flex: 1 }}>Lowest remaining life</Eyebrow>
        <T style={{ fontSize: 12, color: C.fa }}>hours</T>
      </Row>
      <Card style={{ paddingVertical: 4 }}>
        {!aq.data ? <Loading /> : list.map((a, i) => {
          const col = a.rul_hours < 30 ? C.bad : a.rul_hours < 60 ? C.ac : C.ok;
          return (
            <View key={a.tail_no}>
              {i ? <Divider style={{ marginHorizontal: 14 }} /> : null}
              <Row style={{ paddingHorizontal: 14, height: 44, gap: 10 }} onPress={() => router.push(`/aircraft/${a.tail_no}`)}>
                <Mono style={{ width: 70, fontSize: 13.5 }}>{a.tail_no}</Mono>
                <T style={{ width: 54, fontSize: 11.5, color: C.fa }} numberOfLines={1}>{a.aircraft_type.split(' ')[0]}</T>
                <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.track }}>
                  <View style={{ width: `${Math.min(100, (a.rul_hours / maxR) * 100)}%`, height: 6, borderRadius: 3, backgroundColor: col }} />
                </View>
                <Mono style={{ width: 34, textAlign: 'right', fontSize: 13.5, color: col }}>{Math.round(a.rul_hours)}</Mono>
              </Row>
            </View>
          );
        })}
      </Card>

      <Eyebrow style={{ marginTop: 24, marginBottom: 10 }}>Failure risk · subsystem × flight regime</Eyebrow>
      <Card style={{ padding: 14 }}>
        <Row style={{ marginBottom: 6 }}>
          <View style={{ width: 92 }} />
          {short.map((s) => <T key={s} style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: C.fa, fontFamily: F.uiS }}>{s}</T>)}
        </Row>
        {hm.subsystems.map((s: any) => (
          <Row key={s.code} style={{ marginBottom: 5 }}>
            <T style={{ width: 92, fontSize: 11.5, color: C.mu }} numberOfLines={1}>{s.name.replace(/ (Turbofan Stages|Turbine Blades|Delivery Pump|Actuator Loop|& Avionics Bus)/, '')}</T>
            {s.risks.map((r: any) => (
              <View key={r.regime} style={{ flex: 1, height: 30, marginHorizontal: 2, borderRadius: 7, backgroundColor: heat(r.risk_pct), alignItems: 'center', justifyContent: 'center' }}>
                {r.risk_pct >= 45 ? <T style={{ fontSize: 11, fontFamily: F.uiB, color: r.risk_pct >= 70 ? C.onbad : C.onac }}>{r.risk_pct}</T> : null}
              </View>
            ))}
          </Row>
        ))}
        <T style={{ fontSize: 11, color: C.fa, marginTop: 6 }}>Probability of failure (%) by mission regime. Numbers shown at ≥45%.</T>
      </Card>

      <Row style={{ marginTop: 24, marginBottom: 10 }}>
        <Eyebrow style={{ flex: 1 }}>Fault probability vs airframe hours</Eyebrow>
      </Row>
      <Seg options={[{ key: 'su30', label: 'Su-30' }, { key: 'tejas', label: 'Tejas' }, { key: 'rafale', label: 'Rafale' }]} value={type} onChange={setType} />
      <Card style={{ padding: 14, marginTop: 10 }}>
        <TrendChart data={trend} k={`${type}_fault_prob`} />
        <Row style={{ gap: 14, marginTop: 6 }}>
          <Row style={{ gap: 6 }}><View style={{ width: 14, height: 2, backgroundColor: C.ac }} /><T style={{ fontSize: 11.5, color: C.mu }}>Predicted</T></Row>
          <Row style={{ gap: 6 }}><View style={{ width: 14, height: 2, backgroundColor: C.mu }} /><T style={{ fontSize: 11.5, color: C.mu }}>Nominal baseline</T></Row>
        </Row>
      </Card>
    </Screen>
  );
}
