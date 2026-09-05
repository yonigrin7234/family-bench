import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { fbBorder, fbColors, fbFonts, fbRadii, fbWeights } from './tokens';

export type CalloutTone = 'ink' | 'ox' | 'forest';

const TONE: Record<CalloutTone, { bg: string; bd: string; fg: string; mark: string }> = {
  ink: { bg: fbColors.paperDeep, bd: fbColors.rule, fg: fbColors.ink, mark: fbColors.ink },
  ox: { bg: fbColors.oxWash, bd: `${fbColors.ox}4D`, fg: fbColors.oxDeep, mark: fbColors.ox },
  forest: {
    bg: fbColors.forestWash,
    bd: `${fbColors.forest}4D`,
    fg: fbColors.forest,
    mark: fbColors.forest,
  },
};

export function InfoCallout({
  title,
  children,
  tone = 'ink',
}: {
  title: string;
  children?: ReactNode;
  tone?: CalloutTone;
}) {
  const t = TONE[tone];
  return (
    <View
      style={{
        backgroundColor: t.bg,
        borderRadius: fbRadii.md,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: fbBorder.hairline,
        borderColor: t.bd,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: t.mark }} />
        <Text
          className="font-sans"
          style={{
            fontSize: 10.5,
            fontWeight: fbWeights.semi,
            fontFamily: fbFonts.sansSemi,
            color: t.fg,
            letterSpacing: 0.84,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>
      <Text
        className="font-sans"
        style={{ fontSize: 13, color: fbColors.inkSoft, lineHeight: 20.15 }}
      >
        {children}
      </Text>
    </View>
  );
}
