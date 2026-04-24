import { Text, type TextStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';

function interFamily(w: TextStyle['fontWeight']): string {
  const s = String(w ?? '400');
  if (s === '500') return 'Inter_500Medium';
  if (s === '600') return 'Inter_600SemiBold';
  if (s === '700' || s === 'bold') return 'Inter_700Bold';
  return 'Inter_400Regular';
}

export function Display({
  children,
  size = 32,
  weight = '500',
  italic = false,
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  italic?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const fontFamily = italic
    ? 'InstrumentSerif_400Regular_Italic'
    : interFamily(weight);
  return (
    <Text
      className={italic ? 'font-serif' : 'font-sans'}
      style={[
        {
          fontSize: size,
          fontWeight: italic ? '400' : weight,
          fontStyle: italic ? 'italic' : 'normal',
          fontFamily,
          color: '#14181F',
          letterSpacing: italic ? size * -0.005 : size * -0.025,
          lineHeight: size * 1.02,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
