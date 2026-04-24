// Gallery-only layout. Will be replaced when (app) / (auth) routes
// are rebuilt from the design bundle. global.css is required for
// NativeWind class compilation.

import '../global.css';
import { Stack } from 'expo-router';
import {
  useFonts,
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
import { View } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter: Inter_400Regular,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    'Instrument Serif': InstrumentSerif_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    'JetBrains Mono': JetBrainsMono_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#F7F6F3' }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
