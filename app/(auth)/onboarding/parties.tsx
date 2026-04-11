import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { Input } from '@/components/ui/Input';
import { Separator } from '@/components/ui/Separator';
import { useOnboardingStore } from '@/stores/onboarding';
import { View, Text } from 'react-native';

export default function PartiesStep() {
  const router = useRouter();
  const { fullName, otherParentName, attorneyName, opposingAttorneyName, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={2}
      totalSteps={5}
      title="Who's involved?"
      description="We need names for your court documents. Attorney fields are optional."
      onNext={() => router.push('/(auth)/onboarding/children')}
      onBack={() => router.back()}
    >
      <Input
        label="Your full name"
        value={fullName}
        onChangeText={(v) => setField('fullName', v)}
        placeholder="Your legal name as it appears on filings"
      />
      <Input
        label="Other parent's name"
        value={otherParentName}
        onChangeText={(v) => setField('otherParentName', v)}
        placeholder="Their legal name"
      />

      <Separator />
      <Text className="font-ui text-[13px] text-text-muted">Optional</Text>

      <Input
        label="Your attorney (if any)"
        value={attorneyName}
        onChangeText={(v) => setField('attorneyName', v)}
        placeholder="Attorney name"
      />
      <Input
        label="Opposing attorney (if any)"
        value={opposingAttorneyName}
        onChangeText={(v) => setField('opposingAttorneyName', v)}
        placeholder="Their attorney name"
      />
    </OnboardingStep>
  );
}
