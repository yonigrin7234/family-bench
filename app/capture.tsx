// Capture — guided multi-step interview, parity with
// family bench/capture-flow.jsx. Six steps:
//   1. Type + child   (required)
//   2. When           (required)
//   3. Mood           (skippable)
//   4. Where          (skippable)
//   5. Attach         (skippable, placeholder)
//   6. Review + save  (final)
//
// Data model is unchanged. The same createEntry() call still runs at
// the end with the same fields. Visual structure mirrors the prototype.

import React, { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  BigChoice,
  Chip,
  Display,
  Icon,
  InfoCallout,
  MoodPicker,
  PillButton,
  ProgressBar,
  Rule,
  SoftCard,
  fbAlpha,
  fbBorder,
  fbColors,
  fbFonts,
  fbLegalCopy,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbType,
  fbWeights,
  type ChipTone,
  type IconName,
  type MoodKey,
} from '@/components/ui/fb';
import {
  ENTRY_TYPE_OPTIONS,
  getEntryTypeOption,
  useCaptureEntry,
  useCaseIntelligenceHome,
  type EntryTypeValue,
} from '@/lib/case-intelligence';

// ─── helpers ──────────────────────────────────────────────

function toDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function toTimeInput(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function isEntryType(value: string | undefined): value is EntryTypeValue {
  return ENTRY_TYPE_OPTIONS.some((option) => option.value === value);
}

function getInitialEntryType(value: unknown): EntryTypeValue {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && isEntryType(raw) ? raw : 'pickup_dropoff';
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function formatPrettyDate(value: string) {
  if (!isDateInput(value)) return value;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── shared primitives ────────────────────────────────────

function StepKicker({ children }: { children: string }) {
  return <Text style={styles.kicker}>{children}</Text>;
}

function StepHelp({ children }: { children: React.ReactNode }) {
  return <Text style={styles.help}>{children}</Text>;
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function PlainField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fbColors.inkFaint}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function FlagToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Flag this entry for review"
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.flagToggle, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value ? <Icon name="check" size={14} color={fbColors.paper} /> : null}
      </View>
      <View style={styles.flagCopy}>
        <Text style={styles.flagTitle}>Flag for follow-up</Text>
        <Text style={styles.flagBody}>
          Use this for entries that may need review later.
        </Text>
      </View>
    </Pressable>
  );
}

// ─── step content ─────────────────────────────────────────

function StepType({
  entryType,
  onChangeType,
}: {
  entryType: EntryTypeValue;
  onChangeType: (value: EntryTypeValue) => void;
}) {
  return (
    <View style={styles.stepBody}>
      <StepKicker>NEW JOURNAL ENTRY</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        Who was involved?
      </Display>
      <StepHelp>
        We&apos;ll use this to match the entry to the right custody order and
        child.
      </StepHelp>

      <FieldLabel>WHAT KIND OF EVENT?</FieldLabel>
      <View style={styles.stack}>
        {ENTRY_TYPE_OPTIONS.map((option) => (
          <BigChoice
            key={option.value}
            label={option.label}
            hint={option.body}
            icon={option.icon as IconName}
            selected={entryType === option.value}
            onPress={() => onChangeType(option.value)}
          />
        ))}
      </View>

      <InfoCallout title="Why we ask" tone="ink">
        Events of the same type aggregate into patterns. Three late exchanges
        in 30 days carries more weight than three disconnected notes.
      </InfoCallout>
    </View>
  );
}

function StepWhen({
  entryType,
  eventDate,
  setEventDate,
  eventTime,
  setEventTime,
}: {
  entryType: EntryTypeValue;
  eventDate: string;
  setEventDate: (value: string) => void;
  eventTime: string;
  setEventTime: (value: string) => void;
}) {
  const option = getEntryTypeOption(entryType);
  return (
    <View style={styles.stepBody}>
      <StepKicker>{option.label.toUpperCase()}</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        When did it happen?
      </Display>
      <StepHelp>
        The gap between scheduled and actual is what courts care about. For
        now, capture the time it actually happened.
      </StepHelp>

      <PlainField
        label="DATE"
        value={eventDate}
        onChangeText={setEventDate}
        placeholder="YYYY-MM-DD"
      />
      {isDateInput(eventDate) ? (
        <Text style={styles.fieldPreview}>{formatPrettyDate(eventDate)}</Text>
      ) : null}

      <View style={styles.fieldGap} />
      <PlainField
        label="TIME"
        value={eventTime}
        onChangeText={setEventTime}
        placeholder="HH:MM"
      />

      <InfoCallout title="Scheduled vs actual" tone="ink">
        We&apos;ll capture scheduled-vs-actual separately once the custody-order
        timing model lands. For now, this is the time you observed.
      </InfoCallout>
    </View>
  );
}

function StepMood({
  entryType,
  childMood,
  onChangeMood,
  body,
  onChangeBody,
}: {
  entryType: EntryTypeValue;
  childMood: MoodKey | undefined;
  onChangeMood: (value: MoodKey) => void;
  body: string;
  onChangeBody: (value: string) => void;
}) {
  const option = getEntryTypeOption(entryType);
  return (
    <View style={styles.stepBody}>
      <StepKicker>{option.label.toUpperCase()}</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        How did your child seem?
      </Display>
      <StepHelp>
        Pick the closest match. Emotional state is relevant to best-interest
        determinations. You can skip this step.
      </StepHelp>

      <MoodPicker value={childMood} onPick={onChangeMood} />

      <View style={styles.fieldGap} />
      <FieldLabel>OBSERVATIONS (OPTIONAL)</FieldLabel>
      <TextInput
        value={body}
        onChangeText={onChangeBody}
        placeholder="Verbatim quotes when possible. Keep it factual."
        placeholderTextColor={fbColors.inkFaint}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.inputMultiline]}
      />

      <InfoCallout title="What makes this admissible" tone="ox">
        A child&apos;s spontaneous statement made during emotional stress can be
        admitted under California Evidence Code § 1240, even though it&apos;s
        hearsay. Verbatim quotes plus context capture both conditions.
      </InfoCallout>
    </View>
  );
}

function StepWhere({
  entryType,
  locationName,
  setLocationName,
}: {
  entryType: EntryTypeValue;
  locationName: string;
  setLocationName: (value: string) => void;
}) {
  const option = getEntryTypeOption(entryType);
  return (
    <View style={styles.stepBody}>
      <StepKicker>{option.label.toUpperCase()}</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        Where did it happen?
      </Display>
      <StepHelp>
        Skip if you&apos;d rather not say. GPS is auto-captured at save time when
        permissions are granted.
      </StepHelp>

      <PlainField
        label="LOCATION"
        value={locationName}
        onChangeText={setLocationName}
        placeholder="e.g. 1425 Park Blvd, Oakland"
      />

      <InfoCallout title="Witnesses · coming later" tone="ink">
        Witness tracking will land with the witness data model. For now, name
        any witnesses in the observations field on the previous step.
      </InfoCallout>
    </View>
  );
}

function StepAttach() {
  return (
    <View style={styles.stepBody}>
      <StepKicker>ATTACH EVIDENCE</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        Anything to attach?
      </Display>
      <StepHelp>
        Photos, messages, receipts. Every attachment gets its own hash and
        timestamp when the attachment model lands.
      </StepHelp>

      <View style={styles.attachGrid}>
        {(
          [
            { label: 'Photo', icon: 'camera' },
            { label: 'Message', icon: 'chat' },
            { label: 'Receipt', icon: 'receipt' },
            { label: 'Document', icon: 'doc' },
          ] as { label: string; icon: IconName }[]
        ).map((slot) => (
          <View key={slot.label} style={styles.attachSlot}>
            <Icon name={slot.icon} size={18} color={fbColors.inkMute} />
            <Text style={styles.attachLabel}>{slot.label}</Text>
            <Text style={styles.attachComing}>Coming later</Text>
          </View>
        ))}
      </View>

      <InfoCallout title="Why attachments matter" tone="ink">
        Photos with intact EXIF data and message screenshots with platform
        timestamps are the strongest evidence. The attachment pipeline ships
        in a later pass.
      </InfoCallout>
    </View>
  );
}

function StepReview({
  entryType,
  eventDate,
  eventTime,
  title,
  setTitle,
  body,
  childMood,
  locationName,
  isFlagged,
  setIsFlagged,
  privateNotes,
  setPrivateNotes,
}: {
  entryType: EntryTypeValue;
  eventDate: string;
  eventTime: string;
  title: string;
  setTitle: (value: string) => void;
  body: string;
  childMood: MoodKey | undefined;
  locationName: string;
  isFlagged: boolean;
  setIsFlagged: (value: boolean) => void;
  privateNotes: string;
  setPrivateNotes: (value: string) => void;
}) {
  const option = getEntryTypeOption(entryType);
  const summaryRows: [string, string][] = [
    ['Date', isDateInput(eventDate) ? formatPrettyDate(eventDate) : eventDate || '—'],
    ['Time', eventTime || '—'],
    ['Type', option.label],
    ['Mood', childMood ? childMood : '—'],
    ['Location', locationName || '—'],
  ];
  return (
    <View style={styles.stepBody}>
      <StepKicker>ALMOST DONE</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        Does this look right?
      </Display>
      <StepHelp>
        We&apos;ll save this as one entry. Edits are tracked after sealing.{' '}
        {fbLegalCopy.legalInformationNotAdvice}
      </StepHelp>

      <SoftCard p={0} style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewHeaderType}>{option.label}</Text>
          <Chip tone={option.tone as ChipTone} outline={false}>
            {option.shortLabel}
          </Chip>
        </View>
        <View style={styles.reviewGrid}>
          {summaryRows.map(([key, value]) => (
            <View key={key} style={styles.reviewCell}>
              <Text style={styles.reviewKey}>{key.toUpperCase()}</Text>
              <Text style={styles.reviewValue}>{value}</Text>
            </View>
          ))}
        </View>
        {body ? (
          <View style={styles.reviewBodyBlock}>
            <Text style={styles.reviewKey}>OBSERVATIONS</Text>
            <Text style={styles.reviewBody}>{body}</Text>
          </View>
        ) : null}
      </SoftCard>

      <PlainField
        label="TITLE"
        value={title}
        onChangeText={setTitle}
        placeholder={option.defaultTitle}
      />

      <FlagToggle value={isFlagged} onChange={setIsFlagged} />

      <View style={styles.fieldGap} />
      <FieldLabel>PRIVATE NOTE (NOT FOR COURT)</FieldLabel>
      <TextInput
        value={privateNotes}
        onChangeText={setPrivateNotes}
        placeholder="Context you do not want mixed into a court-ready summary."
        placeholderTextColor={fbColors.inkFaint}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.inputMultiline]}
      />

      <InfoCallout title="What happens when you save" tone="ink">
        Content and metadata are written to your local case-intelligence
        store. You can still edit later — edits are logged, originals
        preserved.
      </InfoCallout>
    </View>
  );
}

// ─── main wizard ──────────────────────────────────────────

const TOTAL_STEPS = 6;

type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const SKIPPABLE: Record<StepIndex, boolean> = {
  0: false,
  1: false,
  2: true,
  3: true,
  4: true,
  5: false,
};

export default function Capture() {
  const params = useLocalSearchParams();
  const createEntry = useCaptureEntry();
  const { home } = useCaseIntelligenceHome();
  const requestedType = useMemo(() => getInitialEntryType(params.type), [params.type]);
  const [entryType, setEntryType] = useState<EntryTypeValue>(requestedType);
  const [eventDate, setEventDate] = useState(toDateInput());
  const [eventTime, setEventTime] = useState(toTimeInput());
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [locationName, setLocationName] = useState('');
  const [childMood, setChildMood] = useState<MoodKey | undefined>();
  const [isFlagged, setIsFlagged] = useState(false);
  const [privateNotes, setPrivateNotes] = useState('');
  const [step, setStep] = useState<StepIndex>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEntryType(requestedType);
  }, [requestedType]);

  const isLastStep = step === TOTAL_STEPS - 1;
  const canContinue = canStepContinue();
  const canSkip = SKIPPABLE[step];

  function canStepContinue() {
    if (step === 0) return Boolean(entryType);
    if (step === 1) return isDateInput(eventDate);
    if (step === 5) {
      const finalTitle = title.trim() || getEntryTypeOption(entryType).defaultTitle;
      return Boolean(finalTitle) && isDateInput(eventDate) && !saving;
    }
    return true;
  }

  function next() {
    if (isLastStep) {
      onSave();
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1) as StepIndex);
  }

  function back() {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(s - 1, 0) as StepIndex);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const finalTitle = title.trim() || getEntryTypeOption(entryType).defaultTitle;
      await createEntry({
        entryType,
        eventDate: eventDate.trim(),
        eventTime: eventTime.trim() || null,
        title: finalTitle,
        body,
        locationName,
        childMood: childMood ?? null,
        isFlagged,
        privateNotes,
      });
      router.replace('/timeline' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this entry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CaseScreen
      footer={
        <View style={styles.footer}>
          {canSkip ? (
            <PillButton
              tone="ghost"
              size="lg"
              onPress={() => setStep((s) => Math.min(s + 1, 5) as StepIndex)}
            >
              Skip
            </PillButton>
          ) : null}
          <PillButton
            tone="primary"
            size="lg"
            full={!canSkip}
            iconRight={isLastStep ? 'check' : 'chevR'}
            disabled={!canContinue}
            onPress={next}
          >
            {isLastStep ? (saving ? 'Saving' : 'Save and seal entry') : 'Continue'}
          </PillButton>
          {error ? <Text style={styles.footerError}>{error}</Text> : null}
        </View>
      }
    >
      <View style={styles.wizHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 0 ? 'Cancel capture' : 'Previous step'}
          onPress={back}
          style={({ pressed }) => [styles.chromeButton, pressed && styles.pressed]}
        >
          <View style={styles.chromeIconLeft}>
            <Icon name="caret" size={16} color={fbColors.ink} />
          </View>
        </Pressable>
        <Text style={styles.stepCounter}>
          Step <Text style={styles.stepCounterNum}>{step + 1}</Text> of {TOTAL_STEPS}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close capture"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.chromeButton, pressed && styles.pressed]}
        >
          <Icon name="x" size={14} color={fbColors.ink} />
        </Pressable>
      </View>

      <ProgressBar
        pct={Math.round(((step + 1) / TOTAL_STEPS) * 100)}
        style={styles.wizProgress}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <StepType entryType={entryType} onChangeType={setEntryType} />
        ) : null}
        {step === 1 ? (
          <StepWhen
            entryType={entryType}
            eventDate={eventDate}
            setEventDate={setEventDate}
            eventTime={eventTime}
            setEventTime={setEventTime}
          />
        ) : null}
        {step === 2 ? (
          <StepMood
            entryType={entryType}
            childMood={childMood}
            onChangeMood={setChildMood}
            body={body}
            onChangeBody={setBody}
          />
        ) : null}
        {step === 3 ? (
          <StepWhere
            entryType={entryType}
            locationName={locationName}
            setLocationName={setLocationName}
          />
        ) : null}
        {step === 4 ? <StepAttach /> : null}
        {step === 5 ? (
          <StepReview
            entryType={entryType}
            eventDate={eventDate}
            eventTime={eventTime}
            title={title}
            setTitle={setTitle}
            body={body}
            childMood={childMood}
            locationName={locationName}
            isFlagged={isFlagged}
            setIsFlagged={setIsFlagged}
            privateNotes={privateNotes}
            setPrivateNotes={setPrivateNotes}
          />
        ) : null}

        {home.activeCase ? (
          <Text style={styles.caseFootnote}>
            Capturing for {home.activeCase.title || 'current case'}.
          </Text>
        ) : null}
      </ScrollView>
    </CaseScreen>
  );
}

// ─── styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  pressed: {
    opacity: fbAlpha.pressed,
  },
  wizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: fbSpacing.x2,
    paddingBottom: fbSpacing.x3,
  },
  chromeButton: {
    width: fbTouch.min,
    height: fbTouch.min,
    borderRadius: fbRadii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  chromeIconLeft: {
    transform: [{ rotate: '180deg' }],
  },
  stepCounter: {
    color: fbColors.inkMute,
    fontSize: 12,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
    letterSpacing: 0.4,
  },
  stepCounterNum: {
    color: fbColors.ink,
    fontFamily: fbFonts.monoSemi,
    fontWeight: fbWeights.semi,
  },
  wizProgress: {
    marginBottom: fbSpacing.x4,
  },
  scroll: {
    paddingBottom: fbSpacing.x8,
  },
  stepBody: {
    gap: fbSpacing.x3,
  },
  kicker: {
    color: fbColors.ox,
    fontSize: 11,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  stepTitle: {
    marginTop: fbSpacing.x1,
    lineHeight: 30,
  },
  help: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 22,
    fontFamily: fbFonts.sansRegular,
    marginBottom: fbSpacing.x3,
  },
  stack: {
    gap: fbSpacing.x2,
    marginBottom: fbSpacing.x4,
  },
  fieldLabel: {
    color: fbColors.inkMute,
    fontSize: 11,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: fbSpacing.x2,
  },
  field: {
    marginBottom: fbSpacing.x1,
  },
  fieldGap: {
    height: fbSpacing.x4,
  },
  fieldPreview: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
    marginTop: fbSpacing.x1,
  },
  input: {
    minHeight: fbTouch.min,
    paddingHorizontal: fbSpacing.x4,
    paddingVertical: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  inputMultiline: {
    minHeight: 96,
    paddingTop: fbSpacing.x3,
  },
  flagToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x4,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    marginTop: fbSpacing.x3,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: fbColors.inkMute,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: fbColors.ink,
    borderColor: fbColors.ink,
  },
  flagCopy: {
    flex: 1,
  },
  flagTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  flagBody: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  attachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
    marginBottom: fbSpacing.x4,
  },
  attachSlot: {
    flexBasis: '47.5%',
    flexGrow: 1,
    minHeight: 96,
    borderRadius: fbRadii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: fbSpacing.x4,
  },
  attachLabel: {
    color: fbColors.ink,
    fontSize: 13,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  attachComing: {
    color: fbColors.inkMute,
    fontSize: 10.5,
    fontFamily: fbFonts.monoMedium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reviewCard: {
    marginBottom: fbSpacing.x3,
    borderTopWidth: 3,
    borderTopColor: fbColors.ox,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x2,
    paddingVertical: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x4,
    backgroundColor: fbColors.paperDeep,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.ruleSoft,
  },
  reviewHeaderType: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: fbSpacing.x4,
    paddingVertical: fbSpacing.x4,
    rowGap: fbSpacing.x3,
  },
  reviewCell: {
    width: '50%',
  },
  reviewKey: {
    color: fbColors.inkMute,
    fontSize: 10,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  reviewValue: {
    marginTop: 3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  reviewBodyBlock: {
    paddingHorizontal: fbSpacing.x4,
    paddingBottom: fbSpacing.x4,
  },
  reviewBody: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 22,
    fontFamily: fbFonts.sansRegular,
  },
  caseFootnote: {
    marginTop: fbSpacing.x6,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
    textAlign: 'center',
  },
  footer: {
    gap: fbSpacing.x2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  footerError: {
    width: '100%',
    color: fbColors.ox,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
    textAlign: 'center',
  },
});
