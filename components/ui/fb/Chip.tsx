import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { fbBorder, fbColors, fbFonts, fbRadii, fbWeights } from './tokens';

export type ChipTone = 'ink' | 'ox' | 'sand' | 'forest' | 'amber' | 'mute';

const TONE: Record<ChipTone, { fg: string; bg: string; bd: string }> = {
  ink: { fg: fbColors.ink, bg: fbColors.paperDeep, bd: fbColors.inkFaint },
  ox: { fg: fbColors.ox, bg: fbColors.oxWash, bd: `${fbColors.ox}55` },
  sand: { fg: fbColors.sandDeep, bg: fbColors.sandWash, bd: `${fbColors.sandDeep}55` },
  forest: { fg: fbColors.forest, bg: fbColors.forestWash, bd: `${fbColors.forest}55` },
  amber: { fg: fbColors.amber, bg: fbColors.amberWash, bd: `${fbColors.amber}55` },
  mute: { fg: fbColors.inkMute, bg: fbColors.paperDeep, bd: fbColors.inkFaint },
};

export function Chip({
  children,
  tone = 'ink',
  outline = true,
  style,
}: {
  children: ReactNode;
  tone?: ChipTone;
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONE[tone];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          alignSelf: 'flex-start',
          paddingVertical: 2,
          paddingHorizontal: 7,
          borderRadius: fbRadii.pill,
          backgroundColor: outline ? 'transparent' : t.bg,
          borderWidth: outline ? fbBorder.hairline : 0,
          borderColor: outline ? t.bd : 'transparent',
        },
        style,
      ]}
    >
      <Text
        className="font-sans"
        style={{
          fontSize: 11,
          fontWeight: fbWeights.medium,
          fontFamily: fbFonts.sansMedium,
          color: t.fg,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
