import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ label, options, value, onValueChange, placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontFamily: 'System', fontSize: 13, color: '#6B6A68' }}>{label}</Text>
      )}
      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          backgroundColor: '#FFFFFF', borderRadius: 12,
          borderWidth: 1, borderColor: open ? '#2563EB' : 'rgba(0,0,0,0.08)',
          paddingHorizontal: 16, paddingVertical: 12, height: 48,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Text style={{
          fontFamily: 'System', fontSize: 15,
          color: selected ? '#1A1A18' : '#9A9893',
        }}>
          {selected?.label ?? placeholder ?? 'Select...'}
        </Text>
        <ChevronDown size={16} strokeWidth={1.75} color="#9A9893" />
      </Pressable>

      {open && (
        <View style={{
          backgroundColor: '#FFFFFF', borderRadius: 12,
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          overflow: 'hidden',
        }}>
          {options.map((option, index) => (
            <Pressable
              key={option.value}
              onPress={() => { onValueChange(option.value); setOpen(false); }}
              style={{
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: option.value === value ? '#EFF6FF' : 'transparent',
                borderBottomWidth: index < options.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <Text style={{
                fontFamily: 'System', fontSize: 15,
                color: option.value === value ? '#2563EB' : '#1A1A18',
                fontWeight: option.value === value ? '500' : '400',
              }}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
