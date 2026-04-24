import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

export type CalloutTone = 'ink' | 'ox' | 'forest';

const TONE: Record<CalloutTone, { bg: string; bd: string; fg: string; mark: string }> = {
  ink:    { bg: '#EFEDE7', bd: 'rgba(20,24,31,0.10)',  fg: '#14181F', mark: '#14181F' },
  ox:     { bg: '#F4E3DE', bd: 'rgba(180,64,40,0.30)', fg: '#842E1C', mark: '#B44028' },
  forest: { bg: '#DEE8DD', bd: 'rgba(47,90,58,0.30)',  fg: '#2F5A3A', mark: '#2F5A3A' },
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
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderWidth: StyleSheet.hairlineWidth,
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
            fontWeight: '600',
            color: t.fg,
            letterSpacing: 0.84,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Text>
      </View>
      {typeof children === 'string' ? (
        <Text
          className="font-sans"
          style={{ fontSize: 13, color: '#2B323D', lineHeight: 20.15 }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
