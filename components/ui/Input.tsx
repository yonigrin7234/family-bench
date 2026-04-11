import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="font-ui text-[13px] text-text-muted dark:text-dark-text-muted">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          bg-surface dark:bg-dark-surface
          border rounded-input px-4 py-3 h-12
          font-ui text-[15px] text-text-primary dark:text-dark-text
          ${focused ? 'border-accent' : 'border-border dark:border-dark-surface-hover'}
          ${error ? 'border-danger' : ''}
        `}
        placeholderTextColor="#9A9893"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="font-ui text-[13px] text-danger">{error}</Text>
      )}
    </View>
  );
}
