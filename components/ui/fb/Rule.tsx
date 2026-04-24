import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';

export function Rule({
  color = 'rgba(20,24,31,0.10)',
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
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: color }, style]} />
  );
}
