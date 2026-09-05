import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { fbBorder, fbColors, fbFonts, fbRadii, fbWeights } from './tokens';

const ENTRY_MARKS: Record<string, { mark: string; color: string }> = {
  journal: { mark: 'JR', color: fbColors.inkSoft },
  pickup_dropoff: { mark: 'EX', color: fbColors.ink },
  visit_denied: { mark: 'DN', color: fbColors.ox },
  child_statement: { mark: 'ST', color: fbColors.sandDeep },
  expense: { mark: 'EP', color: fbColors.amber },
  message: { mark: 'CM', color: fbColors.inkSoft },
  schedule_change: { mark: 'SC', color: fbColors.forest },
  medical: { mark: 'MD', color: fbColors.forest },
  school: { mark: 'SH', color: fbColors.sandDeep },
  court_order: { mark: 'CO', color: fbColors.ink },
  other: { mark: 'OT', color: fbColors.inkSoft },
};

export function EntryMark({
  type,
  size = 28,
  style,
}: {
  type?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const meta = ENTRY_MARKS[type ?? ''] ?? ENTRY_MARKS.other;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.max(fbRadii.sm, size * 0.28),
          borderWidth: fbBorder.hairline,
          borderColor: `${meta.color}66`,
          backgroundColor: fbColors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: meta.color,
          fontSize: size * 0.34,
          lineHeight: size * 0.42,
          fontFamily: fbFonts.monoSemi,
          fontWeight: fbWeights.semi,
          letterSpacing: size * 0.015,
        }}
      >
        {meta.mark}
      </Text>
    </View>
  );
}
