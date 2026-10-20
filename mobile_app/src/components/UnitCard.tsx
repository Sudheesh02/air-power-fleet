import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, baseShort } from '../lib/theme';
import { useSettings } from '../lib/settings';
import { fleetCounts, useAircraft, useReadiness } from '../lib/queries';
import { Btn, Card, Chip, Disp, Divider, Eyebrow, Icon, Mono, Ring, Row, Sheet, T, Tag } from './ui';

const ROLES = ['Squadron Commander', 'Station Commander', 'Engineering Officer', 'Logistics Officer', 'Flight Line Supervisor'];

/** Unit / profile card: who is using the app, for which base, with live fleet size and readiness. */
export function UnitCard() {
  const { s, set } = useSettings();
  const ac = useAircraft();
  const rd = useReadiness();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(s.unitName);
  const [role, setRole] = useState(s.role);
  const [base, setBase] = useState(s.unitBase);
  const list: any[] = ac.data?.data || [];
  const bases = Array.from(new Set(list.map((a) => a.base_station))).sort() as string[];
  const scoped = s.unitBase ? list.filter((a) => a.base_station === s.unitBase) : list;
  const n = fleetCounts(scoped.length ? scoped : undefined, s.unitBase ? undefined : rd.data?.data);
  const target = rd.data?.data?.target_mc_rate_pct ?? 75;
  const sqns = Array.from(new Set(scoped.map((a) => a.squadron))).length;
  const title = s.unitName.trim() || (s.unitBase ? `${s.unitBase}` : 'Air Power Fleet Command');
  const where = s.unitBase || 'All bases';
  const live = !!ac.data?.isLive;
  const tone = n.pct >= target ? C.ok : n.pct >= target - 15 ? C.wa : C.bad;
  const initials = title.replace(/^(No\.|AFS)\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'V';
  const edit = () => { setName(s.unitName); setRole(s.role); setBase(s.unitBase); setOpen(true); };
  const save = () => { set({ unitName: name.trim(), role: role.trim() || 'Squadron Commander', unitBase: base }); setOpen(false); };
  const input = { height: 48, borderRadius: 12, borderWidth: 1, borderColor: C.line2, backgroundColor: C.s1, paddingHorizontal: 14, color: C.tx, fontFamily: F.ui, fontSize: 15 } as const;

  return (
    <>
      <Card style={{ marginTop: 6 }} onPress={edit}>
        <Row style={{ padding: 16, gap: 14 }}>
          <LinearGradient colors={[C.g1, C.g2]} style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontFamily: F.dispB, fontSize: 18, color: C.onac }}>{initials}</T>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 18, fontFamily: F.uiS }} numberOfLines={1}>{title}</T>
            <T style={{ fontSize: 13.5, color: C.mu, marginTop: 2 }} numberOfLines={1}>{s.role} · {baseShort(where)}</T>
          </View>
          <Icon name="pencil-outline" size={19} color={C.mu} />
        </Row>
        <Divider />
        <Row style={{ padding: 16, gap: 16 }}>
          <Ring size={58} stroke={5} pct={n.pct} color={tone} track={C.track}>
            <Mono style={{ fontSize: 14 }}>{ac.isLoading ? '–' : `${n.pct}%`}</Mono>
          </Ring>
          <View style={{ flex: 1, gap: 4 }}>
            <Row style={{ gap: 8 }}>
              <Eyebrow>Readiness</Eyebrow>
              <Tag tone={live ? 'ok' : 'info'}>{live ? 'LIVE' : 'DEMO'}</Tag>
            </Row>
            <T style={{ fontSize: 14.5 }}>
              <T style={{ fontFamily: F.uiS, fontSize: 14.5 }}>{n.mc} of {n.total}</T> aircraft mission capable
            </T>
            <T style={{ fontSize: 12.5, color: C.mu }}>{n.gr} grounded · {n.deg} degraded · {sqns || '–'} squadron{sqns === 1 ? '' : 's'} · target {target}%</T>
          </View>
        </Row>
      </Card>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Disp style={{ fontSize: 22 }}>Unit profile</Disp>
        <T style={{ color: C.mu, marginTop: 4, fontSize: 13.5 }}>Shown on this device only. Readiness is scoped to the base you pick.</T>
        <Eyebrow style={{ marginTop: 18, marginBottom: 8 }}>Unit name</Eyebrow>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. No. 222 Tigersharks" placeholderTextColor={C.fa} style={input} maxLength={48} accessibilityLabel="Unit name" />
        <Eyebrow style={{ marginTop: 16, marginBottom: 8 }}>Role</Eyebrow>
        <TextInput value={role} onChangeText={setRole} placeholder="Your role" placeholderTextColor={C.fa} style={input} maxLength={40} accessibilityLabel="Role" />
        <Row style={{ gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {ROLES.map((r) => <Chip key={r} label={r} on={role === r} onPress={() => setRole(r)} />)}
        </Row>
        <Eyebrow style={{ marginTop: 16, marginBottom: 8 }}>Base</Eyebrow>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          <Chip label="All bases" on={!base} onPress={() => setBase('')} />
          {bases.map((b) => <Chip key={b} label={baseShort(b)} on={base === b} onPress={() => setBase(b)} />)}
        </Row>
        <Row style={{ gap: 10, marginTop: 22 }}>
          <Btn kind="s" label="Cancel" onPress={() => setOpen(false)} />
          <Btn label="Save" icon="check" onPress={save} />
        </Row>
      </Sheet>
    </>
  );
}
