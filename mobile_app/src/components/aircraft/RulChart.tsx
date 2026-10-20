import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SText } from 'react-native-svg';
import { C } from '../../lib/theme';

function smooth(p: number[][]) {
  // Catmull-Rom → cubic bezier
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Past RUL (solid, area) → dashed forecast with a conformal cone; maintenance floor line. */
export function RulChart({ past, lo, hi, floor = 20, color = C.ac, labels }: { past: number[]; lo: number; hi: number; floor?: number; color?: string; labels: string[] }) {
  const W = 360, H = 210, padB = 22, fx = W * 0.78;
  const max = Math.max(...past, hi) * 1.08;
  const y = (v: number) => (H - padB) - (v / max) * (H - padB - 8);
  const pts = past.map((v, i) => [(i / (past.length - 1)) * fx, y(v)]);
  const last = pts[pts.length - 1];
  const mid = (lo + hi) / 2;
  const endMid = Math.max(0, mid - (past[0] - past[past.length - 1]) * 0.25);
  const cone = `M${last[0]} ${last[1]} L${W - 4} ${y(Math.max(0, endMid + (hi - lo) * 0.7))} L${W - 4} ${y(Math.max(0, endMid - (hi - lo) * 0.7))} Z`;
  const line = smooth(pts);
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="ra" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity="0.32" /><Stop offset="1" stopColor={color} stopOpacity="0" /></LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((f) => <Line key={f} x1={0} x2={W} y1={(H - padB) * f} y2={(H - padB) * f} stroke="rgba(255,255,255,0.05)" />)}
        <Path d={`${line} L${last[0]} ${H - padB} L0 ${H - padB} Z`} fill="url(#ra)" />
        <Path d={line} stroke={color} strokeWidth={2.4} fill="none" />
        <Path d={cone} fill={color} fillOpacity={0.12} />
        <Line x1={last[0]} y1={last[1]} x2={W - 4} y2={y(endMid)} stroke={color} strokeWidth={2} strokeDasharray="5 5" />
        <Line x1={0} x2={W} y1={y(floor)} y2={y(floor)} stroke={C.bad} strokeOpacity={0.7} strokeDasharray="4 4" />
        <SText x={4} y={y(floor) - 6} fill={C.bad} fontSize={10.5} fontFamily="IBMPlexMono_500Medium">maintenance floor {floor} h</SText>
        <Circle cx={last[0]} cy={last[1]} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
        {labels.map((l, i) => <SText key={l + i} x={(i / (labels.length - 1)) * (W - 30) + 2} y={H - 4} fill={C.fa} fontSize={10.5} fontFamily="Inter_500Medium">{l}</SText>)}
      </Svg>
    </View>
  );
}
