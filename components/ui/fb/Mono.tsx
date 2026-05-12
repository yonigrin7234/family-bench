import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';
import { fbColors, fbFonts } from './tokens';

export function Mono({
  children,
  size = 11,
  dim = false,
  color,
  numberOfLines,
  style,
}: {
  children: ReactNode;
  size?: number;
  dim?: boolean;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: color ?? (dim ? fbColors.inkMute : fbColors.ink),
          fontSize: size,
          lineHeight: size * 1.35,
          fontFamily: fbFonts.monoMedium,
          letterSpacing: size * -0.01,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
