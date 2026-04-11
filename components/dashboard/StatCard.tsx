import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: 'accent' | 'success' | 'warning' | 'danger';
}

const accentColors = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'accent',
}: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <View className="flex-row items-start justify-between mb-2">
        <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
          {label}
        </Text>
        {Icon && (
          <Icon size={16} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
        )}
      </View>
      <Text className={`font-display text-[28px] font-semibold ${accentColors[accentColor]} mb-1`}>
        {value}
      </Text>
      {subtitle && (
        <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
          {subtitle}
        </Text>
      )}
    </Card>
  );
}
