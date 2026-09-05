// global.css is required for NativeWind class compilation.

import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fbColors } from '@/components/ui/fb';
import { hasVerifiedSession, initializeAuth, useAuthStore } from '@/lib/auth/session';
import { initializeCaseWorkspace, useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import { initializeTemporarySourceCleanup } from '@/lib/evidence/sourceCleanup';
import { TemporarySourceCleanupNotice } from '@/components/case-intelligence/TemporarySourceCleanupNotice';

export default function RootLayout() {
  const { session, initialized, recovery } = useAuthStore();
  const activeCaseId = useCaseIntelligenceStore((state) => getActiveCase(state.snapshot)?.id ?? 'none');
  useEffect(() => {
    void initializeTemporarySourceCleanup();
    const stopWorkspace = initializeCaseWorkspace();
    const stopAuth = initializeAuth();
    return () => { stopAuth(); stopWorkspace(); };
  }, []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter: Inter_400Regular,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    'Instrument Serif': InstrumentSerif_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    'JetBrains Mono': JetBrainsMono_400Regular,
  });

  if (!fontsLoaded || !initialized) {
    return <SafeAreaProvider><View style={{ flex: 1, backgroundColor: fbColors.paper }}><TemporarySourceCleanupNotice /><View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Opening Family Bench" /></View></View></SafeAreaProvider>;
  }

  return (
    <SafeAreaProvider>
      <TemporarySourceCleanupNotice />
      <Stack key={`${session?.user.id ?? 'signed-out'}:${activeCaseId}`} screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!hasVerifiedSession(session) || recovery}>
          <Stack.Screen name="auth" />
        </Stack.Protected>
        <Stack.Protected guard={hasVerifiedSession(session) && !recovery}>
          {['index', 'welcome', 'onboarding', 'cases', 'more', 'trust-center', 'briefcase', 'forms', 'import', 'capture', 'entry/[id]', 'voice-capture', 'timeline', 'evidence', 'case-map', 'reports', 'calculator', 'export-prep', 'advisor', 'filings', 'patterns', 'practitioners', 'safety', 'settings'].map((name) => <Stack.Screen key={name} name={name} />)}
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
