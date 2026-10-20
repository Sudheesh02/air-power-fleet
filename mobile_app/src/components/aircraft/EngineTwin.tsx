import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { C, F, healthTone, toneColor } from '../../lib/theme';
import { T } from '../ui';

/** 5-stage gas path rendered as trapezoid stages, coloured by stage health. */
export function EngineTwin({ stages }: { stages: { key: string; label: string; pct: number }[] }) {
  const W = 340, H = 140;
  const worst = stages.reduce((a, b) => (b.pct < a.pct ? b : a), stages[0]);
  const geo = [
    { x: 6, w: 64, t: 0, b: 132 }, { x: 82, w: 64, t: 20, b: 112 }, { x: 160, w: 66, t: 30, b: 104 },
    { x: 240, w: 64, t: 26, b: 110 }, { x: 316, w: 64, t: 14, b: 124 },
  ];
  const sx = W / 386;
  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="hot" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={C.bad} stopOpacity="0.25" /><Stop offset="1" stopColor={C.bad} stopOpacity="0" /></RadialGradient>
        </Defs>
        <Line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 4" />
        {stages.map((s, i) => {
          const g = geo[i];
          const col = toneColor(healthTone(s.pct));
          const x0 = g.x * sx, x1 = (g.x + g.w) * sx;
          const nxt = geo[i + 1] || g;
          const tR = (g.t + (nxt.t - g.t) * 0.4) * (H / 140), bR = (g.b + (nxt.b - g.b) * 0.4) * (H / 140);
          const tL = g.t * (H / 140), bL = g.b * (H / 140);
          const d = `M${x0} ${tL} L${x1} ${tR} L${x1} ${bR} L${x0} ${bL} Z`;
          const blades = Array.from({ length: 6 }, (_, k) => x0 + ((x1 - x0) * (k + 1)) / 7);
          return (
            <React.Fragment key={s.key}>
              {s.key === worst.key && worst.pct < 75 ? <Circle cx={(x0 + x1) / 2} cy={H / 2} r={46} fill="url(#hot)" /> : null}
              <Path d={d} fill={col} fillOpacity={0.1} stroke={col} strokeOpacity={0.85} strokeWidth={1.4} />
              {blades.map((bx, k) => <Line key={k} x1={bx} y1={tL + (tR - tL) * ((bx - x0) / (x1 - x0)) + 6} x2={bx} y2={bL + (bR - bL) * ((bx - x0) / (x1 - x0)) - 6} stroke={col} strokeOpacity={0.45} strokeWidth={1} />)}
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {stages.map((s) => (
          <View key={s.key} style={{ flex: 1, alignItems: 'center' }}>
            <T style={{ fontSize: 12, fontFamily: F.uiS, color: C.mu }}>{s.label}</T>
            <T style={{ fontSize: 13.5, fontFamily: F.uiS, color: toneColor(healthTone(s.pct)), marginTop: 2 }}>{Math.round(s.pct)}%</T>
          </View>
        ))}
      </View>
    </View>
  );
}
