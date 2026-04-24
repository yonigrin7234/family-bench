import { Pressable, StyleSheet, Text, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type PillButtonTone = 'primary' | 'soft' | 'ghost' | 'accent' | 'accentSoft';
export type PillButtonSize = 'sm' | 'md' | 'lg';

const SIZE = {
  sm: { py: 6,  px: 12, fs: 12, r: 10, gap: 6, i: 13 },
  md: { py: 10, px: 16, fs: 13, r: 12, gap: 8, i: 15 },
  lg: { py: 14, px: 20, fs: 14, r: 14, gap: 9, i: 17 },
} as const;

const TONE: Record<PillButtonTone, { bg: string; fg: string; bd: string }> = {
  primary:    { bg: '#14181F',    fg: '#F7F6F3', bd: '#14181F' },
  soft:       { bg: '#EFEDE7',    fg: '#14181F', bd: 'transparent' },
  ghost:      { bg: 'transparent',fg: '#14181F', bd: 'rgba(20,24,31,0.10)' },
  accent:     { bg: '#B44028',    fg: '#F7F6F3', bd: '#B44028' },
  accentSoft: { bg: '#F4E3DE',    fg: '#842E1C', bd: 'transparent' },
};

export function PillButton({
  children,
  tone = 'ghost',
  size = 'md',
  icon,
  iconRight,
  onPress,
  full = false,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  tone?: PillButtonTone;
  size?: PillButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  onPress?: () => void;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const s = SIZE[size];
  const t = TONE[tone];
  const label =
    accessibilityLabel ?? (typeof children === 'string' ? children : undefined);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s.gap,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          borderRadius: s.r,
          backgroundColor: t.bg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.bd,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={s.i} color={t.fg} /> : null}
      <Text
        className="font-sans"
        style={{
          fontSize: s.fs,
          fontWeight: '500',
          color: t.fg,
          letterSpacing: s.fs * -0.01,
        }}
      >
        {children}
      </Text>
      {iconRight ? <Icon name={iconRight} size={s.i} color={t.fg} /> : null}
    </Pressable>
  );
}
