import { Pressable, Text, View } from 'react-native';
import {
  fbAlpha,
  fbBorder,
  fbColors,
  fbFonts,
  fbMoodColors,
  fbRadii,
  fbWeights,
} from './tokens';

export const MOODS = [
  { k: 'calm', label: 'Calm', color: fbMoodColors.calm, note: 'Relaxed, settled, content' },
  { k: 'happy', label: 'Happy', color: fbMoodColors.happy, note: 'Energetic, smiling, engaged' },
  { k: 'quiet', label: 'Quiet', color: fbMoodColors.quiet, note: 'Withdrawn, few words' },
  { k: 'anxious', label: 'Anxious', color: fbMoodColors.anxious, note: 'Clingy, nervous, watchful' },
  { k: 'upset', label: 'Upset', color: fbMoodColors.upset, note: 'Tearful, frustrated' },
  { k: 'distressed', label: 'Distressed', color: fbMoodColors.distressed, note: 'Crying, panicked, shaken' },
  { k: 'angry', label: 'Angry', color: fbMoodColors.angry, note: 'Shouting, stomping, resistant' },
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
            accessibilityHint={m.note}
            style={({ pressed }) => ({
              width: '48%',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderRadius: fbRadii.md,
              backgroundColor: sel ? fbColors.paperDeep : fbColors.surface,
              borderWidth: sel ? fbBorder.focus : fbBorder.hairline,
              borderColor: sel ? fbColors.ink : fbColors.rule,
              opacity: pressed ? fbAlpha.pressedSubtle : 1,
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
                style={{
                  fontSize: 13,
                  fontWeight: fbWeights.semi,
                  fontFamily: fbFonts.sansSemi,
                  color: fbColors.ink,
                }}
              >
                {m.label}
              </Text>
              <Text
                numberOfLines={1}
                className="font-sans"
                style={{
                  fontSize: 10.5,
                  color: fbColors.inkMute,
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
