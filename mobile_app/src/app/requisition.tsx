import { useThemeMode } from '../lib/settings';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { fleetApi } from '../api/fleetApi';
import { C, F, toneBg } from '../lib/theme';
import { Btn, Card, Disp, Icon, IconBtn, Mono, Row, Screen, Sheet, T, Tag } from '../components/ui';
import { useInvalidateOps, useInventory, useWorkOrders } from '../lib/queries';
import { shortId } from '../lib/wo';

const PRIOS = [
  { key: 'ROUTINE', label: 'Routine', eta: 72 },
  { key: 'URGENT', label: 'Urgent', eta: 24 },
  { key: 'CRITICAL_AOG', label: 'AOG', eta: 8 },
];
const DEPOTS = ['3 BRD Chandigarh', '11 BRD Nashik', 'HAL Engine Division (Bengaluru)'];

export default function Requisition() {
  useThemeMode();
  const p = useLocalSearchParams<{ tail?: string; base?: string; part?: string; trigger?: string }>();
  const iq = useInventory();
  const wq = useWorkOrders();
  const inv = useInvalidateOps();
  const spares = iq.data?.data?.base_spares || [];
  const [base, setBase] = useState(p.base || 'AFS Thanjavur');
  const baseParts = spares.filter((s: any) => s.base_station === base);
  const [partName, setPartName] = useState(p.part || '');
  const part = baseParts.find((s: any) => s.component_name === partName) || baseParts.find((s: any) => s.quantity_on_hand < s.safety_stock_threshold) || baseParts[0];
  const fill = part ? Math.max(1, part.safety_stock_threshold - part.quantity_on_hand + 1) : 1;
  const [qty, setQty] = useState<number | null>(null);
  const q = qty ?? fill;
  const [prio, setPrio] = useState(p.trigger ? 'CRITICAL_AOG' : 'URGENT');
  const [sheet, setSheet] = useState<null | 'part' | 'base'>(null);
  const [saved, setSaved] = useState(false);
  const tail = p.tail || (wq.data?.data || []).find((w) => w.base_station === base && w.status !== 'RESOLVED')?.tail_no || '';
  const wo = (wq.data?.data || []).find((w) => w.tail_no === tail && w.status !== 'RESOLVED');
  const eta = PRIOS.find((x) => x.key === prio)!.eta;
  const arrive = new Date(Date.now() + eta * 3600000).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const depot = part?.subsystem === 'Fuel System' || part?.subsystem === 'FADEC/Avionics' ? DEPOTS[2] : DEPOTS[0];
  const bases = useMemo(() => Array.from(new Set(spares.map((s: any) => s.base_station))) as string[], [spares]);
  const m = useMutation({
    mutationFn: () => fleetApi.createEmergencyRequisition({
      tail_no: tail || 'FLEET', base_station: base, component_name: `${part?.component_name} ×${q}`, priority: prio, status: 'PENDING_APPROVAL', eta_hours: eta, depot_source: depot,
    }),
    onSuccess: () => {
      if (p.trigger) fleetApi.approveAiReorderTrigger(String(p.trigger));
      inv();
    },
  });

  if (m.data) {
    return (
      <Screen footer={<Row><Btn label="Back to logistics" onPress={() => router.back()} /></Row>}>
        <View style={{ alignItems: 'flex-start', marginTop: 90 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: toneBg.ok, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={26} color={C.ok} /></View>
          <Disp style={{ fontSize: 26, marginTop: 16 }}>Requisition raised</Disp>
          <Mono style={{ marginTop: 8, color: C.mu }}>{m.data.data?.req_id}</Mono>
          <T style={{ color: C.mu, marginTop: 8, lineHeight: 21 }}>{q} × {part?.component_name} from {depot} to {base}. Expected {arrive}. {m.data.isLive ? '' : '(Demo mode: stored on this device.)'}</T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Row><Btn label="Submit requisition" loading={m.isPending} disabled={!part} onPress={() => m.mutate()} /></Row>}>
      <Row style={{ height: 64, marginTop: 4, gap: 8 }}>
        <IconBtn ghost icon="close" label="Close" onPress={() => router.back()} />
        <Disp style={{ flex: 1, fontSize: 22 }}>New requisition</Disp>
        <Pressable onPress={() => setSaved(true)} hitSlop={8}><T style={{ color: C.ac, fontFamily: F.uiS, fontSize: 15 }}>{saved ? 'Saved' : 'Save draft'}</T></Pressable>
      </Row>
      {tail ? (
        <Row style={{ gap: 10, padding: 14, borderRadius: 16, backgroundColor: toneBg.info, borderWidth: 1, borderColor: C.infoLine, marginTop: 6 }}>
          <Icon name="link-variant" size={18} color={C.info} />
          <T style={{ flex: 1, fontSize: 14 }}>For <Mono style={{ fontSize: 14 }}>{tail}{wo ? ` · ${shortId(wo.order_id)}` : ''}</Mono></T>
          <Pressable onPress={() => router.push('/orders')}><T style={{ color: C.info, fontFamily: F.uiS }}>Change</T></Pressable>
        </Row>
      ) : null}
      <Pressable onPress={() => setSheet('part')} style={{ borderWidth: 1, borderColor: C.line2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 14 }}>
        <T style={{ fontSize: 12, color: C.mu }}>Part</T>
        <Row style={{ gap: 6, marginTop: 3 }}>
          <T style={{ fontSize: 16, fontFamily: F.uiM, flexShrink: 1 }} numberOfLines={1}>{part?.component_name || 'Select a part'}</T>
          <Mono style={{ fontSize: 12.5, color: C.mu, fontFamily: F.mono }}>{part?.part_number}</Mono>
          <View style={{ flex: 1 }} />
          <Icon name="magnify" size={19} color={C.mu} />
        </Row>
      </Pressable>
      <T style={{ fontSize: 13, color: C.mu, marginTop: 18, marginBottom: 8 }}>Quantity</T>
      <Row style={{ gap: 14 }}>
        <Row style={{ width: 176, height: 56, borderRadius: 14, borderWidth: 1, borderColor: C.line2 }}>
          <Pressable onPress={() => setQty(Math.max(1, q - 1))} style={{ width: 52, height: 56, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Decrease"><Icon name="minus" /></Pressable>
          <Mono style={{ flex: 1, textAlign: 'center', fontSize: 18 }}>{q}</Mono>
          <Pressable onPress={() => setQty(q + 1)} style={{ width: 52, height: 56, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Increase"><Icon name="plus" /></Pressable>
        </Row>
        <T style={{ flex: 1, fontSize: 13, color: C.mu, lineHeight: 18 }}>{q === fill ? 'Fills the bin to minimum' : 'Custom quantity'}{part ? `\n(${part.quantity_on_hand} in stock, min ${part.safety_stock_threshold})` : ''}</T>
      </Row>
      <T style={{ fontSize: 13, color: C.mu, marginTop: 18, marginBottom: 8 }}>Priority</T>
      <Row style={{ gap: 6 }}>
        {PRIOS.map((x) => {
          const on = x.key === prio;
          return (
            <Pressable key={x.key} onPress={() => setPrio(x.key)} accessibilityState={{ selected: on }} style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: on ? C.badLine : C.line2, backgroundColor: on ? toneBg.bad : 'transparent', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
              {on && x.key === 'CRITICAL_AOG' ? <Icon name="exclamation" size={14} color={C.bad} /> : null}
              <T style={{ fontSize: 13.5, fontFamily: F.uiS, color: on ? C.bad : C.mu }}>{x.label}</T>
            </Pressable>
          );
        })}
      </Row>
      <Pressable onPress={() => setSheet('base')} style={{ borderWidth: 1, borderColor: C.line2, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginTop: 18 }}>
        <T style={{ fontSize: 12, color: C.mu }}>Deliver to</T>
        <Row style={{ marginTop: 3 }}>
          <T style={{ flex: 1, fontSize: 16, fontFamily: F.uiM }}>{base}{wo?.hangar_bay ? ` · ${wo.hangar_bay.replace(/Hangar Bay 0?/, 'Bay ').replace(/\s*\(.*\)/, '')}` : ''}</T>
          <Icon name="chevron-down" size={20} color={C.mu} />
        </Row>
      </Pressable>
      <Card style={{ padding: 16, marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Icon name="truck-fast-outline" size={24} color={C.ok} />
        <View style={{ flex: 1 }}>
          <T style={{ fontSize: 15.5, fontFamily: F.uiS }}>{depot.replace(/ \(.*\)/, '')} · in stock</T>
          <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }}>{prio === 'CRITICAL_AOG' ? 'IAF airlift scramble' : 'IAF air courier'} · arrives {arrive}</T>
        </View>
        <Tag tone="ok">BEST</Tag>
      </Card>

      <Sheet visible={sheet === 'part'} onClose={() => setSheet(null)}>
        <Disp style={{ fontSize: 20, marginBottom: 8 }}>Part at {base}</Disp>
        {baseParts.map((s: any) => (
          <Row key={s.item_id} style={{ minHeight: 56, gap: 12 }} onPress={() => { setPartName(s.component_name); setQty(null); setSheet(null); }}>
            <Icon name={s.component_name === part?.component_name ? 'radiobox-marked' : 'radiobox-blank'} color={s.component_name === part?.component_name ? C.ac : C.mu} />
            <View style={{ flex: 1 }}>
              <T style={{ fontSize: 15 }}>{s.component_name}</T>
              <Mono style={{ fontSize: 12, color: C.mu, fontFamily: F.mono }}>{s.part_number} · {s.quantity_on_hand}/{s.safety_stock_threshold}</Mono>
            </View>
          </Row>
        ))}
      </Sheet>
      <Sheet visible={sheet === 'base'} onClose={() => setSheet(null)}>
        <Disp style={{ fontSize: 20, marginBottom: 8 }}>Deliver to</Disp>
        {bases.map((b) => (
          <Row key={b} style={{ height: 52, gap: 12 }} onPress={() => { setBase(b); setPartName(''); setQty(null); setSheet(null); }}>
            <Icon name={b === base ? 'radiobox-marked' : 'radiobox-blank'} color={b === base ? C.ac : C.mu} />
            <T style={{ fontSize: 15.5 }}>{b}</T>
          </Row>
        ))}
      </Sheet>
    </Screen>
  );
}
