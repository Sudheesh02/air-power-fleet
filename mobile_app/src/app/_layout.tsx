import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { IBMPlexMono_500Medium, IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider, useSettings } from '../lib/settings';
import { CopilotProvider } from '../lib/copilot';
import { Intro } from '../components/Intro';
import { WakingBanner } from '../components/WakingBanner';
import { C } from '../lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions?.({ duration: 0, fade: false });

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 0 } } });

function Root() {
  const { ready, mode } = useSettings();
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    IBMPlexMono_500Medium, IBMPlexMono_600SemiBold,
  });
  const [introDone, setIntroDone] = useState(false);
  const loaded = fontsLoaded && ready;
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style={mode === 'day' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="voice" options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="triage/[tail]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="requisition" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
      <WakingBanner />
      {!introDone ? <Intro onDone={() => setIntroDone(true)} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <SettingsProvider>
          <CopilotProvider>
            <Root />
          </CopilotProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
