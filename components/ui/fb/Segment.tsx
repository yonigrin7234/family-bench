import { Pressable, Text, View } from 'react-native';
import { fbColors, fbFonts, fbRadii, fbTouch, fbWeights } from './tokens';

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
        backgroundColor: fbColors.paperDeep,
        borderRadius: fbRadii.md - 2,
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
              borderRadius: fbRadii.sm,
              backgroundColor: active ? fbColors.surface : 'transparent',
              alignItems: 'center',
              minHeight: fbTouch.min,
              justifyContent: 'center',
            }}
          >
            <Text
              className="font-sans"
              style={{
                fontSize: 12.5,
                fontWeight: active ? fbWeights.semi : fbWeights.medium,
                fontFamily: active ? fbFonts.sansSemi : fbFonts.sansMedium,
                color: active ? fbColors.ink : fbColors.inkMute,
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
