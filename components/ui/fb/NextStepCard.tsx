import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { PillButton } from './PillButton';
import { fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbWeights } from './tokens';

export type NextStepTone = 'ox' | 'ink';

export function NextStepCard({
  kicker,
  title,
  body,
  primary,
  secondary,
  tone = 'ox',
  onPrimary,
  onSecondary,
  right,
  children,
}: {
  kicker: string;
  title: string;
  body?: string;
  primary?: string;
  secondary?: string;
  tone?: NextStepTone;
  onPrimary?: () => void;
  onSecondary?: () => void;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const fg = tone === 'ox' ? fbColors.ox : fbColors.ink;
  const bg = tone === 'ox' ? fbColors.oxWash : fbColors.paperDeep;
  const bd = tone === 'ox' ? `${fbColors.ox}40` : fbColors.rule;
  return (
    <View
      style={{
        paddingVertical: 20,
        paddingHorizontal: 22,
        backgroundColor: bg,
        borderRadius: fbRadii.lg,
        borderWidth: fbBorder.hairline,
        borderColor: bd,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: fbSpacing.x3 }}>
        <View style={{ flex: 1 }}>
          <Text
            className="font-sans"
            style={{
              fontSize: 10.5,
              fontWeight: fbWeights.semi,
              fontFamily: fbFonts.sansSemi,
              color: fg,
              letterSpacing: 1.05,
              textTransform: 'uppercase',
            }}
          >
            {kicker}
          </Text>
        </View>
        {right}
      </View>
      <Text
        className="font-sans"
        style={{
          fontSize: 22,
          fontWeight: fbWeights.semi,
          fontFamily: fbFonts.sansSemi,
          color: fbColors.ink,
          marginTop: 6,
          letterSpacing: -0.44,
          lineHeight: 26.4,
        }}
      >
        {title}
      </Text>
      {body && (
        <Text
          className="font-sans"
          style={{
            fontSize: 13.5,
            color: fbColors.inkSoft,
            marginTop: 6,
            lineHeight: 20.9,
          }}
        >
          {body}
        </Text>
      )}
      {children ? <View style={{ marginTop: fbSpacing.x4 }}>{children}</View> : null}
      {(primary || secondary) && (
        <View
          style={{
            flexDirection: 'row',
            gap: fbSpacing.x2,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          {primary && (
            <PillButton tone="primary" size="md" onPress={onPrimary}>
              {primary}
            </PillButton>
          )}
          {secondary && (
            <PillButton tone="ghost" size="md" onPress={onSecondary}>
              {secondary}
            </PillButton>
          )}
        </View>
      )}
    </View>
  );
}
