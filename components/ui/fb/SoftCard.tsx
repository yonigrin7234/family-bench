import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';

export function SoftCard({
  title,
  subtitle,
  right,
  children,
  p = 18,
  accent = false,
  style,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
  p?: number;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: accent ? 1 : StyleSheet.hairlineWidth,
          borderColor: accent ? 'rgba(180,64,40,0.30)' : 'rgba(20,24,31,0.10)',
          padding: p,
        },
        style,
      ]}
    >
      {(title || right) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            {title && (
              <Text
                className="font-sans"
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  fontFamily: 'Inter_600SemiBold',
                  color: '#14181F',
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                className="font-sans"
                style={{
                  fontSize: 12.5,
                  color: 'rgba(20,24,31,0.58)',
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );
}
