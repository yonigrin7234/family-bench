import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';

export type ChipTone = 'ink' | 'ox' | 'sand' | 'forest' | 'amber' | 'mute';

const TONE: Record<ChipTone, { fg: string; bg: string; bd: string }> = {
  ink:    { fg: '#14181F',              bg: '#EFEDE7', bd: 'rgba(20,24,31,0.33)' },
  ox:     { fg: '#B44028',              bg: '#F4E3DE', bd: 'rgba(180,64,40,0.33)' },
  sand:   { fg: '#8A7647',              bg: '#F0EADA', bd: 'rgba(138,118,71,0.33)' },
  forest: { fg: '#2F5A3A',              bg: '#DEE8DD', bd: 'rgba(47,90,58,0.33)' },
  amber:  { fg: '#A76A14',              bg: '#F3E6CE', bd: 'rgba(167,106,20,0.33)' },
  mute:   { fg: 'rgba(20,24,31,0.58)',  bg: '#EFEDE7', bd: 'rgba(20,24,31,0.33)' },
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
          borderRadius: 9999,
          backgroundColor: outline ? 'transparent' : t.bg,
          borderWidth: outline ? StyleSheet.hairlineWidth : 0,
          borderColor: outline ? t.bd : 'transparent',
        },
        style,
      ]}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text
          className="font-sans"
          style={{
            fontSize: 11,
            fontWeight: '500',
            fontFamily: 'Inter_500Medium',
            color: t.fg,
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
