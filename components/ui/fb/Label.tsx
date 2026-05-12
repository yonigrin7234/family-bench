import { Text, type StyleProp, type TextStyle } from 'react-native';
import type { ReactNode } from 'react';
import { fbColors, fbFonts, fbType, fbWeights } from './tokens';

export function Label({
  children,
  color = fbColors.inkMute,
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        {
          color,
          fontSize: fbType.micro,
          lineHeight: 14,
          fontFamily: fbFonts.sansSemi,
          fontWeight: fbWeights.semi,
          letterSpacing: 1.05,
          textTransform: 'uppercase',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
