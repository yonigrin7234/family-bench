import { View, Text, Pressable } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';

interface DeadlineAlertProps {
  title: string;
  dueDate: string;
  daysRemaining: number;
  onPress?: () => void;
}

function urgencyColor(days: number): { bg: string; text: string; dot: string } {
  if (days <= 1) return { bg: 'bg-danger-light', text: 'text-danger', dot: 'bg-danger' };
  if (days <= 3) return { bg: 'bg-warning-light', text: 'text-warning', dot: 'bg-warning' };
  return { bg: 'bg-accent-lighter', text: 'text-accent', dot: 'bg-accent' };
}

export function DeadlineAlert({ title, dueDate, daysRemaining, onPress }: DeadlineAlertProps) {
  const colors = urgencyColor(daysRemaining);
  const urgencyLabel = daysRemaining <= 0
    ? 'Overdue'
    : daysRemaining === 1
      ? 'Tomorrow'
      : `${daysRemaining} days`;

  return (
    <Pressable
      className={`${colors.bg} rounded-card p-4 flex-row items-center gap-3 active:scale-[0.99]`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Deadline: ${title}, ${urgencyLabel}`}
    >
      <Calendar size={20} strokeWidth={1.75} className={colors.text} />
      <View className="flex-1">
        <Text className={`font-ui text-[14px] font-medium ${colors.text}`}>
          {title}
        </Text>
        <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
          {dueDate}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <View className={`${colors.dot} w-2 h-2 rounded-full`} />
        <Text className={`font-ui text-[13px] font-medium ${colors.text}`}>
          {urgencyLabel}
        </Text>
        <ChevronRight size={16} strokeWidth={1.75} className={colors.text} />
      </View>
    </Pressable>
  );
}
