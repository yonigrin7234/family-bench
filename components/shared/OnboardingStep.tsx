import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react-native';
import { IconButton } from '@/components/ui/IconButton';
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
  step,
  totalSteps,
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Continue',
  loading,
}: OnboardingStepProps) {
  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-dark-page" edges={['top']}>
      {/* Progress + back */}
      <View className="flex-row items-center px-4 py-2">
        <View className="w-11">
          {onBack && <IconButton icon={ArrowLeft} variant="transparent" onPress={onBack} />}
        </View>
        <View className="flex-1 flex-row gap-1 px-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i < step ? 'bg-accent' : i === step ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </View>
        <View className="w-11" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-display text-[28px] font-semibold text-text-primary dark:text-dark-text mb-2">
          {title}
        </Text>
        <Text className="font-ui text-[15px] text-text-muted dark:text-dark-text-muted mb-8 leading-relaxed">
          {description}
        </Text>

        <View className="gap-4">{children}</View>
      </ScrollView>

      <View className="px-6 pb-6">
        <Button
          variant="accent"
          label={nextLabel}
          onPress={onNext}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}
