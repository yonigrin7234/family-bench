import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import {
  fbAlpha,
  fbBorder,
  fbColors,
  fbFonts,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbWeights,
} from './tokens';

export function BigChoice({
  label,
  hint,
  selected = false,
  icon,
  onPress,
  badge,
  accessibilityLabel,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
  badge?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: fbSpacing.x3 + 2,
        paddingVertical: fbSpacing.x4,
        paddingHorizontal: fbSpacing.x5 - 2,
        borderRadius: fbRadii.lg,
        backgroundColor: selected ? fbColors.paperDeep : fbColors.surface,
        borderWidth: selected ? fbBorder.focus : fbBorder.hairline,
        borderColor: selected ? fbColors.ink : fbColors.rule,
        minHeight: fbTouch.min,
        opacity: pressed ? fbAlpha.pressedSubtle : 1,
      })}
    >
      {icon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: fbRadii.md - 2,
            backgroundColor: selected ? fbColors.ink : fbColors.paperDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={selected ? fbColors.paper : fbColors.ink} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          className="font-sans"
          style={{
            fontSize: 14.5,
            fontWeight: fbWeights.semi,
            fontFamily: fbFonts.sansSemi,
            color: fbColors.ink,
            letterSpacing: -0.29,
          }}
        >
          {label}
        </Text>
        {hint && (
          <Text
            className="font-sans"
            style={{
              fontSize: 12,
              color: fbColors.inkMute,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {badge && (
        <View
          style={{
            backgroundColor: fbColors.oxWash,
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: fbRadii.pill,
          }}
        >
          <Text
            className="font-sans"
            style={{
              fontSize: 10,
              fontWeight: fbWeights.semi,
              fontFamily: fbFonts.sansSemi,
              color: fbColors.ox,
            }}
          >
            {badge}
          </Text>
        </View>
      )}
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1.5,
          borderColor: selected ? fbColors.ink : fbColors.rule,
          backgroundColor: selected ? fbColors.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fbColors.paper }}
          />
        )}
      </View>
    </Pressable>
  );
}
