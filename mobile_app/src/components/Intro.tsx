import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { C, F } from '../lib/theme';
import { VMark } from './ui';
import { useReducedMotion } from '../lib/settings';

const ease = Easing.bezier(0.2, 0.7, 0.2, 1);

/**
 * Minimal intro (design v3): flat #06080C, V mark fades + scales 0.92→1 (150–850 ms),
 * wordmark fades + rises 6px (650–1150 ms), hold to 1.5 s, 200 ms crossfade into Command.
 * Reduce Motion: final frame for 600 ms, then fade.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const mark = useSharedValue(reduce ? 1 : 0);
  const word = useSharedValue(reduce ? 1 : 0);
  const root = useSharedValue(1);

  const finish = () => {
    root.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }, (f) => { if (f) runOnJS(onDone)(); });
  };

  useEffect(() => {
    if (!reduce) {
      mark.value = withDelay(150, withTiming(1, { duration: 700, easing: ease }));
      word.value = withDelay(650, withTiming(1, { duration: 500, easing: ease }));
    }
    const t = setTimeout(finish, reduce ? 600 : 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootS = useAnimatedStyle(() => ({ opacity: root.value }));
  const markS = useAnimatedStyle(() => ({ opacity: mark.value, transform: [{ scale: 0.92 + 0.08 * mark.value }] }));
  const wordS = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: 6 * (1 - word.value) }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, zIndex: 100 }, rootS]}>
      <Pressable style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onPress={finish} accessibilityLabel="Vayu AI. Tap to skip intro">
        <Animated.View style={markS}><VMark size={88} /></Animated.View>
        <View style={{ height: 24 }} />
        <Animated.Text style={[{ color: C.tx, fontFamily: F.disp, fontSize: 26, letterSpacing: 26 * 0.32, marginRight: -26 * 0.32 }, wordS]}>VAYU AI</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}
