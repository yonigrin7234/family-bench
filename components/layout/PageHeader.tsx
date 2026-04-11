import { View, Text } from 'react-native';
import { IconButton } from '@/components/ui/IconButton';
import type { LucideIcon } from 'lucide-react-native';

interface PageHeaderProps {
  title: string;
  leftIcon?: LucideIcon;
  onLeftPress?: () => void;
  rightIcon?: LucideIcon;
  onRightPress?: () => void;
}

// h-11 (44px), transparent bg, no bottom border
export function PageHeader({
  title,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
}: PageHeaderProps) {
  return (
    <View className="h-11 flex-row items-center justify-between px-4 bg-transparent">
      <View className="w-11">
        {leftIcon && onLeftPress && (
          <IconButton
            icon={leftIcon}
            variant="surface"
            onPress={onLeftPress}
          />
        )}
      </View>
      <Text className="font-ui text-[16px] font-medium text-text-primary dark:text-dark-text">
        {title}
      </Text>
      <View className="w-11">
        {rightIcon && onRightPress && (
          <IconButton
            icon={rightIcon}
            variant="surface"
            onPress={onRightPress}
          />
        )}
      </View>
    </View>
  );
}
