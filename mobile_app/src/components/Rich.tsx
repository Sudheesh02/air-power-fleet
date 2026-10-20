import React from 'react';
import { View } from 'react-native';
import { C, F } from '../lib/theme';
import { T } from './ui';

const clean = (s: string) =>
  s.replace(/\$T_\{(\d+)\}\$/g, 'T$1').replace(/\$P_\{(\d+)\}\$/g, 'P$1').replace(/\$([^$]*)\$/g, (_, m) => m.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\^\{\\circ\}/g, '°').replace(/\\circ/g, '°').replace(/\\lambda/g, 'λ').replace(/\\mu/g, 'μ').replace(/\\sigma/g, 'σ').replace(/\\hat\{y\}/g, 'ŷ').replace(/\\alpha/g, 'α').replace(/[{}\\]/g, '')).replace(/\\\\/g, '');

/** Renders the copilot's display text: paragraphs, "Heading:" lines and • bullets, unboxed like a chat answer. */
export function Rich({ text }: { text: string }) {
  const lines = clean(text).split('\n');
  return (
    <View style={{ gap: 6 }}>
      {lines.map((l, i) => {
        const t = l.trim();
        if (!t) return <View key={i} style={{ height: 4 }} />;
        if (/^[•-]/.test(t)) {
          const body = t.replace(/^[•-]\s*/, '');
          const [k, ...rest] = body.split(': ');
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: l.startsWith('  ') ? 14 : 0 }}>
              <T style={{ color: C.ac, fontSize: 15, lineHeight: 22 }}>•</T>
              <T style={{ flex: 1, fontSize: 15, lineHeight: 22 }}>
                {rest.length ? <><T style={{ fontFamily: F.uiS, fontSize: 15 }}>{k}: </T>{rest.join(': ')}</> : body}
              </T>
            </View>
          );
        }
        if (/:$/.test(t) && t.length < 60) return <T key={i} style={{ fontSize: 12, fontFamily: F.uiS, letterSpacing: 0.8, color: C.mu, marginTop: 6, textTransform: 'uppercase' }}>{t.replace(/:$/, '')}</T>;
        return <T key={i} style={{ fontSize: 16, lineHeight: 24 }}>{t}</T>;
      })}
    </View>
  );
}
