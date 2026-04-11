import { View, Text } from 'react-native';
import { Pressable } from 'react-native';

// Empty states: serif heading, muted body, near-black button.
// NO illustrations (anti-pattern #5). NO emoji (anti-pattern #6).
// Centered vertically. Text centered, max-width 260.

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <Text
        style={{
          fontFamily: 'Georgia',
          fontSize: 18,
          fontWeight: '600',
          color: '#1A1A18',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'System',
          fontSize: 15,
          color: '#6B6A68',
          textAlign: 'center',
          maxWidth: 260,
          lineHeight: 22,
          marginBottom: 24,
        }}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={{
            backgroundColor: '#1A1A18',
            height: 52,
            borderRadius: 12,
            paddingHorizontal: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="active:scale-[0.98]"
        >
          <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
