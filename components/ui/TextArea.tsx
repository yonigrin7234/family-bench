import { View, Text, TextInput } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useState } from 'react';

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, ...props }: TextAreaProps) {
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
          border rounded-input px-4 py-3 min-h-[120px]
          font-ui text-[15px] text-text-primary dark:text-dark-text
          ${focused ? 'border-accent' : 'border-border dark:border-dark-surface-hover'}
          ${error ? 'border-danger' : ''}
        `}
        placeholderTextColor="#9A9893"
        multiline
        textAlignVertical="top"
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
