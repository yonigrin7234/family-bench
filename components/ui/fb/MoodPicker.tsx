import { Pressable, Text, View } from 'react-native';

export const MOODS = [
  { k: 'calm',       label: 'Calm',       color: '#6E9E7A', note: 'Relaxed, settled, content' },
  { k: 'happy',      label: 'Happy',      color: '#C99B3E', note: 'Energetic, smiling, engaged' },
  { k: 'quiet',      label: 'Quiet',      color: '#8896A8', note: 'Withdrawn, few words' },
  { k: 'anxious',    label: 'Anxious',    color: '#C99B3E', note: 'Clingy, nervous, watchful' },
  { k: 'upset',      label: 'Upset',      color: '#B48338', note: 'Tearful, frustrated' },
  { k: 'distressed', label: 'Distressed', color: '#B44028', note: 'Crying, panicked, shaken' },
  { k: 'angry',      label: 'Angry',      color: '#842E1C', note: 'Shouting, stomping, resistant' },
] as const;

export type MoodKey = (typeof MOODS)[number]['k'];

export function MoodPicker({
  value,
  onPick,
}: {
  value?: MoodKey;
  onPick?: (k: MoodKey) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 8,
        rowGap: 8,
      }}
    >
      {MOODS.map((m) => {
        const sel = value === m.k;
        return (
          <Pressable
            key={m.k}
            onPress={() => onPick?.(m.k)}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={`Mood: ${m.label}`}
            style={({ pressed }) => ({
              width: '48%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: 12,
              backgroundColor: sel ? '#EFEDE7' : '#FFFFFF',
              borderWidth: sel ? 2 : 1,
              borderColor: sel ? '#14181F' : 'rgba(20,24,31,0.10)',
              opacity: pressed ? 0.94 : 1,
            })}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: m.color,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                className="font-sans"
                style={{ fontSize: 13, fontWeight: '600', color: '#14181F' }}
              >
                {m.label}
              </Text>
              <Text
                numberOfLines={1}
                className="font-sans"
                style={{
                  fontSize: 10.5,
                  color: 'rgba(20,24,31,0.58)',
                  marginTop: 1,
                }}
              >
                {m.note}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
