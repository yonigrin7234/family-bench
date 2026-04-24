import { Pressable, Text, View } from 'react-native';

export type SegmentItem<V extends string = string> = { v: V; label: string };

export function Segment<V extends string = string>({
  items,
  value,
  onChange,
  full = true,
}: {
  items: SegmentItem<V>[];
  value: V;
  onChange?: (v: V) => void;
  full?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 3,
        backgroundColor: '#EFEDE7',
        borderRadius: 10,
        alignSelf: full ? 'stretch' : 'flex-start',
      }}
    >
      {items.map((it) => {
        const active = it.v === value;
        return (
          <Pressable
            key={it.v}
            onPress={() => onChange?.(it.v)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={it.label}
            style={{
              flex: full ? 1 : 0,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: active ? '#FFFFFF' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              className="font-sans"
              style={{
                fontSize: 12.5,
                fontWeight: active ? '600' : '500',
                fontFamily: active ? 'Inter_600SemiBold' : 'Inter_500Medium',
                color: active ? '#14181F' : 'rgba(20,24,31,0.58)',
              }}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
