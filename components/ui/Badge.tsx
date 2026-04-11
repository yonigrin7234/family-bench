import { View, Text } from 'react-native';
import { entryBadgeColors, entryTypeLabels } from '@/constants/theme';

type EntryType = keyof typeof entryBadgeColors;

interface BadgeProps {
  type: EntryType;
  label?: string;
}

export function Badge({ type, label }: BadgeProps) {
  const colors = entryBadgeColors[type] ?? entryBadgeColors.journal;
  const displayLabel = label ?? entryTypeLabels[type] ?? type;

  return (
    <View className={`${colors.bg} rounded-[6px] px-2 py-0.5`}>
      <Text className={`${colors.text} font-ui text-[12px] font-medium`}>
        {displayLabel}
      </Text>
    </View>
  );
}
