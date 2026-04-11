import { Switch, View, Text } from 'react-native';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, value, onValueChange, disabled }: ToggleProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="font-ui text-[15px] text-text-primary dark:text-dark-text flex-1">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
