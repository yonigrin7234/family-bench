import { Pressable } from 'react-native';
import type { PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface IconButtonProps extends PressableProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  variant?: 'surface' | 'transparent' | 'accent';
}

export function IconButton({
  icon: Icon,
  size = 20,
  color,
  variant = 'surface',
  disabled,
  ...props
}: IconButtonProps) {
  const bgClass = {
    surface: 'bg-surface dark:bg-dark-surface',
    transparent: 'bg-transparent',
    accent: 'bg-accent',
  }[variant];

  const defaultColor = variant === 'accent' ? '#FFFFFF' : undefined;

  return (
    <Pressable
      className={`
        w-11 h-11 rounded-full items-center justify-center
        ${bgClass}
        ${disabled ? 'opacity-50' : ''}
        active:scale-[0.98]
      `}
      disabled={disabled}
      accessibilityRole="button"
      {...props}
    >
      <Icon
        size={size}
        strokeWidth={1.75}
        color={color ?? defaultColor}
        className={variant === 'accent' ? '' : 'text-text-muted dark:text-dark-text-muted'}
      />
    </Pressable>
  );
}
