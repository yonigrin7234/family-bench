import { Text, View, type ViewStyle, type StyleProp } from 'react-native';

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
              fontWeight: '500',
              fontFamily: 'Inter_500Medium',
              color: 'rgba(20,24,31,0.58)',
            }}
          >
            {label}
          </Text>
          <Text
            className="font-mono"
            style={{
              fontSize: 12,
              fontWeight: '600',
              fontFamily: 'JetBrainsMono_600SemiBold',
              color: '#14181F',
            }}
          >
            {clamped}%
          </Text>
        </View>
      )}
      <View
        style={{
          height: 6,
          backgroundColor: '#EFEDE7',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: '#14181F',
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  );
}
