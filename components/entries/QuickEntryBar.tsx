import { View, Text, Pressable } from 'react-native';
import { Plus, Mic } from 'lucide-react-native';

interface QuickEntryBarProps {
  onPress: () => void;
  onMicPress: () => void;
}

// Floating input bar above tab bar.
// bg-surface, rounded-modal (16px), shadow-card, mx-4
// Placeholder: "What happened?" in placeholder color
// Left: + icon (attach)  Right: mic icon
export function QuickEntryBar({ onPress, onMicPress }: QuickEntryBarProps) {
  return (
    <View
      className="mx-4 mb-2 bg-surface dark:bg-dark-surface rounded-modal px-4 py-3 flex-row items-center"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.035,
        shadowRadius: 20,
        elevation: 3,
      }}
    >
      <Pressable
        onPress={onPress}
        className="w-8 h-8 items-center justify-center"
        hitSlop={8}
        accessibilityLabel="Add attachment"
      >
        <Plus size={20} strokeWidth={1.75} className="text-text-muted dark:text-dark-text-muted" />
      </Pressable>

      <Pressable
        onPress={onPress}
        className="flex-1 mx-3"
        accessibilityLabel="Create new entry"
      >
        <Text className="font-ui text-[15px] text-text-placeholder">
          What happened?
        </Text>
      </Pressable>

      <Pressable
        onPress={onMicPress}
        className="w-9 h-9 bg-[#1A1A18] dark:bg-dark-text rounded-full items-center justify-center"
        accessibilityLabel="Record voice entry"
      >
        <Mic size={18} strokeWidth={1.75} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
