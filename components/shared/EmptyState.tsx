import { View, Text } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { LucideIcon } from 'lucide-react-native';

// Empty states use serif heading + muted body text.
// NO illustrations (anti-pattern #5). NO emoji (anti-pattern #6).

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="font-display text-[22px] font-semibold text-text-primary dark:text-dark-text text-left w-full mb-2">
        {title}
      </Text>
      <Text className="font-ui text-[15px] text-text-muted dark:text-dark-text-muted text-left w-full leading-relaxed mb-6">
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button
          variant="accent"
          label={actionLabel}
          icon={actionIcon}
          onPress={onAction}
        />
      )}
    </View>
  );
}
