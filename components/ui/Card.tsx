import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  flagged?: boolean;
}

export function Card({ flagged, className, children, ...props }: CardProps) {
  return (
    <View
      className={`
        bg-surface dark:bg-dark-surface
        border border-border dark:border-dark-surface-hover
        rounded-card p-4
        ${flagged ? 'border-l-[3px] border-l-danger' : ''}
        ${className ?? ''}
      `}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.035,
        shadowRadius: 20,
        elevation: 2,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
