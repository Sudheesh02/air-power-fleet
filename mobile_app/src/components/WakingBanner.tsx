import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onWakingChange } from '../api/fleetApi';
import { C, F } from '../lib/theme';
import { T } from './ui';

/** Shown while the Render free-tier backend cold-starts (30-60 s). */
export function WakingBanner() {
  const ins = useSafeAreaInsets();
  const [waking, setWaking] = useState(false);
  useEffect(() => onWakingChange(setWaking), []);
  if (!waking) return null;
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} pointerEvents="none" style={{ position: 'absolute', top: ins.top + 6, left: 16, right: 16, zIndex: 50 }}>
      <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#161B24', borderWidth: 1, borderColor: 'rgba(255,181,71,0.35)' }}>
        <ActivityIndicator size="small" color={C.ac} />
        <View style={{ flex: 1 }}>
          <T style={{ fontFamily: F.uiS, fontSize: 14 }}>Waking server…</T>
          <T style={{ fontSize: 12, color: C.mu, marginTop: 1 }}>The free server sleeps when idle. This can take up to a minute.</T>
        </View>
      </View>
    </Animated.View>
  );
}
