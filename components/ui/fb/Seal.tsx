import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { fbColors, fbFonts, fbWeights } from './tokens';

export function Seal({
  size = 48,
  label = 'FB',
  style,
}: {
  size?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const fontSize = size * 0.44;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: fbColors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        className="font-sans"
        style={{
          color: fbColors.paper,
          fontSize,
          fontWeight: fbWeights.semi,
          fontFamily: fbFonts.sansSemi,
          letterSpacing: fontSize * -0.04,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
