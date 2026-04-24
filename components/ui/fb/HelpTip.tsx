import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

export function HelpTip({
  term,
  children,
  inline = false,
}: {
  term: string;
  children?: ReactNode;
  inline?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        accessibilityHint="Tap for definition"
        style={{
          color: '#14181F',
          textDecorationLine: 'underline',
          // `dotted` is iOS-only per RN docs; Android falls back to solid.
          textDecorationStyle: 'dotted',
          textDecorationColor: 'rgba(20,24,31,0.34)',
        }}
      >
        {term}
      </Text>
      {!inline && children && (
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#EFEDE7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            className="font-sans"
            style={{
              fontSize: 9,
              color: 'rgba(20,24,31,0.58)',
              fontWeight: '600',
            }}
          >
            ?
          </Text>
        </View>
      )}
    </View>
  );
}
