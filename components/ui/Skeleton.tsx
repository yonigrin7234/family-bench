import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import type { ViewProps } from 'react-native';

// Opacity pulse skeleton — NO shimmer (anti-pattern #14)
interface SkeletonProps extends ViewProps {
  width?: number;
  height?: number;
  rounded?: boolean;
}

export function Skeleton({ width, height = 16, rounded, className, style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-border dark:bg-dark-surface-hover ${rounded ? 'rounded-full' : 'rounded-card'} ${className ?? ''}`}
      style={[{ width, height, opacity }, style]}
      {...props}
    />
  );
}
