import React, { useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, F, baseShort } from '../../lib/theme';
import { Btn, Card, Disp, Divider, Eyebrow, Icon, IconBtn, Loading, Mono, Row, Screen, Sheet, T, Tag } from '../../components/ui';
import { useUpdateWorkOrder, useWorkOrders } from '../../lib/queries';
import { ago, TECHS, WO_STAGES, bayShort, prio, shortId, stageOf, techName, woTitle } from '../../lib/wo';

const STAGE_LABEL = ['Open', 'In progress', 'QA check', 'Closed'];
const NEXT_LABEL = ['Start work', 'Move to QA check', 'Close order', 'Reopen'];

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const wq = useWorkOrders();
  const up = useUpdateWorkOrder();
  const w = (wq.data?.data || []).find((o) => o.order_id === decodeURIComponent(String(id)));
  const [checks, setChecks] = useState<Record<number, boolean>>({ 0: true, 1: true });
  const [sheet, setSheet] = useState<null | 'tech' | 'bay' | 'note'>(null);
  const [note, setNote] = useState('');
  if (!w) return <Screen><Row style={{ height: 64 }}><IconBtn ghost icon="arrow-left" onPress={() => router.back()} /></Row>{wq.data ? <T style={{ color: C.mu }}>Work order not found.</T> : <Loading />}</Screen>;
  const p = prio(w);
  const st = stageOf(w.status);
  const sub = String(w.fault_subsystem || '').split(' ')[0];
  const list = [
    `Borescope ${sub} stages`,
    `Measure wear against limits (RUL ${w.predicted_rul} h)`,
    `Replace LRU if beyond limits${w.linked_requisition ? ` · ${w.linked_requisition}` : ''}`,
    'Ground run and vibration check',
  ];
  const doneN = list.filter((_, i) => checks[i]).length;
  const advance = () => up.mutate({ id: w.order_id, u: { status: st === 3 ? 'IN_PROGRESS' : WO_STAGES[st + 1] } });

  return (
    <Screen
      footer={
        <Row style={{ gap: 10 }}>
          <Btn kind="s" label="Note" icon="note-edit-outline" onPress={() => setSheet('note')} style={{ flexGrow: 0.7 }} />
          <Btn label={NEXT_LABEL[st]} loading={up.isPending} onPress={advance} style={{ flexGrow: 1.3 }} />
        </Row>
      }
    >
      <Row style={{ height: 64, marginTop: 4 }}>
        <IconBtn ghost icon="arrow-left" label="Back" onPress={() => router.back()} />
        <View style={{ flexGrow: 1 }} />
        <IconBtn ghost icon="airplane" label="Open aircraft" onPress={() => router.push(`/aircraft/${w.tail_no}`)} />
      </Row>
      <Row style={{ gap: 8 }}>
        <Mono style={{ fontSize: 12.5, color: C.fa, fontFamily: F.mono }}>{shortId(w.order_id)}</Mono>
        <Tag tone={p.tone}>{p.label}</Tag>
        <Tag tone="info">{STAGE_LABEL[st].toUpperCase()}</Tag>
      </Row>
      <Disp style={{ fontSize: 24, marginTop: 10, lineHeight: 30 }}>{woTitle(w)}</Disp>
      <T style={{ fontSize: 13.5, color: C.mu, marginTop: 6 }}><Mono style={{ fontSize: 13.5, color: C.mu }}>{w.tail_no}</Mono> · {w.aircraft_type?.split(' ')[0] || ''} · {baseShort(w.base_station)} · {ago(w.created_at)} ago</T>

      <Row style={{ gap: 4, marginTop: 22 }}>
        {STAGE_LABEL.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= st ? C.ac : 'rgba(255,255,255,0.08)' }} />)}
      </Row>
      <Row style={{ marginTop: 8 }}>
        {STAGE_LABEL.map((s, i) => <T key={s} style={{ flex: 1, fontSize: 11.5, color: i === st ? C.tx : C.fa, fontFamily: i === st ? F.uiS : F.ui }}>{s}</T>)}
      </Row>

      <Card style={{ marginTop: 20 }}>
        {[
          { icon: 'account-hard-hat-outline' as const, l: 'Technician', v: techName(w.technician) || 'Unassigned', on: () => setSheet('tech'), warn: !w.technician },
          { icon: 'garage-variant' as const, l: 'Hangar bay', v: w.hangar_bay || '—', on: () => setSheet('bay') },
          { icon: 'tools' as const, l: 'Tooling', v: w.required_tooling || '—' },
          { icon: 'package-variant' as const, l: 'Spares', v: w.linked_requisition ? `${w.linked_requisition} · ${w.spares_allocated ? 'allocated' : 'awaiting'}` : w.spares_allocated ? 'Allocated' : 'None required' },
        ].map((r, i) => (
          <View key={r.l}>
            {i ? <Divider style={{ marginLeft: 50 }} /> : null}
            <Row style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 14 }} onPress={r.on}>
              <Icon name={r.icon} size={20} color={C.mu} />
              <T style={{ fontSize: 14, color: C.mu, width: 90 }}>{r.l}</T>
              <T style={{ flex: 1, fontSize: 14, textAlign: 'right', fontFamily: F.uiS, color: r.warn ? C.ac : C.tx }} numberOfLines={2}>{r.v}</T>
              {r.on ? <Icon name="chevron-right" size={18} color={C.fa} /> : null}
            </Row>
          </View>
        ))}
      </Card>

      <Row style={{ marginTop: 22, marginBottom: 8 }}>
        <Eyebrow style={{ flexGrow: 1 }}>Checklist</Eyebrow>
        <T style={{ fontSize: 12.5, color: C.mu }}>{doneN} / {list.length}</T>
      </Row>
      {list.map((c, i) => (
        <Row key={c} style={{ gap: 12, paddingVertical: 10 }} onPress={() => setChecks({ ...checks, [i]: !checks[i] })}>
          <View style={{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: checks[i] ? C.ac : 'transparent', borderWidth: checks[i] ? 0 : 1.5, borderColor: C.line2 }}>
            {checks[i] ? <Icon name="check" size={16} color={C.onac} /> : null}
          </View>
          <T style={{ flex: 1, fontSize: 14.5, color: checks[i] ? C.mu : C.tx, textDecorationLine: checks[i] ? 'line-through' : 'none' }}>{c}</T>
        </Row>
      ))}
      <Eyebrow style={{ marginTop: 18, marginBottom: 6 }}>Action required</Eyebrow>
      <T style={{ fontSize: 13.5, color: C.mu, lineHeight: 19 }}>{w.action_required}</T>
      {note ? <T style={{ fontSize: 13.5, marginTop: 10, color: C.info }}>Note: {note}</T> : null}

      <Sheet visible={sheet === 'tech'} onClose={() => setSheet(null)}>
        <Disp style={{ fontSize: 20, marginBottom: 8 }}>Assign technician</Disp>
        {TECHS.map((t) => (
          <Row key={t} style={{ height: 52, gap: 12 }} onPress={() => { up.mutate({ id: w.order_id, u: { technician: t } }); setSheet(null); }}>
            <Icon name={techName(w.technician) === t ? 'radiobox-marked' : 'radiobox-blank'} color={techName(w.technician) === t ? C.ac : C.mu} />
            <T style={{ fontSize: 15.5 }}>{t}</T>
          </Row>
        ))}
      </Sheet>
      <Sheet visible={sheet === 'bay'} onClose={() => setSheet(null)}>
        <Disp style={{ fontSize: 20, marginBottom: 8 }}>Hangar bay</Disp>
        {[1, 2, 3, 4, 5].map((b) => (
          <Row key={b} style={{ height: 52, gap: 12 }} onPress={() => { up.mutate({ id: w.order_id, u: { hangar_bay: `Hangar Bay 0${b}` } }); setSheet(null); }}>
            <Icon name={bayShort(w.hangar_bay) === `Bay ${b}` ? 'radiobox-marked' : 'radiobox-blank'} color={bayShort(w.hangar_bay) === `Bay ${b}` ? C.ac : C.mu} />
            <T style={{ fontSize: 15.5 }}>Hangar Bay 0{b}</T>
          </Row>
        ))}
      </Sheet>
      <Sheet visible={sheet === 'note'} onClose={() => setSheet(null)}>
        <Disp style={{ fontSize: 20, marginBottom: 12 }}>Add note</Disp>
        <TextInput multiline value={note} onChangeText={setNote} placeholder="What did you find?" placeholderTextColor={C.mu} style={{ minHeight: 100, borderWidth: 1, borderColor: C.line2, borderRadius: 14, padding: 14, color: C.tx, fontFamily: F.ui, fontSize: 15, textAlignVertical: 'top' }} />
        <View style={{ flexDirection: 'row', marginTop: 14 }}><Btn label="Save note" onPress={() => { setSheet(null); if (!note) Alert.alert('Note is empty'); }} /></View>
      </Sheet>
    </Screen>
  );
}
