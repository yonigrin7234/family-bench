import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { fbColors, fbFonts, fbWeights } from './tokens';

export function ProgressBar({
  pct,
  label,
  style,
}: {
  pct: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={style}>
      {label && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <Text
            className="font-sans"
            style={{
              fontSize: 12,
              fontWeight: fbWeights.medium,
              fontFamily: fbFonts.sansMedium,
              color: fbColors.inkMute,
            }}
          >
            {label}
          </Text>
          <Text
            className="font-mono"
            style={{
              fontSize: 12,
              fontWeight: fbWeights.semi,
              fontFamily: fbFonts.monoSemi,
              color: fbColors.ink,
            }}
          >
            {clamped}%
          </Text>
        </View>
      )}
      <View
        style={{
          height: 6,
          backgroundColor: fbColors.paperDeep,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: fbColors.ink,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}
