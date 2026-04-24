import { Text, View, type ViewStyle, type StyleProp } from 'react-native';

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
          backgroundColor: '#14181F',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        className="font-sans"
        style={{
          color: '#F7F6F3',
          fontSize,
          fontWeight: '600',
          fontFamily: 'Inter_600SemiBold',
          letterSpacing: fontSize * -0.04,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
