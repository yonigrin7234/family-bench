import { StyleSheet, Text, View } from 'react-native';
import { PillButton } from './PillButton';

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
}: {
  kicker: string;
  title: string;
  body?: string;
  primary?: string;
  secondary?: string;
  tone?: NextStepTone;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  const fg = tone === 'ox' ? '#B44028' : '#14181F';
  const bg = tone === 'ox' ? '#F4E3DE' : '#EFEDE7';
  const bd = tone === 'ox' ? 'rgba(180,64,40,0.25)' : 'rgba(20,24,31,0.25)';
  return (
    <View
      style={{
        paddingVertical: 20,
        paddingHorizontal: 22,
        backgroundColor: bg,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: bd,
      }}
    >
      <Text
        className="font-sans"
        style={{
          fontSize: 10.5,
          color: fg,
          fontWeight: '600',
          letterSpacing: 1.05,
          textTransform: 'uppercase',
        }}
      >
        {kicker}
      </Text>
      <Text
        className="font-sans"
        style={{
          fontSize: 22,
          color: '#14181F',
          fontWeight: '600',
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
            color: '#2B323D',
            marginTop: 6,
            lineHeight: 20.9,
          }}
        >
          {body}
        </Text>
      )}
      {(primary || secondary) && (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
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
