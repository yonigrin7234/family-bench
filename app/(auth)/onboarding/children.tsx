import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/stores/onboarding';
import { View, Text, Pressable } from 'react-native';
import { Plus, X } from 'lucide-react-native';

export default function ChildrenStep() {
  const router = useRouter();
  const { children, addChild, updateChild, removeChild } = useOnboardingStore();

  return (
    <OnboardingStep
      step={3}
      totalSteps={5}
      title="Your children"
      description="Names and dates of birth help us track per-child entries and generate accurate court documents."
      onNext={() => router.push('/(auth)/onboarding/schedule')}
      onBack={() => router.back()}
    >
      {children.map((child, index) => (
        <View key={index} className="gap-3 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-ui text-[14px] font-medium text-text-primary dark:text-dark-text">
              Child {index + 1}
            </Text>
            {children.length > 1 && (
              <Pressable onPress={() => removeChild(index)} hitSlop={8}>
                <X size={18} strokeWidth={1.75} className="text-text-muted" />
              </Pressable>
            )}
          </View>
          <Input
            label="Name"
            value={child.name}
            onChangeText={(v) => updateChild(index, 'name', v)}
            placeholder="Child's first name"
          />
          <Input
            label="Date of birth"
            value={child.dateOfBirth}
            onChangeText={(v) => updateChild(index, 'dateOfBirth', v)}
            placeholder="MM/DD/YYYY"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      ))}

      <Button
        variant="secondary"
        label="Add another child"
        icon={Plus}
        onPress={addChild}
      />
    </OnboardingStep>
  );
}
