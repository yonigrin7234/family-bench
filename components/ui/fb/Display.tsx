import { Text, type TextStyle, type StyleProp } from 'react-native';
import type { ReactNode } from 'react';

export function Display({
  children,
  size = 32,
  weight = '500',
  italic = false,
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  italic?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      className={italic ? 'font-serif' : 'font-sans'}
      style={[
        {
          fontSize: size,
          fontWeight: italic ? '400' : weight,
          fontStyle: italic ? 'italic' : 'normal',
          color: '#14181F',
          letterSpacing: italic ? size * -0.005 : size * -0.025,
          lineHeight: size * 1.02,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
