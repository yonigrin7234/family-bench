import { View, Text, Pressable } from 'react-native';
import { Mic, ArrowUp } from 'lucide-react-native';

interface QuickEntryBarProps {
  onPress: () => void;
  onMicPress: () => void;
}

export function QuickEntryBar({ onPress, onMicPress }: QuickEntryBarProps) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityLabel="Create new entry">
        <Text style={{ fontFamily: 'System', fontSize: 15, color: '#9A9893' }}>
          What happened?
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={onMicPress} hitSlop={8} accessibilityLabel="Record voice entry">
          <Mic size={20} strokeWidth={1.75} color="#6B6A68" />
        </Pressable>
        <Pressable
          onPress={onPress}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#2563EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="New entry"
        >
          <ArrowUp size={16} strokeWidth={2} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
