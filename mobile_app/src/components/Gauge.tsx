import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { C, F } from '../lib/theme';
import { T } from './ui';
import { useReducedMotion } from '../lib/settings';

const AP = Animated.createAnimatedComponent(Path);

/** 270° readiness arc with tick marks, from the Command hero. */
export function ReadinessGauge({ pct, size = 200 }: { pct: number; size?: number }) {
  const reduce = useReducedMotion();
  const cx = size / 2, cy = size / 2, r = size / 2 - 16;
  const start = 135, sweep = 270;
  const pt = (a: number, rr = r) => { const t = (a * Math.PI) / 180; return [cx + rr * Math.cos(t), cy + rr * Math.sin(t)]; };
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
    return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const len = (Math.PI * 2 * r * sweep) / 360;
  const p = useSharedValue(reduce ? pct : 0);
  useEffect(() => { p.value = reduce ? pct : withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [pct, reduce]);
  const ap = useAnimatedProps(() => ({ strokeDashoffset: len * (1 - p.value / 100) }));
  const end = pt(start + (sweep * pct) / 100);
  const ticks = Array.from({ length: 28 }, (_, i) => start + (sweep * i) / 27);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="gg" x1="0" y1="1" x2="1" y2="0"><Stop offset="0" stopColor="#FF8A3D" /><Stop offset="1" stopColor="#FFD27A" /></LinearGradient>
        </Defs>
        {ticks.map((a, i) => { const [x0, y0] = pt(a, r + 9), [x1, y1] = pt(a, r + (i % 3 === 0 ? 14 : 12)); return <Line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} />; })}
        <Path d={arc(start, start + sweep)} stroke="rgba(255,255,255,0.08)" strokeWidth={12} fill="none" strokeLinecap="round" />
        <AP d={arc(start, start + sweep)} stroke="url(#gg)" strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray={`${len} ${len}`} animatedProps={ap} />
        <Circle cx={end[0]} cy={end[1]} r={6} fill="#fff" stroke="#FFC566" strokeWidth={2} />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <T style={{ fontFamily: F.disp, fontSize: 56, letterSpacing: -1.5, lineHeight: 62 }}>{pct}</T>
        <T style={{ fontFamily: F.disp, fontSize: 24, color: C.mu, marginTop: 26 }}>%</T>
      </View>
      <T style={{ fontSize: 11, fontFamily: F.uiS, letterSpacing: 1.6, color: C.mu, marginTop: 2 }}>FLEET READY</T>
    </View>
  );
}
