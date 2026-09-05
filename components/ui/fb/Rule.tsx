import { View, type ViewStyle, type StyleProp } from 'react-native';
import { fbBorder, fbColors } from './tokens';

export function Rule({
  color = fbColors.rule,
  dashed = false,
  style,
}: {
  color?: string;
  dashed?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (dashed) {
    return (
      <View
        style={[
          { height: 0, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: color },
          style,
        ]}
      />
    );
  }
  return (
    <View style={[{ height: fbBorder.hairline, backgroundColor: color }, style]} />
  );
}
