import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F, baseShort } from '../../lib/theme';
import { Disp, Divider, Icon, IconBtn, Kpis, Loading, Mono, Row, Screen, T, Tabs } from '../../components/ui';
import { useWorkOrders } from '../../lib/queries';
import { ago, hoursAgo, bayShort, groupOf, initials, prio, shortId, techName, woTitle } from '../../lib/wo';

export default function Orders() {
  const wq = useWorkOrders();
  const [tab, setTab] = useState('open');
  const [q, setQ] = useState<string | null>(null);
  const [critFirst, setCritFirst] = useState(true);
  const all = wq.data?.data || [];
  const counts = { open: 0, progress: 0, closed: 0 } as Record<string, number>;
  all.forEach((w) => counts[groupOf(w.status)]++);
  const active = all.filter((w) => groupOf(w.status) !== 'closed');
  const shown = all
    .filter((w) => groupOf(w.status) === tab)
    .filter((w) => !q || JSON.stringify(w).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (critFirst ? (b.severity_tier || 0) - (a.severity_tier || 0) : 0));
  const tabLabels = { open: `Open ${counts.open}`, progress: `In progress ${counts.progress}`, closed: 'Closed' } as Record<string, string>;
  const inv = Object.fromEntries(Object.entries(tabLabels).map(([k, v]) => [v, k]));

  return (
    <View style={{ flex: 1 }}>
      <Screen tabs>
        <Row style={{ minHeight: 72, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Disp style={{ fontSize: 26 }}>Work orders</Disp>
            <T style={{ fontSize: 13.5, color: C.mu, marginTop: 2 }}>All bases · {active.length} open</T>
          </View>
          <Row style={{ gap: 10 }}>
            <IconBtn icon="magnify" label="Search orders" onPress={() => setQ(q == null ? '' : null)} />
            <IconBtn icon="filter-variant" label={critFirst ? 'Sort by newest' : 'Sort by priority'} onPress={() => setCritFirst(!critFirst)} />
          </Row>
        </Row>
        {q != null ? <TextInput autoFocus value={q} onChangeText={setQ} placeholder="Tail, part or technician" placeholderTextColor={C.mu} style={{ height: 46, borderRadius: 23, backgroundColor: C.s2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, color: C.tx, fontFamily: F.ui, marginBottom: 10 }} /> : null}
        {!wq.data ? <Loading /> : (
          <>
            <Kpis items={[
              { value: String(active.filter((w) => w.severity_label === 'CRITICAL_AOG').length), label: 'Critical', color: C.bad },
              { value: String(active.filter((w) => !w.technician).length), label: 'Unassigned', color: C.wa },
              { value: String(active.filter((w) => (hoursAgo(w.created_at) ?? 99) < 24 && w.severity_tier >= 3).length), label: 'Due today' },
            ]} />
            <View style={{ marginTop: 8 }}><Tabs options={Object.values(tabLabels)} value={tabLabels[tab]} onChange={(l) => setTab(inv[l])} /></View>
            {shown.map((w, i) => {
              const p = prio(w);
              return (
                <View key={w.order_id}>
                  {i ? <Divider /> : null}
                  <Pressable onPress={() => router.push(`/order/${encodeURIComponent(w.order_id)}`)} style={({ pressed }) => ({ paddingVertical: 14, paddingLeft: 16, opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, borderRadius: 2, backgroundColor: p.color }} />
                    <Row style={{ gap: 8 }}>
                      <Mono style={{ fontSize: 14.5 }}>{w.tail_no}</Mono>
                      <Mono style={{ flex: 1, fontSize: 12.5, color: C.fa, fontFamily: F.mono }} numberOfLines={1}>{shortId(w.order_id)}</Mono>
                      <T style={{ fontSize: 12, fontFamily: F.uiB, letterSpacing: 0.6, color: p.color }}>{p.label}</T>
                    </Row>
                    <T style={{ fontSize: 16, fontFamily: F.uiM, marginTop: 4 }} numberOfLines={1}>{woTitle(w)}</T>
                    <Row style={{ marginTop: 8, gap: 8 }}>
                      {w.technician ? (
                        <>
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.s2, alignItems: 'center', justifyContent: 'center' }}>
                            <T style={{ fontSize: 9.5, fontFamily: F.uiB }}>{initials(w.technician)}</T>
                          </View>
                          <T style={{ flex: 1, fontSize: 13.5, color: C.mu }} numberOfLines={1}>{techName(w.technician)}</T>
                        </>
                      ) : (
                        <>
                          <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.ac }} />
                          <T style={{ flex: 1, fontSize: 13.5, color: C.ac, fontFamily: F.uiS }}>Assign technician</T>
                        </>
                      )}
                      <Mono style={{ fontSize: 12, color: C.fa, fontFamily: F.mono }}>{bayShort(w.hangar_bay)} · {ago(w.created_at)}</Mono>
                    </Row>
                    <T style={{ fontSize: 11.5, color: C.fa, marginTop: 4 }}>{baseShort(w.base_station)} · {String(w.status).replace(/_/g, ' ').toLowerCase()}</T>
                  </Pressable>
                </View>
              );
            })}
            {!shown.length ? <T style={{ color: C.mu, textAlign: 'center', marginTop: 30 }}>Nothing here.</T> : null}
            <View style={{ height: 70 }} />
          </>
        )}
      </Screen>
      <Pressable onPress={() => router.push('/fleet')} accessibilityLabel="New work order from an aircraft" style={{ position: 'absolute', right: 20, bottom: 16, borderRadius: 18, overflow: 'hidden', elevation: 10, shadowColor: '#FFAA32', shadowOpacity: 0.6, shadowRadius: 16 }}>
        <LinearGradient colors={['#FFC566', '#FFA930']} style={{ height: 56, paddingLeft: 16, paddingRight: 20, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="plus" size={22} color={C.onac} />
          <T style={{ fontFamily: F.uiB, fontSize: 15, color: C.onac }}>New order</T>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
