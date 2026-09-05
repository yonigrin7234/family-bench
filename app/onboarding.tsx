import * as Crypto from 'expo-crypto';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { useEffect, useId, useRef, useState } from 'react';
import { isCalendarDate } from '@/lib/utils/dateInput';
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
  return !trimmed || isCalendarDate(trimmed);
}

function FormLabel({ children, nativeID }: { children: string; nativeID?: string }) {
  return <Text nativeID={nativeID} style={styles.label}>{children}</Text>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  optional = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
  disabled?: boolean;
}) {
  const labelId = useId();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <FormLabel nativeID={labelId}>{label}</FormLabel>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        aria-labelledby={labelId}
        accessibilityHint={optional ? 'Optional' : 'Required'}
        editable={!disabled}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fbColors.inkMute}
        style={styles.input}
      />
    </View>
  );
}

export default function Onboarding() {
  const ownerId = useCaseIntelligenceStore((state) => state.ownerId);
  const selectedCaseId = useCaseIntelligenceStore((state) => state.snapshot.selectedCaseId);
  const params = useLocalSearchParams();
  return <OnboardingForm key={`${ownerId}:${selectedCaseId}:${params.mode ?? 'create'}`} />;
}

function OnboardingForm() {
  const params = useLocalSearchParams();
  const {
    activeCase,
    primaryPerson,
    otherParent,
    child,
    children,
    hearing,
    hasUserCaseSetup,
    isDemoCase,
    saveCaseSetup,
    hasHydrated,
  } = useCaseSetup();
  const editMode = params.mode === 'edit';
  const draftId = useRef(Crypto.randomUUID());
  const workspaceBusy = useCaseIntelligenceStore((state) => Boolean(state.saving || state.syncing || state.switchingCase || !state.hasLoaded || state.loading));
  const didPrefill = useRef(false);
  const [caseName, setCaseName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  const [county, setCounty] = useState('');
  const [department, setDepartment] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [userRole, setUserRole] = useState<CaseSetupUserRole>('petitioner');
  const [otherParentName, setOtherParentName] = useState('');
  const [childRows, setChildRows] = useState<Array<{ id: string; name: string; dateOfBirth: string }>>(() => [{ id: Crypto.randomUUID(), name: '', dateOfBirth: '' }]);
  const [nextHearingDate, setNextHearingDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPrefill = editMode && hasUserCaseSetup && !isDemoCase && activeCase;
  const canSave =
    Boolean(caseName.trim()) &&
    Boolean(courtName.trim()) &&
    Boolean(county.trim()) &&
    Boolean(otherParentName.trim()) &&
    childRows.length > 0 && childRows.every((row) => row.name.trim() && isDateInput(row.dateOfBirth)) &&
    isDateInput(nextHearingDate) &&
    hasHydrated && !workspaceBusy && (!editMode || Boolean(activeCase)) && !saving;

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
    setChildRows(children.length ? children.map((row) => ({ id: row.id, name: row.name, dateOfBirth: row.date_of_birth ?? '' })) : [{ id: Crypto.randomUUID(), name: '', dateOfBirth: '' }]);
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
      id: editMode ? activeCase?.id : draftId.current,
      mode: editMode ? 'edit' : 'create',
      caseName,
      caseNumber,
      courtName,
      county,
      department,
      judgeName,
      userRole,
      otherParentName,
      childName: childRows[0]?.name ?? '',
      children: childRows,
      nextHearingDate,
    };

    setSaving(true);
    setError(null);

    try {
      await saveCaseSetup(payload);
      const destination = params.next === 'capture' ? '/capture' : params.next === 'briefcase' ? '/briefcase' : '/';
      router.replace(destination as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save case setup. Your previous case has not changed.');
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
            {saving ? 'Saving' : editMode ? 'Save case details' : 'Create case'}
          </PillButton>
          {error ? <Text accessibilityRole="alert" style={styles.footerError}>{error}</Text> : null}
        </View>
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" disabled={saving} onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Private account
          </Chip>
          <Chip tone="mute" outline={false}>
            Cloud sync
          </Chip>
        </View>
        <Display size={32} style={styles.title}>
          {editMode ? 'Edit case setup' : 'Case setup'}
        </Display>
        <Text style={styles.subtitle}>
          Save the basic case details used across your workspace. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Case details</Text>
          <Chip tone="ink" outline={false}>
            Required basics
          </Chip>
        </View>
        <Field
          disabled={saving}
          label="Case name"
          value={caseName}
          onChangeText={setCaseName}
          placeholder="In re: Family Case"
        />
        <Field
          disabled={saving}
          label="Case number"
          value={caseNumber}
          onChangeText={setCaseNumber}
          placeholder="Optional if unknown"
          optional
        />
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Field
          disabled={saving}
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
          disabled={saving}
              label="Department"
              value={department}
              onChangeText={setDepartment}
              placeholder="Dept."
              optional
            />
          </View>
          <View style={styles.twoColItem}>
            <Field
          disabled={saving}
              label="Judge"
              value={judgeName}
              onChangeText={setJudgeName}
              placeholder="Judge name"
              optional
            />
          </View>
        </View>
        <Field
          disabled={saving}
          label="Next hearing date"
          value={nextHearingDate}
          onChangeText={setNextHearingDate}
          placeholder="YYYY-MM-DD"
          optional
        />
        {!isDateInput(nextHearingDate) ? (
          <Text accessibilityRole="alert" style={styles.fieldError}>Use YYYY-MM-DD for the hearing date.</Text>
        ) : null}
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>People</Text>
        <View style={styles.field}>
          <FormLabel>Your role</FormLabel>
          <Segment<CaseSetupUserRole>
            items={ROLE_ITEMS}
            value={userRole}
            onChange={(role) => { if (!saving) setUserRole(role); }}
          />
        </View>
        <Field
          disabled={saving}
          label="Other parent name"
          value={otherParentName}
          onChangeText={setOtherParentName}
          placeholder="Name"
        />
        <Rule />
        {childRows.map((row, index) => (
          <View key={row.id} style={styles.field}>
            <Field disabled={saving} label={`Child ${index + 1} name`} value={row.name} onChangeText={(name) => setChildRows((rows) => rows.map((item) => item.id === row.id ? { ...item, name } : item))} placeholder="Name" />
            <Field disabled={saving} label={`Child ${index + 1} date of birth`} optional value={row.dateOfBirth} onChangeText={(dateOfBirth) => setChildRows((rows) => rows.map((item) => item.id === row.id ? { ...item, dateOfBirth } : item))} placeholder="YYYY-MM-DD" />
            {!children.some((child) => child.id === row.id) && childRows.length > 1 ? <PillButton disabled={saving} tone="ghost" size="sm" onPress={() => setChildRows((rows) => rows.filter((item) => item.id !== row.id))}>Remove unsaved child</PillButton> : null}
          </View>
        ))}
        <PillButton disabled={saving} tone="ghost" onPress={() => setChildRows((rows) => [...rows, { id: Crypto.randomUUID(), name: '', dateOfBirth: '' }])}>Add child</PillButton>
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
    color: fbColors.inkMute,
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
