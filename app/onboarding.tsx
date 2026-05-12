import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  InfoCallout,
  PillButton,
  Rule,
  Segment,
  SoftCard,
  fbBorder,
  fbColors,
  fbFonts,
  fbLegalCopy,
  fbRadii,
  fbSpacing,
  fbType,
  fbWeights,
} from '@/components/ui/fb';
import {
  useCaseSetup,
  type CaseSetupInput,
  type CaseSetupUserRole,
} from '@/lib/case-intelligence';

const ROLE_ITEMS: Array<{ v: CaseSetupUserRole; label: string }> = [
  { v: 'petitioner', label: 'Petitioner' },
  { v: 'respondent', label: 'Respondent' },
  { v: 'other', label: 'Other' },
];

function isDateInput(value: string) {
  const trimmed = value.trim();
  return !trimmed || /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
}

function FormLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  optional = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <FormLabel>{label}</FormLabel>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fbColors.inkFaint}
        style={styles.input}
      />
    </View>
  );
}

export default function Onboarding() {
  const params = useLocalSearchParams();
  const {
    activeCase,
    primaryPerson,
    otherParent,
    child,
    hearing,
    hasUserCaseSetup,
    isDemoCase,
    saveCaseSetup,
    hasHydrated,
  } = useCaseSetup();
  const editMode = params.mode === 'edit';
  const didPrefill = useRef(false);
  const [caseName, setCaseName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  const [county, setCounty] = useState('');
  const [department, setDepartment] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [userRole, setUserRole] = useState<CaseSetupUserRole>('petitioner');
  const [otherParentName, setOtherParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPrefill = hasUserCaseSetup && !isDemoCase && activeCase;
  const canSave =
    Boolean(caseName.trim()) &&
    Boolean(courtName.trim()) &&
    Boolean(county.trim()) &&
    Boolean(otherParentName.trim()) &&
    Boolean(childName.trim()) &&
    isDateInput(nextHearingDate) &&
    !saving;

  useEffect(() => {
    if (!hasHydrated || didPrefill.current || !canPrefill) return;

    setCaseName(activeCase.title ?? '');
    setCaseNumber(activeCase.case_number ?? '');
    setCourtName(activeCase.court_name ?? '');
    setCounty(activeCase.county ?? '');
    setDepartment(activeCase.department ?? '');
    setJudgeName(activeCase.judge_name ?? '');
    setUserRole(
      primaryPerson?.role === 'respondent' || primaryPerson?.role === 'other'
        ? primaryPerson.role
        : 'petitioner',
    );
    setOtherParentName(otherParent?.display_name ?? '');
    setChildName(child?.name ?? '');
    setNextHearingDate(
      activeCase.next_hearing_at?.slice(0, 10) ?? hearing?.event_date ?? '',
    );
    didPrefill.current = true;
  }, [
    activeCase,
    canPrefill,
    child,
    hasHydrated,
    hearing,
    otherParent,
    primaryPerson,
  ]);

  async function onSave() {
    if (!canSave) {
      setError('Add the required case, court, county, parent, and child details.');
      return;
    }

    const payload: CaseSetupInput = {
      caseName,
      caseNumber,
      courtName,
      county,
      department,
      judgeName,
      userRole,
      otherParentName,
      childName,
      nextHearingDate,
    };

    setSaving(true);
    setError(null);

    try {
      await saveCaseSetup(payload);
      router.replace('/' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save local case setup.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CaseScreen
      footer={
        <View style={styles.footer}>
          <PillButton
            tone="primary"
            size="lg"
            full
            icon="check"
            disabled={!canSave}
            onPress={onSave}
          >
            {saving ? 'Saving' : editMode ? 'Save case details' : 'Create local case'}
          </PillButton>
          {error ? <Text style={styles.footerError}>{error}</Text> : null}
        </View>
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Local only
          </Chip>
          <Chip tone="mute" outline={false}>
            No remote writes
          </Chip>
        </View>
        <Display size={32} style={styles.title}>
          {editMode ? 'Edit case setup' : 'Case setup'}
        </Display>
        <Text style={styles.subtitle}>
          Save the basic case details used across the local workspace. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      {isDemoCase ? (
        <InfoCallout title="Demo mode" tone="ink">
          Demo seed data is loaded until this local case is saved. Existing local entries remain on
          this device.
        </InfoCallout>
      ) : null}

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Case details</Text>
          <Chip tone="ink" outline={false}>
            Required basics
          </Chip>
        </View>
        <Field
          label="Case name"
          value={caseName}
          onChangeText={setCaseName}
          placeholder="In re: Family Case"
        />
        <Field
          label="Case number"
          value={caseNumber}
          onChangeText={setCaseNumber}
          placeholder="Optional if unknown"
          optional
        />
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Field
              label="Court"
              value={courtName}
              onChangeText={setCourtName}
              placeholder="Court name"
            />
          </View>
          <View style={styles.twoColItem}>
            <Field label="County" value={county} onChangeText={setCounty} placeholder="County" />
          </View>
        </View>
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Field
              label="Department"
              value={department}
              onChangeText={setDepartment}
              placeholder="Dept."
              optional
            />
          </View>
          <View style={styles.twoColItem}>
            <Field
              label="Judge"
              value={judgeName}
              onChangeText={setJudgeName}
              placeholder="Judge name"
              optional
            />
          </View>
        </View>
        <Field
          label="Next hearing date"
          value={nextHearingDate}
          onChangeText={setNextHearingDate}
          placeholder="YYYY-MM-DD"
          optional
        />
        {!isDateInput(nextHearingDate) ? (
          <Text style={styles.fieldError}>Use YYYY-MM-DD for the hearing date.</Text>
        ) : null}
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <Text style={styles.sectionTitle}>People</Text>
        <View style={styles.field}>
          <FormLabel>Your role</FormLabel>
          <Segment<CaseSetupUserRole>
            items={ROLE_ITEMS}
            value={userRole}
            onChange={setUserRole}
          />
        </View>
        <Field
          label="Other parent name"
          value={otherParentName}
          onChangeText={setOtherParentName}
          placeholder="Name"
        />
        <Rule />
        <Field
          label="Child name"
          value={childName}
          onChangeText={setChildName}
          placeholder="Name"
        />
      </SoftCard>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
  },
  kickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  title: {
    marginTop: fbSpacing.x2,
    lineHeight: 34,
  },
  subtitle: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  section: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  sectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.2,
  },
  twoCol: {
    flexDirection: 'row',
    gap: fbSpacing.x3,
  },
  twoColItem: {
    flex: 1,
    minWidth: 0,
  },
  field: {
    gap: fbSpacing.x2,
  },
  labelRow: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x2,
  },
  label: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
  },
  optional: {
    color: fbColors.inkFaint,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansRegular,
  },
  input: {
    minHeight: 46,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    paddingHorizontal: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  fieldError: {
    color: fbColors.oxDeep,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  footer: {
    gap: fbSpacing.x2,
  },
  footerError: {
    color: fbColors.oxDeep,
    fontSize: fbType.small,
    textAlign: 'center',
    fontFamily: fbFonts.sansRegular,
  },
});
