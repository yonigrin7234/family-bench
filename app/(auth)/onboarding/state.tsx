import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore } from '@/stores/onboarding';
import { View, Text, Pressable, ScrollView } from 'react-native';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

export default function StateStep() {
  const router = useRouter();
  const { state, county, setField } = useOnboardingStore();

  return (
    <OnboardingStep
      step={0}
      totalSteps={5}
      title="Where is your case?"
      description="Your state determines which laws, court forms, and legal standards apply to your case."
      onNext={() => router.push('/(auth)/onboarding/court')}
    >
      <View className="gap-1.5">
        <Text className="font-ui text-[13px] text-text-muted">State</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-1.5" style={{ maxWidth: 600 }}>
            {US_STATES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setField('state', s)}
                className={`px-3 py-2 rounded-button border ${
                  state === s ? 'border-accent bg-accent-lighter' : 'border-border bg-surface'
                }`}
              >
                <Text className={`font-ui text-[13px] ${state === s ? 'text-accent font-medium' : 'text-text-muted'}`}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <Input
        label="County"
        value={county}
        onChangeText={(v) => setField('county', v)}
        placeholder="e.g. Los Angeles"
      />
    </OnboardingStep>
  );
}
