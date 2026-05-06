import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { fbColors, fbFonts, fbWeights } from './tokens';

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
          color: fbColors.ink,
          textDecorationLine: 'underline',
          // `dotted` is iOS-only per RN docs; Android falls back to solid.
          textDecorationStyle: 'dotted',
          textDecorationColor: fbColors.inkFaint,
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
            backgroundColor: fbColors.paperDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            className="font-sans"
            style={{
              fontSize: 9,
              fontWeight: fbWeights.semi,
              fontFamily: fbFonts.sansSemi,
              color: fbColors.inkMute,
            }}
          >
            ?
          </Text>
        </View>
      )}
    </View>
  );
}
