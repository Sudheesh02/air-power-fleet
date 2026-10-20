import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { fleetApi } from '../../api/fleetApi';
import { C, F, baseShort } from '../../lib/theme';
import { Btn, Card, Disp, Eyebrow, Icon, IconBtn, Kpis, Loading, Mono, Row, Screen, T, Tag } from '../../components/ui';
import { useInvalidateOps, useTwin } from '../../lib/queries';

export default function Triage() {
  const { tail = 'SB-024' } = useLocalSearchParams<{ tail: string }>();
  const tq = useTwin(tail);
  const inv = useInvalidateOps();
  const m = useMutation({ mutationFn: () => fleetApi.dispatchTriage(tail), onSuccess: inv });
  const tw = tq.data?.data;
  const r = m.data?.data;
  const now = new Date();
  const stamp = `${now.getDate()} ${now.toLocaleString('en', { month: 'short' })} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;
  const done = !!r;
  const orderId = r?.order_id || r?.work_order?.order_id;
  const steps = [
    'Aircraft status set to grounded',
    'Work order raised and assigned',
    `${tw?.wear_mode?.split(' ')[0] || 'LRU'} spares reserved at ${baseShort(tw?.base_station)}`,
    'Depot requisition transmitted',
    'Squadron commander notified',
  ];

  return (
    <Screen
      footer={
        done ? (
          <Row style={{ gap: 10 }}>
            <Btn kind="s" label="Done" onPress={() => router.back()} style={{ flex: 0.8 }} />
            <Btn label="Open work order" onPress={() => router.replace(orderId ? `/order/${encodeURIComponent(orderId)}` : '/orders')} style={{ flex: 1.2 }} />
          </Row>
        ) : (
          <Row style={{ gap: 10 }}>
            <Btn kind="s" label="Cancel" onPress={() => router.back()} style={{ flex: 0.8 }} />
            <Btn label="Dispatch triage" icon="send" loading={m.isPending} onPress={() => m.mutate()} style={{ flex: 1.2 }} />
          </Row>
        )
      }
    >
      <Row style={{ height: 64, marginTop: 4 }}>
        <IconBtn ghost icon="close" label="Close" onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <Mono style={{ fontSize: 12.5, color: C.fa, fontFamily: F.mono }}>{stamp}</Mono>
      </Row>
      {!tw ? <Loading /> : (
        <>
          <Row style={{ gap: 16, marginTop: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: done ? 'rgba(52,211,153,0.14)' : 'rgba(255,181,71,0.14)', borderWidth: 1, borderColor: done ? 'rgba(52,211,153,0.4)' : 'rgba(255,181,71,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={done ? 'check' : 'medical-bag'} size={26} color={done ? C.ok : C.ac} />
            </View>
            <View style={{ flex: 1 }}>
              <Disp style={{ fontSize: 24 }}>{done ? 'Triage dispatched' : 'Dispatch triage'}</Disp>
              <T style={{ fontSize: 14, color: C.mu, marginTop: 2 }}><Mono style={{ fontSize: 14, color: C.mu }}>{tail}</Mono> {done ? 'is grounded and in the hangar queue' : 'will be grounded and queued for the hangar'}</T>
            </View>
          </Row>
          <Card style={{ padding: 18, marginTop: 22 }}>
            <Row>
              <Mono style={{ flex: 1, fontSize: 12.5, color: C.fa, fontFamily: F.mono }} numberOfLines={1}>{orderId || 'Work order pending'}</Mono>
              <Tag tone="bad">CRITICAL</Tag>
            </Row>
            <T style={{ fontSize: 17, fontFamily: F.uiS, marginTop: 10, lineHeight: 23 }}>{tw.wear_mode} inspection</T>
            {r?.action_required ? <T style={{ fontSize: 13, color: C.mu, marginTop: 6, lineHeight: 18 }}>{r.action_required}</T> : null}
            <View style={{ marginTop: 14 }}>
              <Kpis items={[
                { value: 'Bay 1', label: 'Hangar' },
                { value: 'R. Sharma', label: 'Technician' },
                { value: `~${Math.max(12, Math.round((100 - (tw.overall_health_pct || 60)) * 0.9))} h`, label: 'Back to MC' },
              ]} />
            </View>
          </Card>
          <Eyebrow style={{ marginTop: 26, marginBottom: 10 }}>{done ? 'What happened' : 'What will happen'}</Eyebrow>
          {[...steps, 'Technician acknowledges'].map((s, i, arr) => {
            const pending = !done || i === arr.length - 1;
            const last = i === arr.length - 1;
            return (
              <Row key={s} style={{ gap: 14, alignItems: 'flex-start' }}>
                <View style={{ alignItems: 'center', width: 22 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: pending ? 'transparent' : 'rgba(52,211,153,0.16)', borderWidth: pending ? 1 : 0, borderStyle: 'dashed', borderColor: last && done ? C.ac : C.line2 }}>
                    <Icon name={pending ? 'clock-outline' : 'check'} size={13} color={pending ? (last && done ? C.ac : C.fa) : C.ok} />
                  </View>
                  {!last ? <View style={{ width: 2, height: 30, backgroundColor: C.line2 }} /> : null}
                </View>
                <T style={{ flex: 1, fontSize: 15, color: last && done ? C.ac : pending ? C.mu : C.tx, fontFamily: last && done ? F.uiS : F.ui }}>{s}</T>
                <T style={{ fontSize: 12.5, color: C.fa }}>{pending ? 'pending' : 'just now'}</T>
              </Row>
            );
          })}
          {m.data ? <T style={{ fontSize: 11.5, color: C.fa, marginTop: 16 }}>{m.data.isLive ? 'Dispatched to live backend' : 'Demo mode: dispatch stored on this device for the session'}</T> : null}
        </>
      )}
    </Screen>
  );
}
