import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';

interface OnboardingStepProps {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  loading?: boolean;
}

export function OnboardingStep({
  step, totalSteps, title, description, children,
  onNext, onBack, nextLabel = 'Continue', loading,
}: OnboardingStepProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F0' }} edges={['top']}>
      {/* Progress bar + back */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ width: 44 }}>
          {onBack && (
            <Pressable
              onPress={onBack}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 }}
            >
              <ArrowLeft size={20} strokeWidth={1.75} color="#1A1A18" />
            </Pressable>
          )}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 16 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: i <= step ? '#2563EB' : 'rgba(0,0,0,0.08)',
              }}
            />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontFamily: 'Georgia', fontSize: 28, fontWeight: '600', color: '#1A1A18', marginBottom: 8 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: 'System', fontSize: 15, color: '#6B6A68', lineHeight: 22, marginBottom: 32 }}>
          {description}
        </Text>
        <View style={{ gap: 16 }}>{children}</View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <Pressable
          onPress={onNext}
          disabled={loading}
          style={{
            backgroundColor: '#2563EB', height: 52, borderRadius: 12,
            alignItems: 'center', justifyContent: 'center',
            opacity: loading ? 0.5 : 1,
          }}
          className="active:scale-[0.98]"
        >
          <Text style={{ fontFamily: 'System', fontSize: 15, fontWeight: '500', color: '#FFFFFF' }}>
            {nextLabel}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
