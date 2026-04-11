import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore } from '@/stores/onboarding';

export default function CourtStep() {
  const router = useRouter();
  const { courtName, department, caseNumber, judgeName, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={1}
      totalSteps={5}
      title="Court details"
      description="This information appears on all your court documents. You can find it on any existing filing or your case docket."
      onNext={() => router.push('/(auth)/onboarding/parties')}
      onBack={() => router.back()}
    >
      <Input
        label="Court name"
        value={courtName}
        onChangeText={(v) => setField('courtName', v)}
        placeholder="e.g. Superior Court of California, County of Los Angeles"
      />
      <Input
        label="Department"
        value={department}
        onChangeText={(v) => setField('department', v)}
        placeholder="e.g. Department 5"
      />
      <Input
        label="Case number"
        value={caseNumber}
        onChangeText={(v) => setField('caseNumber', v)}
        placeholder="e.g. 25STFL03668"
      />
      <Input
        label="Judge name"
        value={judgeName}
        onChangeText={(v) => setField('judgeName', v)}
        placeholder="e.g. Hon. Smith"
      />
    </OnboardingStep>
  );
}
