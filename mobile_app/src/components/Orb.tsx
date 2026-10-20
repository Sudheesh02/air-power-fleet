import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { useReducedMotion } from '../lib/settings';

const PAL = {
  blue: { a: ['#9AD1FF', '#3B82F6'], b: '#60A5FA', core: 'rgba(150,200,255,0.7)' },
  amber: { a: ['#FFE0A8', '#FFB547'], b: '#FF8A3D', core: 'rgba(255,214,150,0.7)' },
  green: { a: ['#A7F3D0', '#10B981'], b: '#34D399', core: 'rgba(167,243,208,0.7)' },
};

function Blob({ id, size, inner, outer, opacity = 1 }: { id: string; size: number; inner: string; outer: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} style={{ opacity }}>
      <Defs>
        <RadialGradient id={id} cx="42%" cy="40%" r="50%">
          <Stop offset="0" stopColor={inner} stopOpacity="1" />
          <Stop offset="0.5" stopColor={outer} stopOpacity="0.85" />
          <Stop offset="1" stopColor={outer} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Layered radial orb. `level` (0..1) swells it with mic volume; `orbit` adds the thinking arc. */
export function Orb({ tone = 'blue', size = 240, level, orbit = false }: { tone?: keyof typeof PAL; size?: number; level?: SharedValue<number>; orbit?: boolean }) {
  const reduce = useReducedMotion();
  const p = PAL[tone];
  const breathe = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    breathe.value = withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })), -1);
    spin.value = withRepeat(withTiming(360, { duration: 1200, easing: Easing.linear }), -1);
    return () => { cancelAnimation(breathe); cancelAnimation(spin); };
  }, [reduce]);
  const main = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * breathe.value + (level ? 0.12 * level.value : 0) }] }));
  const drift = useAnimatedStyle(() => ({ transform: [{ translateX: -10 + 14 * breathe.value }, { translateY: 6 - 10 * breathe.value }, { scale: 0.92 + 0.1 * breathe.value }] }));
  const rot = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const s = size;
  return (
    <View style={{ width: s, height: s, alignSelf: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, drift]}>
        <Blob id={`b-${tone}`} size={s * 0.8} inner={p.b} outer={p.b} opacity={0.45} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, main]}>
        <Blob id={`a-${tone}`} size={orbit ? s * 0.62 : s * 0.84} inner={p.a[0]} outer={p.a[1]} />
      </Animated.View>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Blob id={`c-${tone}`} size={orbit ? s * 0.3 : s * 0.48} inner="#FFFFFF" outer={p.core} opacity={0.9} />
      </View>
      {orbit ? (
        <Animated.View style={[StyleSheet.absoluteFill, rot]}>
          <Svg width={s} height={s}>
            <Defs>
              <LinearGradient id="orb-arc" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFB547" stopOpacity="0" /><Stop offset="1" stopColor="#FFE0A8" /></LinearGradient>
            </Defs>
            <Circle cx={s / 2} cy={s / 2} r={s * 0.433} stroke="url(#orb-arc)" strokeWidth={1.6} fill="none" strokeDasharray={`${s * 0.79} ${s * 1.92}`} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Bar waveform driven by a 0..1 level (mic) or a looping pseudo-signal (speaking). */
export function Wave({ color, bars = 36, level, active = true, height = 70 }: { color: string; bars?: number; level?: SharedValue<number>; active?: boolean; height?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active || reduce) return;
    t.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1);
    return () => cancelAnimation(t);
  }, [active, reduce]);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {Array.from({ length: bars }, (_, i) => <Bar key={i} i={i} n={bars} t={t} level={level} color={color} height={height} />)}
    </View>
  );
}

function Bar({ i, n, t, level, color, height }: { i: number; n: number; t: SharedValue<number>; level?: SharedValue<number>; color: string; height: number }) {
  const env = Math.sin((Math.PI * (i + 0.5)) / n);
  const st = useAnimatedStyle(() => {
    const ph = Math.sin(t.value * Math.PI * 2 * 2 + i * 0.7) * 0.5 + 0.5;
    const ph2 = Math.sin(t.value * Math.PI * 2 + i * 1.9) * 0.5 + 0.5;
    const lv = level ? level.value : 0.7;
    return { height: Math.max(4, height * env * (0.15 + 0.85 * lv * (0.4 * ph + 0.6 * ph2))) };
  });
  return <Animated.View style={[{ width: 3.5, borderRadius: 3, backgroundColor: color, opacity: 0.4 + 0.6 * env }, st]} />;
}
