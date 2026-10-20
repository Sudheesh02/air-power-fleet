import React from 'react';
import {
  Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop, LinearGradient as SvgLG } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C, F, Tone, toneBg, toneColor } from '../lib/theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
export const Icon = ({ name, size = 22, color = C.tx }: { name: IconName; size?: number; color?: string }) => (
  <MaterialCommunityIcons name={name} size={size} color={color} />
);

export function Backdrop() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="amb" cx="85%" cy="-10%" rx="120%" ry="60%" fx="85%" fy="-10%">
          <Stop offset="0" stopColor={C.ac} stopOpacity={C.ambOp} />
          <Stop offset="0.55" stopColor="#FFB547" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="blu" cx="0%" cy="0%" rx="90%" ry="50%" fx="0%" fy="0%">
          <Stop offset="0" stopColor={C.info} stopOpacity={C.ambOp} />
          <Stop offset="0.6" stopColor="#60A5FA" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={C.bg} />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blu)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#amb)" />
    </Svg>
  );
}

export function Screen({
  children, scroll = true, pad = true, footer, contentStyle, tabs = false,
}: {
  children: React.ReactNode; scroll?: boolean; pad?: boolean; footer?: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; tabs?: boolean;
}) {
  const ins = useSafeAreaInsets();
  const inner = [{ paddingHorizontal: pad ? 20 : 0, paddingTop: ins.top, paddingBottom: (footer ? 96 : 24) + (tabs ? 0 : ins.bottom) }, contentStyle];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Backdrop />
      {scroll ? (
        <ScrollView contentContainerStyle={inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner]}>{children}</View>
      )}
      {footer ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 + (tabs ? 0 : ins.bottom) }}>
          <LinearGradient colors={[C.fade0, C.fade1, C.bg]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const T = ({ style, ...p }: React.ComponentProps<typeof Text>) => <Text {...p} style={[{ color: C.tx, fontFamily: F.ui, fontSize: 15 }, style]} />;
export const Mono = ({ style, ...p }: React.ComponentProps<typeof Text>) => <Text {...p} style={[{ color: C.tx, fontFamily: F.monoS, fontSize: 14 }, style]} />;
export const Disp = ({ style, ...p }: React.ComponentProps<typeof Text>) => <Text {...p} style={[{ color: C.tx, fontFamily: F.disp, letterSpacing: -0.4 }, style]} />;

export function TopBar({
  title, sub, back, right, eyebrow,
}: { title?: string; sub?: string; back?: boolean | 'close'; right?: React.ReactNode; eyebrow?: React.ReactNode }) {
  return (
    <View style={{ minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
      {back ? (
        <IconBtn ghost icon={back === 'close' ? 'close' : 'arrow-left'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} label="Back" />
      ) : null}
      <View style={{ flex: 1 }}>
        {eyebrow}
        {title ? <Disp style={{ fontSize: 24 }} numberOfLines={1}>{title}</Disp> : null}
        {sub ? <T style={{ fontSize: 12.5, color: C.mu, marginTop: 2 }} numberOfLines={1}>{sub}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function IconBtn({
  icon, onPress, ghost, color = C.tx, tint, label, badge,
}: { icon: IconName; onPress?: () => void; ghost?: boolean; color?: string; tint?: string; label?: string; badge?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label || icon} onPress={onPress} hitSlop={6}
      style={({ pressed }) => [{
        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
        backgroundColor: ghost ? 'transparent' : tint || C.s2, borderWidth: ghost ? 0 : 1, borderColor: tint ? C.tintLine : C.line, opacity: pressed ? 0.7 : 1,
      }]}
    >
      <Icon name={icon} size={21} color={color} />
      {badge ? <View style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: C.bad }} /> : null}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const body = (
    <LinearGradient colors={[C.card1, C.card2]} style={[{ borderRadius: 22, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }, style]}>
      {children}
    </LinearGradient>
  );
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>{body}</Pressable> : body;
}

export const Eyebrow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <T style={[{ fontSize: 11, fontFamily: F.uiS, letterSpacing: 1.3, textTransform: 'uppercase', color: C.fa }, style]}>{children}</T>
);

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
      <Eyebrow style={{ flex: 1 }}>{title}</Eyebrow>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <T style={{ color: C.ac, fontFamily: F.uiS, fontSize: 13.5 }}>{action}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Tag({ tone, children, dot = true }: { tone: Tone; children: React.ReactNode; dot?: boolean }) {
  const c = toneColor(tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 8, borderRadius: 7, backgroundColor: toneBg[tone], alignSelf: 'flex-start' }}>
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} /> : null}
      <T style={{ color: c, fontSize: 10.5, fontFamily: F.uiB, letterSpacing: 0.6 }}>{children}</T>
    </View>
  );
}

export function Chip({ label, on, onPress, icon, count, dotColor }: { label: string; on?: boolean; onPress?: () => void; icon?: IconName; count?: number; dotColor?: string }) {
  return (
    <Pressable
      onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1, borderColor: on ? 'transparent' : C.line2, backgroundColor: on ? C.tx : 'transparent' }}
    >
      {dotColor ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor }} /> : null}
      {icon ? <Icon name={icon} size={16} color={on ? C.bg : C.tx} /> : null}
      <T style={{ fontSize: 12.5, fontFamily: F.uiS, color: on ? C.bg : C.tx }}>{label}</T>
      {count != null ? <T style={{ fontSize: 12.5, fontFamily: F.uiS, color: on ? C.bg : C.mu }}>{count}</T> : null}
    </Pressable>
  );
}

export function Btn({
  label, icon, kind = 'p', onPress, style, loading, disabled, width,
}: { label: string; icon?: IconName; kind?: 'p' | 's'; onPress?: () => void; style?: StyleProp<ViewStyle>; loading?: boolean; disabled?: boolean; width?: number }) {
  const inner = (
    <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading ? <ActivityIndicator color={kind === 'p' ? C.onac : C.tx} /> : icon ? <Icon name={icon} size={20} color={kind === 'p' ? C.onac : C.tx} /> : null}
      <T style={{ fontFamily: F.uiS, fontSize: 15, color: kind === 'p' ? C.onac : C.tx }}>{label}</T>
    </View>
  );
  return (
    <Pressable
      onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [width ? { width, flexGrow: 0, flexShrink: 0 } : { flexGrow: 1, flexBasis: 0 }, { borderRadius: 26, overflow: 'hidden', opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, kind === 'p' ? styles.glow : { backgroundColor: C.s2, borderWidth: 1, borderColor: C.line2 }, style]}
    >
      {kind === 'p' ? <LinearGradient colors={[C.g1, C.g2]} style={{ borderRadius: 26 }}>{inner}</LinearGradient> : inner}
    </Pressable>
  );
}

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: 1, backgroundColor: C.line }, style]} />;

export function Ring({
  size = 46, stroke = 4, pct, color, track = C.track, children,
}: { size?: number; stroke?: number; pct: number; color: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${(c * Math.max(0, Math.min(100, pct))) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Kpis({ items }: { items: { value: string; label: string; color?: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((k) => (
        <LinearGradient key={k.label} colors={[C.card1, C.card2]} style={{ flex: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 11, borderRadius: 16, borderWidth: 1, borderColor: C.line }}>
          <Disp style={{ fontSize: 24, color: k.color || C.tx }} numberOfLines={1} adjustsFontSizeToFit>{k.value}</Disp>
          <T style={{ fontSize: 11.5, color: C.mu }} numberOfLines={1}>{k.label}</T>
        </LinearGradient>
      ))}
    </View>
  );
}

export function StackBar({ parts }: { parts: { n: number; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
      {parts.filter((p) => p.n > 0).map((p, i) => <View key={i} style={{ flex: p.n, height: 8, backgroundColor: p.color }} />)}
    </View>
  );
}

export function Seg({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.s1, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 3 }}>
      {options.map((o) => (
        <Pressable key={o.key} onPress={() => onChange(o.key)} accessibilityRole="tab" accessibilityState={{ selected: o.key === value }}
          style={{ flex: 1, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: o.key === value ? C.segOn : 'transparent' }}>
          <T style={{ fontSize: 12.5, fontFamily: F.uiS, color: o.key === value ? C.tx : C.mu }}>{o.label}</T>
        </Pressable>
      ))}
    </View>
  );
}

export function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (k: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: C.line, marginHorizontal: -20, paddingHorizontal: 20 }}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="tab" accessibilityState={{ selected: o === value }} style={{ flex: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 13 }}>
          <T style={{ fontSize: 14, fontFamily: F.uiS, color: o === value ? C.tx : C.mu }}>{o}</T>
          {o === value ? <View style={{ position: 'absolute', bottom: -1, width: 44, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: C.ac }} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const ins = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={onClose} accessibilityLabel="Close sheet" />
      <View style={{ backgroundColor: C.sheet, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.line2, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 + ins.bottom, maxHeight: '92%' }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.handle, alignSelf: 'center', marginBottom: 14 }} />
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function Row({ children, style, onPress }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const st = [{ flexDirection: 'row' as const, alignItems: 'center' as const }, style];
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [...st, { opacity: pressed ? 0.7 : 1 }]}>{children}</Pressable> : <View style={st}>{children}</View>;
}

export function Spark({ data, color, w = 150, h = 34, dot = true }: { data: number[]; color: string; w?: number; h?: number; dot?: boolean }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 8) + 2, h - 4 - ((v - min) / (max - min || 1)) * (h - 10)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgLG id="sg" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity="0.25" /><Stop offset="1" stopColor={color} stopOpacity="0" /></SvgLG>
      </Defs>
      <Path d={`${d} L${last[0]} ${h} L2 ${h} Z`} fill="url(#sg)" />
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
      {dot ? <Circle cx={last[0]} cy={last[1]} r={4.5} fill={C.dot} stroke={color} strokeWidth={2.5} /> : null}
    </Svg>
  );
}

export function LiveBadge({ live }: { live: boolean }) {
  return <Tag tone={live ? 'ok' : 'info'}>{live ? 'LIVE' : 'DEMO'}</Tag>;
}

export function Loading() {
  return <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator color={C.ac} /></View>;
}

export function VMark({ size = 88 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 88 88">
      <Defs>
        <SvgLG id="vm" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor="#FF9A3C" /><Stop offset="1" stopColor="#FFD27A" /></SvgLG>
      </Defs>
      <Path d="M10 18 L30 18 L44 52 L58 18 L78 18 L44 76 Z" fill="url(#vm)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  glow: { shadowColor: C.glow, shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
