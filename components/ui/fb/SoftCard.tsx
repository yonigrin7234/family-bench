import { Text, View, type ViewStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';
import { fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbWeights } from './tokens';

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
          backgroundColor: fbColors.surface,
          borderRadius: fbRadii.lg,
          borderWidth: accent ? fbBorder.selected : fbBorder.hairline,
          borderColor: accent ? `${fbColors.ox}4D` : fbColors.rule,
          padding: p,
          overflow: 'hidden',
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
            marginBottom: fbSpacing.x3,
            gap: fbSpacing.x3,
          }}
        >
          <View style={{ flex: 1 }}>
            {title && (
              <Text
                className="font-sans"
                style={{
                  fontSize: 15,
                  fontWeight: fbWeights.semi,
                  fontFamily: fbFonts.sansSemi,
                  color: fbColors.ink,
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
                  color: fbColors.inkMute,
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
