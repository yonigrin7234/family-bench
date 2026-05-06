import { Text, type TextStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { fbColors, fbFonts, fbWeights } from './tokens';

function interFamily(w: TextStyle['fontWeight']): string {
  const s = String(w ?? '400');
  if (s === fbWeights.medium) return fbFonts.sansMedium;
  if (s === fbWeights.semi || s === '700' || s === 'bold') return fbFonts.sansSemi;
  return fbFonts.sansRegular;
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
    ? fbFonts.serifItalic
    : interFamily(weight);
  return (
    <Text
      className={italic ? 'font-serif' : 'font-sans'}
      style={[
        {
          fontSize: size,
          fontWeight: italic ? fbWeights.regular : weight === '700' || weight === 'bold' ? fbWeights.semi : weight,
          fontStyle: italic ? 'italic' : 'normal',
          fontFamily,
          color: fbColors.ink,
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
