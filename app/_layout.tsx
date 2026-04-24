// TEMP: gallery-only layout. Will be replaced when (app) and (auth)
// routes are built from the design bundle.

import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
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
import { useColorScheme } from '@/components/useColorScheme';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '_gallery',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Register fonts under the exact family names referenced by
  // tailwind.config.js (`Inter`, `Instrument Serif`, `JetBrains Mono`)
  // so NativeWind's font-sans/-serif/-mono classes resolve to real
  // typefaces. Extra weight-specific keys are also registered for
  // consumers that want to pick a weight via explicit fontFamily.
  const [loaded, error] = useFonts({
    'Inter': Inter_400Regular,
    'Inter_400Regular': Inter_400Regular,
    'Inter_500Medium': Inter_500Medium,
    'Inter_600SemiBold': Inter_600SemiBold,
    'Inter_700Bold': Inter_700Bold,
    'Instrument Serif': InstrumentSerif_400Regular,
    'InstrumentSerif_400Regular': InstrumentSerif_400Regular,
    'InstrumentSerif_400Regular_Italic': InstrumentSerif_400Regular_Italic,
    'JetBrains Mono': JetBrainsMono_400Regular,
    'JetBrainsMono_400Regular': JetBrainsMono_400Regular,
    'JetBrainsMono_500Medium': JetBrainsMono_500Medium,
    'JetBrainsMono_600SemiBold': JetBrainsMono_600SemiBold,
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: '#F7F6F3' }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="_gallery" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
