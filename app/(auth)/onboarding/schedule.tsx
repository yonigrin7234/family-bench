import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { useOnboardingStore } from '@/stores/onboarding';
import { View, Text, Pressable } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';

const caseStages = [
  { key: 'pre_filing', label: 'Haven\'t filed yet' },
  { key: 'just_filed', label: 'Just filed' },
  { key: 'responding', label: 'Responding to a filing' },
  { key: 'active_litigation', label: 'Active litigation' },
  { key: 'post_judgment', label: 'Post-judgment / modification' },
];

const conflictLevels = [
  { key: 'low', label: 'Low — generally cooperative' },
  { key: 'medium', label: 'Medium — some disagreements' },
  { key: 'high', label: 'High — frequent conflict' },
  { key: 'safety', label: 'Safety concerns' },
];

const representationOptions = [
  { key: 'self_rep_vs_attorney', label: 'Self-represented (other parent has attorney)' },
  { key: 'both_self_rep', label: 'Both self-represented' },
  { key: 'have_attorney', label: 'I have an attorney' },
  { key: 'had_attorney', label: 'Had an attorney, now self-represented' },
];

const needOptions = [
  'Document evidence for court',
  'Generate court filings',
  'Track custody compliance',
  'Organize expense records',
  'Prepare for a hearing',
  'Import existing communications',
];

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View className="gap-2">
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onSelect(opt.key)}
          className={`px-4 py-3 rounded-card border ${
            selected === opt.key
              ? 'border-accent bg-accent-lighter'
              : 'border-border bg-surface dark:bg-dark-surface'
          }`}
        >
          <Text
            className={`font-ui text-[14px] ${
              selected === opt.key ? 'text-accent font-medium' : 'text-text-primary dark:text-dark-text'
            }`}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function ScheduleStep() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create profile
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: store.fullName,
        email: user.email ?? '',
        role: 'parent',
        state: store.state,
        county: store.county,
        case_stage: store.caseStage || null,
        conflict_level: store.conflictLevel || null,
        representation_status: store.representationStatus || null,
        immediate_needs: store.immediateNeeds,
        onboarding_completed_at: new Date().toISOString(),
      });

      // Create case
      const { data: caseData } = await supabase.from('cases').insert({
        user_id: user.id,
        case_number: store.caseNumber || null,
        court_name: store.courtName || null,
        department: store.department || null,
        judge_name: store.judgeName || null,
      }).select().single();

      // Create parties
      if (caseData) {
        const parties = [
          { case_id: caseData.id, role: 'self', name: store.fullName },
          store.otherParentName && { case_id: caseData.id, role: 'other_parent', name: store.otherParentName },
          store.attorneyName && { case_id: caseData.id, role: 'attorney', name: store.attorneyName },
          store.opposingAttorneyName && { case_id: caseData.id, role: 'opposing_attorney', name: store.opposingAttorneyName },
        ].filter(Boolean);

        if (parties.length > 0) {
          await supabase.from('parties').insert(parties);
        }
      }

      // Create children
      const validChildren = store.children.filter((c) => c.name.trim());
      if (validChildren.length > 0) {
        await supabase.from('children').insert(
          validChildren.map((c) => ({
            user_id: user.id,
            name: c.name,
            date_of_birth: c.dateOfBirth || null,
          }))
        );
      }

      router.replace('/(app)/(journal)');
    } catch (e) {
      console.error('Onboarding save failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      step={4}
      totalSteps={5}
      title="About your case"
      description="This helps us customize your experience and surface the right tools at the right time."
      onNext={handleFinish}
      onBack={() => router.back()}
      nextLabel="Get started"
      loading={loading}
    >
      <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text mb-1">
        Case stage
      </Text>
      <ChipGroup
        options={caseStages}
        selected={store.caseStage}
        onSelect={(k) => store.setField('caseStage', k)}
      />

      <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text mb-1 mt-4">
        Conflict level
      </Text>
      <ChipGroup
        options={conflictLevels}
        selected={store.conflictLevel}
        onSelect={(k) => store.setField('conflictLevel', k)}
      />

      <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text mb-1 mt-4">
        Representation
      </Text>
      <ChipGroup
        options={representationOptions}
        selected={store.representationStatus}
        onSelect={(k) => store.setField('representationStatus', k)}
      />

      <Text className="font-display text-[18px] font-semibold text-text-primary dark:text-dark-text mb-1 mt-4">
        What do you need most right now?
      </Text>
      <View className="gap-2">
        {needOptions.map((need) => (
          <Pressable
            key={need}
            onPress={() => store.toggleNeed(need)}
            className={`px-4 py-3 rounded-card border ${
              store.immediateNeeds.includes(need)
                ? 'border-accent bg-accent-lighter'
                : 'border-border bg-surface dark:bg-dark-surface'
            }`}
          >
            <Text
              className={`font-ui text-[14px] ${
                store.immediateNeeds.includes(need) ? 'text-accent font-medium' : 'text-text-primary dark:text-dark-text'
              }`}
            >
              {need}
            </Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStep>
  );
}
