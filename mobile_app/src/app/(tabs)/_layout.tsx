import { useThemeMode } from '../../lib/settings';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../../lib/theme';
import { Icon, IconName, T } from '../../components/ui';

const META: Record<string, { label: string; icon: IconName; iconOn: IconName }> = {
  index: { label: 'Command', icon: 'radar', iconOn: 'radar' },
  fleet: { label: 'Fleet', icon: 'airplane', iconOn: 'airplane' },
  logistics: { label: 'Logistics', icon: 'archive-outline', iconOn: 'archive' },
  orders: { label: 'Orders', icon: 'wrench-outline', iconOn: 'wrench' },
  copilot: { label: 'Copilot', icon: 'waveform', iconOn: 'waveform' },
};

function Bar({ state, navigateToTab }: BottomTabBarProps) {
  useThemeMode();
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', height: 80 + ins.bottom, paddingBottom: ins.bottom, backgroundColor: C.nav, borderTopWidth: 1, borderColor: C.line }}>
      {state.routes.map((r, i) => {
        const m = META[r.name];
        if (!m) return null;
        const on = state.index === i;
        return (
          <Pressable
            key={r.key} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={m.label}
            onPress={() => { if (!on) navigateToTab(r.key); }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <View style={{ width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.tint : 'transparent' }}>
              <Icon name={on ? m.iconOn : m.icon} size={22} color={on ? C.ac : C.mu} />
            </View>
            <T style={{ fontSize: 12, fontFamily: on ? F.uiS : F.uiM, color: on ? C.tx : C.mu }}>{m.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  useThemeMode();
  return (
    <Tabs tabBar={(p) => <Bar {...p} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg }, animation: 'fade' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="fleet" />
      <Tabs.Screen name="logistics" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="copilot" />
    </Tabs>
  );
}
