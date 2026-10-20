import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, F, baseShort, healthTone, sqnShort, statusLabel, statusTone, toneColor } from '../../lib/theme';
import { Btn, Card, Chip, Disp, Divider, Eyebrow, Icon, IconBtn, Loading, Mono, Row, Screen, Seg, Spark, T, Tabs, Tag } from '../../components/ui';
import { EngineTwin } from '../../components/aircraft/EngineTwin';
import { RulChart } from '../../components/aircraft/RulChart';
import { SortieSheet } from '../../components/aircraft/SortieSheet';
import { useLogs, useTwin } from '../../lib/queries';
import { history } from '../../lib/series';
import { fleetApi } from '../../api/fleetApi';

function Sensor({ label, value, unit, limit, data, tone, trend }: { label: string; value: string; unit: string; limit: string; data: number[]; tone: string; trend: 'up' | 'down' }) {
  return (
    <Card style={{ flex: 1, padding: 14, borderRadius: 18 }}>
      <Row>
        <T style={{ flex: 1, fontSize: 13, color: C.mu }}>{label}</T>
        <Icon name={trend === 'up' ? 'arrow-top-right' : 'arrow-bottom-right'} size={15} color={tone} />
      </Row>
      <Row style={{ alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
        <Disp style={{ fontSize: 26, color: tone }}>{value}</Disp>
        <T style={{ fontSize: 12.5, color: C.mu, marginBottom: 4 }}>{unit}</T>
      </Row>
      <Spark data={data} color={tone} w={140} h={30} />
      <T style={{ fontSize: 11, color: C.fa, marginTop: 4 }}>{limit}</T>
    </Card>
  );
}

function HealthTab({ tw }: { tw: any }) {
  const st = tw.stages || {};
  const stages = [
    { key: 'fan', label: 'FAN', pct: st.fan?.health_pct ?? 90 },
    { key: 'lpc', label: 'LPC', pct: st.lpc?.health_pct ?? 90 },
    { key: 'hpc', label: 'HPC', pct: st.hpc?.health_pct ?? 90 },
    { key: 'hpt', label: 'HPT', pct: st.combustor_hpt?.health_pct ?? st.hpt?.health_pct ?? 90 },
    { key: 'lpt', label: 'LPT', pct: st.lpt?.health_pct ?? 90 },
  ];
  const worst = stages.reduce((a, b) => (b.pct < a.pct ? b : a));
  const te = tw.telemetry || {};
  const egt = te.egt_celsius ?? 760, oil = te.oil_pressure_psi ?? 48, vib = te.vibration_index ?? 0.3;
  const drift = tw.in_flight_drift_adaptation?.rls_drift_active;
  const t = tw.tail_no;
  const bad = (v: boolean) => (v ? C.bad : C.ok);
  return (
    <View>
      <Row style={{ marginTop: 18, marginBottom: 10 }}>
        <Eyebrow style={{ flexGrow: 1 }}>Digital twin · 5-stage gas path</Eyebrow>
        <T style={{ fontSize: 12, color: C.fa }}>efficiency</T>
      </Row>
      <Card style={{ padding: 14 }}>
        <EngineTwin stages={stages} />
        <Row style={{ gap: 10, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: toneColor(healthTone(worst.pct)) + '1A', alignItems: 'flex-start' }}>
          <Icon name="magnify-scan" size={18} color={toneColor(healthTone(worst.pct))} />
          <T style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
            {worst.label}: {tw.wear_mode || 'nominal wear'}.{' '}
            {worst.pct < 70 ? <T style={{ color: C.bad, fontFamily: F.uiS, fontSize: 13.5 }}>Efficiency {Math.round(70 - worst.pct)} pts below floor.</T> : <T style={{ color: C.ok, fontSize: 13.5 }}>All stages above the 70% floor.</T>}
          </T>
        </Row>
      </Card>
      <Row style={{ marginTop: 22, marginBottom: 10 }}>
        <Eyebrow style={{ flexGrow: 1 }}>Live sensors</Eyebrow>
        <T style={{ fontSize: 12, color: C.fa }}>{tw.prognostics?.telemetry_source ? 'C-MAPSS feed' : 'latest'}</T>
      </Row>
      <Row style={{ gap: 10 }}>
        <Sensor label="EGT" value={String(Math.round(egt))} unit="°C" limit="limit 830" data={history(t + 'egt', egt, 30)} tone={bad(egt > 830)} trend="up" />
        <Sensor label="Oil pressure" value={oil.toFixed(1)} unit="psi" limit="min 40" data={history(t + 'oil', oil, -3)} tone={bad(oil < 40)} trend="down" />
      </Row>
      <Row style={{ gap: 10, marginTop: 10 }}>
        <Sensor label="Vibration" value={vib.toFixed(2)} unit="ips" limit="limit 0.60" data={history(t + 'vib', vib, 0.1, 14, 0.05)} tone={vib > 0.6 ? C.bad : vib > 0.45 ? C.wa : C.ok} trend="up" />
        <Sensor label="RLS drift" value={drift ? '1.5×' : '1.0×'} unit="gain" limit={drift ? 'compensated on T30/P30' : 'calibrated'} data={history(t + 'rls', drift ? 1.5 : 1, drift ? 0.4 : 0.02, 14, 0.02)} tone={drift ? C.wa : C.ok} trend="up" />
      </Row>
      <T style={{ fontSize: 11.5, color: C.fa, marginTop: 12 }}>{tw.prognostics?.ml_engine}</T>
    </View>
  );
}

function RulTab({ tw }: { tw: any }) {
  const [range, setRange] = useState('30D');
  const p = tw.prognostics || {};
  const rul = p.predicted_rul_hours ?? 50;
  const [lo, hi] = p.conformal_interval || [p.conservative_rul_hours ?? rul * 0.8, rul * 1.2];
  const n = range === '7D' ? 8 : range === '30D' ? 16 : range === '90D' ? 22 : 30;
  const past = history(tw.tail_no + range, rul, -n * 2.4, n, 0.03);
  const days = Math.max(1, Math.round((p.conservative_rul_hours ?? rul) / 2.5));
  const planBy = new Date(Date.now() + days * 86400000);
  const tone = rul < 30 ? C.bad : rul < 60 ? C.wa : C.ok;
  const timeline = fleetApi.getFaultTimeline().filter((f) => f.tail_no === tw.tail_no);
  const labels = range === '7D' ? ['7d ago', '5d', '3d', 'today', 'fcst'] : range === '30D' ? ['30d ago', '20d', '10d', 'today', 'fcst'] : range === '90D' ? ['90d ago', '60d', '30d', 'today', 'fcst'] : ['entry', '', '', 'today', 'fcst'];
  return (
    <View>
      <T style={{ fontSize: 12.5, color: C.mu, marginTop: 18 }}>Remaining useful life</T>
      <Row style={{ alignItems: 'flex-end', gap: 8 }}>
        <Disp style={{ fontSize: 56, lineHeight: 62 }}>{rul.toFixed(1)}</Disp>
        <T style={{ fontSize: 18, color: C.mu, marginBottom: 10, fontFamily: F.uiM }}>hours</T>
        <View style={{ flexGrow: 1 }} />
        <View style={{ marginBottom: 12 }}><Tag tone={rul < 30 ? 'bad' : rul < 60 ? 'wa' : 'ok'} dot={false}>{`↘ −${(n * 2.4 / (n / 7)).toFixed(1)} h / 7d`}</Tag></View>
      </Row>
      <Mono style={{ fontSize: 12.5, color: C.mu, fontFamily: F.mono }}>90% conformal interval {Number(lo).toFixed(1)} – {Number(hi).toFixed(1)} h</Mono>
      <View style={{ marginTop: 16 }}><Seg options={['7D', '30D', '90D', 'All'].map((k) => ({ key: k, label: k }))} value={range} onChange={setRange} /></View>
      <View style={{ marginTop: 10 }}><RulChart past={past} lo={Number(lo)} hi={Number(hi)} color={tone === C.ok ? C.ac : tone} labels={labels} /></View>
      <Row style={{ gap: 8, marginTop: 8 }}>
        {[
          { l: 'Plan by', v: planBy.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) },
          { l: 'Sorties left', v: `~${Math.max(0, Math.floor((p.conservative_rul_hours ?? rul) / 2.2))}` },
          { l: 'Model', v: 'C-MAPSS' },
        ].map((k) => (
          <Card key={k.l} style={{ flex: 1, padding: 12, borderRadius: 16 }}>
            <T style={{ fontSize: 11.5, color: C.mu }}>{k.l}</T>
            <T style={{ fontSize: 16, fontFamily: F.uiS, marginTop: 3 }}>{k.v}</T>
          </Card>
        ))}
      </Row>
      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Fault timeline</Eyebrow>
      {(timeline.length ? timeline : [{ id: 'x', severity: 'NOMINAL_MONITOR', component: tw.wear_mode || 'No predicted faults', horizon_hours: `+${rul.toFixed(0)}h`, action_type: 'Scheduled inspection' }]).map((f: any) => {
        const c = f.severity === 'CRITICAL' ? C.bad : f.severity === 'CAUTION' ? C.wa : C.ok;
        return (
          <Row key={f.id} style={{ gap: 12, paddingVertical: 10, alignItems: 'flex-start' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c, marginTop: 6 }} />
            <View style={{ flexGrow: 1 }}>
              <T style={{ fontSize: 14.5, fontFamily: F.uiM }}>{f.component}</T>
              <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }}>{f.action_type}{f.details ? ` · ${f.details}` : ''}</T>
            </View>
            <Mono style={{ fontSize: 12.5, color: C.mu, fontFamily: F.mono }}>{f.horizon_hours}</Mono>
          </Row>
        );
      })}
    </View>
  );
}

function LogsTab({ tail }: { tail: string }) {
  const lq = useLogs(tail);
  const [f, setF] = useState('all');
  const logs = (lq.data?.data || []).filter((l) => f === 'all' || (f === 'snags' ? l.snags_reported > 0 : true));
  const snags = (lq.data?.data || []).filter((l) => l.snags_reported > 0).length;
  return (
    <View>
      <Row style={{ gap: 8, marginTop: 16, marginBottom: 6 }}>
        <Chip label="All" on={f === 'all'} onPress={() => setF('all')} />
        <Chip label="Sorties" icon="airplane-takeoff" on={f === 'sorties'} onPress={() => setF('sorties')} />
        <Chip label="Snags" icon="alert-outline" count={snags} on={f === 'snags'} onPress={() => setF('snags')} />
      </Row>
      {!lq.data ? <Loading /> : logs.map((l, i) => {
        const d = String(l.mission_date || '');
        const m = d.match(/(\d{4})-(\d{2})-(\d{2})/);
        const day = m ? m[3] : d.split(' ')[0];
        const mon = m ? new Date(d).toLocaleString('en', { month: 'short' }).toUpperCase() : (d.split(' ')[1] || '');
        return (
          <View key={l.log_id || i}>
            {i ? <Divider style={{ marginLeft: 52 }} /> : null}
            <Row style={{ paddingVertical: 14, gap: 14, alignItems: 'flex-start' }}>
              <View style={{ width: 38, alignItems: 'center' }}>
                <Disp style={{ fontSize: day.length > 3 ? 13 : 22 }} numberOfLines={1}>{day}</Disp>
                <T style={{ fontSize: 10.5, color: C.fa, fontFamily: F.uiS }}>{mon}</T>
              </View>
              <View style={{ flexGrow: 1 }}>
                <T style={{ fontSize: 15, fontFamily: F.uiS }}>{l.mission_type}</T>
                <Mono style={{ fontSize: 11.5, color: C.fa, fontFamily: F.mono, marginTop: 2 }}>{l.pilot_callsign || l.log_id}{l.g_force_peak ? ` · ${l.g_force_peak} g peak` : ''}</Mono>
                <Row style={{ gap: 6, marginTop: 6, alignItems: 'flex-start' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: l.snags_reported > 0 ? C.wa : C.ok, marginTop: 6 }} />
                  <T style={{ flex: 1, fontSize: 13, color: l.snags_reported > 0 ? C.tx : C.mu, lineHeight: 18 }}>{l.snags_reported > 0 ? `Snag · ${l.pilot_remarks}` : 'No snags'}</T>
                </Row>
                {l.nlp_fusion?.diagnosis ? <T style={{ fontSize: 12, color: C.info, marginTop: 6, lineHeight: 17 }}>NLP fusion {l.nlp_fusion.multi_modal_confidence}% · {l.nlp_fusion.diagnosis}</T> : null}
              </View>
              <Mono style={{ fontSize: 13, color: C.mu, fontFamily: F.mono }}>{l.duration_hours} h</Mono>
            </Row>
          </View>
        );
      })}
    </View>
  );
}

export default function Aircraft() {
  const { tail = 'SB-024' } = useLocalSearchParams<{ tail: string }>();
  const tq = useTwin(tail);
  const [tab, setTab] = useState('Health');
  const [sortie, setSortie] = useState(false);
  const [star, setStar] = useState(false);
  const tw = tq.data?.data;
  const tone = statusTone(tw?.status);
  return (
    <Screen
      footer={tab !== 'Logs' && tw ? (
        <Row style={{ gap: 10 }}>
          <Btn kind="s" label="Triage" icon="medical-bag" onPress={() => router.push(`/triage/${tail}`)} style={{ flexGrow: 0.8 }} />
          <Btn label="Evaluate sortie" icon="check-circle-outline" onPress={() => setSortie(true)} style={{ flexGrow: 1.2 }} />
        </Row>
      ) : undefined}
    >
      <Row style={{ height: 64, marginTop: 4 }}>
        <IconBtn ghost icon="arrow-left" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/fleet'))} />
        <View style={{ flexGrow: 1 }} />
        <IconBtn ghost icon="microphone-outline" color={C.ac} label="Ask copilot" onPress={() => router.push({ pathname: '/voice', params: { q: `Status of ${tail}` } })} />
        <IconBtn ghost icon={star ? 'star' : 'star-outline'} color={star ? C.ac : C.tx} label="Watch" onPress={() => setStar(!star)} />
        <IconBtn ghost icon="dots-vertical" label="More" onPress={() => router.push({ pathname: '/requisition', params: { tail } })} />
      </Row>
      {!tw ? <Loading /> : (
        <>
          <Row style={{ gap: 10 }}>
            <Mono style={{ fontSize: 32, fontFamily: F.monoS }}>{tail}</Mono>
            <Tag tone={tone}>{statusLabel(tw.status)}</Tag>
          </Row>
          <T style={{ fontSize: 14, color: C.mu, marginTop: 6 }} numberOfLines={1}>{tw.aircraft_type?.split(' ')[0]} · {sqnShort(tw.squadron)} · {tw.base_station}</T>
          <Row style={{ gap: 18, marginTop: 10 }}>
            <T style={{ fontSize: 13, color: C.mu }}>Engine <Mono style={{ fontSize: 13 }}>{tw.engine_serial}</Mono></T>
            <T style={{ fontSize: 13, color: C.mu }}>Airframe <Mono style={{ fontSize: 13 }}>{Number(tw.airframe_hours).toLocaleString('en-IN', { maximumFractionDigits: 1 })} h</Mono></T>
          </Row>
          <View style={{ marginTop: 10 }}><Tabs options={['Health', 'RUL', 'Logs']} value={tab} onChange={setTab} /></View>
          {tab === 'Health' ? <HealthTab tw={tw} /> : tab === 'RUL' ? <RulTab tw={tw} /> : <LogsTab tail={tail} />}
          <T style={{ fontSize: 11, color: C.fa, marginTop: 16, textAlign: 'center' }}>{tq.data?.isLive ? 'Live digital twin' : 'Demo data'} · {baseShort(tw.base_station)}</T>
        </>
      )}
      <SortieSheet tail={tail} visible={sortie} onClose={() => setSortie(false)} />
    </Screen>
  );
}
