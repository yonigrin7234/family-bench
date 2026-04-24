import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from './Icon';

export function BigChoice({
  label,
  hint,
  selected = false,
  icon,
  onPress,
  badge,
  accessibilityLabel,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
  badge?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 18,
        borderRadius: 14,
        backgroundColor: selected ? '#EFEDE7' : '#FFFFFF',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#14181F' : 'rgba(20,24,31,0.10)',
        opacity: pressed ? 0.94 : 1,
      })}
    >
      {icon && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: selected ? '#14181F' : '#EFEDE7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={18} color={selected ? '#F7F6F3' : '#14181F'} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          className="font-sans"
          style={{
            fontSize: 14.5,
            fontWeight: '600',
            color: '#14181F',
            letterSpacing: -0.29,
          }}
        >
          {label}
        </Text>
        {hint && (
          <Text
            className="font-sans"
            style={{
              fontSize: 12,
              color: 'rgba(20,24,31,0.58)',
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      {badge && (
        <View
          style={{
            backgroundColor: '#F4E3DE',
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 9999,
          }}
        >
          <Text
            className="font-sans"
            style={{ fontSize: 10, fontWeight: '600', color: '#B44028' }}
          >
            {badge}
          </Text>
        </View>
      )}
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1.5,
          borderColor: selected ? '#14181F' : 'rgba(20,24,31,0.10)',
          backgroundColor: selected ? '#14181F' : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && (
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F7F6F3' }}
          />
        )}
      </View>
    </Pressable>
  );
}
