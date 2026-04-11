import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import type { PressableProps } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  label: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-[#1A1A18] dark:bg-[#EEEEEE]',
    text: 'text-white dark:text-[#1A1A18]',
  },
  accent: {
    container: 'bg-accent dark:bg-accent',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-[#F0F0EA] dark:bg-dark-surface',
    text: 'text-text-primary dark:text-dark-text',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-text-muted dark:text-dark-text-muted',
  },
  destructive: {
    container: 'bg-transparent',
    text: 'text-danger',
  },
};

export function Button({
  variant = 'primary',
  label,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isCompact = variant === 'ghost' || variant === 'destructive';
  const heightClass = isCompact ? 'py-2' : 'h-[52px]';
  const paddingClass = isCompact ? 'px-3' : 'px-6';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <Pressable
      className={`
        flex-row items-center justify-center rounded-button
        ${heightClass} ${paddingClass} ${widthClass}
        ${styles.container}
        ${disabled || loading ? 'opacity-50' : ''}
        active:scale-[0.98]
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#2563EB'}
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon && iconPosition === 'left' && (
            <Icon
              size={20}
              strokeWidth={1.75}
              className={styles.text}
            />
          )}
          <Text
            className={`
              font-ui text-[14px] font-medium
              ${styles.text}
            `}
          >
            {label}
          </Text>
          {Icon && iconPosition === 'right' && (
            <Icon
              size={20}
              strokeWidth={1.75}
              className={styles.text}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}
