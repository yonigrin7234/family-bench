import { Pressable, Text, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { fbAlpha, fbBorder, fbColors, fbFonts, fbTouch, fbWeights } from './tokens';

export type PillButtonTone = 'primary' | 'soft' | 'ghost' | 'accent' | 'accentSoft';
export type PillButtonSize = 'sm' | 'md' | 'lg';

const SIZE = {
  sm: { py: 6,  px: 12, fs: 12, r: 10, gap: 6, i: 13 },
  md: { py: 10, px: 16, fs: 13, r: 12, gap: 8, i: 15 },
  lg: { py: 14, px: 20, fs: 14, r: 14, gap: 9, i: 17 },
} as const;

const TONE: Record<PillButtonTone, { bg: string; fg: string; bd: string }> = {
  primary: { bg: fbColors.ink, fg: fbColors.paper, bd: fbColors.ink },
  soft: { bg: fbColors.paperDeep, fg: fbColors.ink, bd: 'transparent' },
  ghost: { bg: 'transparent', fg: fbColors.ink, bd: fbColors.rule },
  accent: { bg: fbColors.ox, fg: fbColors.paper, bd: fbColors.ox },
  accentSoft: { bg: fbColors.oxWash, fg: fbColors.oxDeep, bd: 'transparent' },
};

export function PillButton({
  children,
  tone = 'ghost',
  size = 'md',
  icon,
  iconRight,
  onPress,
  disabled = false,
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
  disabled?: boolean;
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
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={disabled ? { disabled: true } : undefined}
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
          borderWidth: fbBorder.hairline,
          borderColor: t.bd,
          minHeight: fbTouch.min,
          maxWidth: '100%',
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? fbAlpha.disabled : pressed ? fbAlpha.pressed : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={s.i} color={t.fg} /> : null}
      <Text
        className="font-sans"
        style={{
          fontSize: s.fs,
          fontWeight: fbWeights.medium,
          fontFamily: fbFonts.sansMedium,
          color: t.fg,
          letterSpacing: s.fs * -0.01,
          flexShrink: 1,
          textAlign: 'center',
        }}
      >
        {children}
      </Text>
      {iconRight ? <Icon name={iconRight} size={s.i} color={t.fg} /> : null}
    </Pressable>
  );
}
