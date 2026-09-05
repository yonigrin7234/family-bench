import { isCalendarDate, normalizeOptionalTime, localCalendarDate } from '@/lib/utils/dateInput';
// Capture — guided multi-step interview, parity with
// family bench/capture-flow.jsx. Six steps:
//   1. Type + child   (required)
//   2. When           (required)
//   3. Mood           (skippable)
//   4. Where          (skippable)
//   5. Attach         (skippable, original files)
//   6. Review + save  (final)
//
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
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
  useCreateLocalAttachment,
  useCaseIntelligenceHome,
  type EntryTypeValue,
} from '@/lib/case-intelligence';
import { discardPickedEvidence, pickEvidenceFile, type EvidencePickerSource } from '@/lib/evidence/picker';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import { buildTypedCaptureDetails, captureChoiceLabel, TYPED_CAPTURE_FIELDS, recordedInstant, typedCaptureSummary, type CaptureDraft, type TypedCaptureDetails } from '@/lib/reporting/capture';
import { savePendingCaptureAttachments, type StagedAttachment } from '@/lib/evidence/captureQueue';

// ─── helpers ──────────────────────────────────────────────

function toDateInput(date = new Date()) {
  return localCalendarDate(date);
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
  return isCalendarDate(value.trim());
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
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}) {
  const labelId = useId();
  return (
    <View style={styles.field}>
      <Text nativeID={labelId} style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        aria-labelledby={labelId}
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={fbColors.inkMute}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function CaptureChoices({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (value: string) => void }) {
  return <View style={styles.choiceRow}>{options.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: value === option }} accessibilityLabel={`${label}: ${option ? captureChoiceLabel(option) : 'Not recorded'}`} onPress={() => onChange(option)} style={styles.choiceButton}>
    <Chip tone={value === option ? 'ink' : 'mute'} outline={value !== option}>{option ? captureChoiceLabel(option) : 'Not recorded'}</Chip>
  </Pressable>)}</View>;
}

function FlagToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
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
        What happened?
      </Display>
      <StepHelp>
        Choose the kind of record you want to save. The next steps ask for its specific details.
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
        A consistent entry type helps you find related records and summarize the facts you recorded.
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
        Record the date and time you observed. For an exchange, this is the actual exchange time; add any scheduled time on the next step.
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
        label="TIME (24-hour; UTC offset optional)"
        value={eventTime}
        onChangeText={setEventTime}
        placeholder="HH:MM"
      />

      <InfoCallout title="Scheduled vs actual" tone="ink">
        Scheduled and actual times stay separate. Durations use recorded time-zone offsets; no custody schedule or legal conclusion is inferred.
      </InfoCallout>
    </View>
  );
}

function StepDetails({ entryType, childMood, onChangeMood, body, onChangeBody, draft, onChangeDraft, replyOptions }: {
  entryType: EntryTypeValue; childMood: MoodKey | undefined; onChangeMood: (value: MoodKey) => void;
  body: string; onChangeBody: (value: string) => void; draft: CaptureDraft;
  onChangeDraft: (key: string, value: string) => void;
  replyOptions: Array<{ id: string; title: string }>;
}) {
  const option = getEntryTypeOption(entryType);
  return <View style={styles.stepBody}>
    <StepKicker>{option.label.toUpperCase()}</StepKicker>
    <Display size={26} style={styles.stepTitle}>Record the details</Display>
    <StepHelp>Use what you observed or received. Leave optional facts blank when you do not know them.</StepHelp>
    {(TYPED_CAPTURE_FIELDS[entryType] ?? []).map((field) => <View key={field.key} style={styles.field}>
      {field.options ? <>
        <FieldLabel>{field.label}</FieldLabel>
        <CaptureChoices label={field.label} options={field.options} value={draft[field.key] ?? ""} onChange={(value) => onChangeDraft(field.key, value)} />
      </> : <PlainField label={`${field.label}${field.required ? ' · Required' : ''}`} value={draft[field.key] ?? ''} onChangeText={(value) => onChangeDraft(field.key, value)} placeholder={field.placeholder} multiline={field.multiline} />}
    </View>)}
    {['pickup_dropoff', 'visit_denied'].includes(entryType) ? <InfoCallout title="Date and time" tone="ink">Use YYYY-MM-DD HH:MM in this device’s time zone. For another zone or a repeated clock-change hour, add the UTC offset, for example 2026-11-01 01:30-07:00. Saved dates and offsets appear in review.</InfoCallout> : null}
    {entryType === 'message' && draft.direction === 'received' ? <View style={styles.stack}>
      <FieldLabel>Reply to a recorded sent message (optional)</FieldLabel>
      <BigChoice label="No linked message" selected={!draft.replyToEntryId} onPress={() => onChangeDraft('replyToEntryId', '')} />
      {replyOptions.map((entry) => <BigChoice key={entry.id} label={entry.title} selected={draft.replyToEntryId === entry.id} onPress={() => onChangeDraft('replyToEntryId', entry.id)} />)}
      <StepHelp>Only explicitly linked messages to the same person and platform are used for response-time calculations.</StepHelp>
    </View> : null}
    <PlainField label={entryType === 'message' ? 'Message content or call notes (or attach the original next)' : 'Your observations (optional)'} value={body} onChangeText={onChangeBody} placeholder="Keep your words factual. Separate what you observed from what someone told you." multiline />
    {['journal', 'pickup_dropoff', 'visit_denied', 'child_statement'].includes(entryType) ? <>
      <FieldLabel>Child’s mood (optional, as you observed it)</FieldLabel>
      <MoodPicker value={childMood} onPick={onChangeMood} />
    </> : null}
    {entryType === 'child_statement' ? <InfoCallout title="Exact words and context" tone="ink">Record the words you remember without adding interpretation. This record does not classify admissibility or verify what happened.</InfoCallout> : null}
    {entryType === 'medical' ? <InfoCallout title="Next appointment" tone="ink">The date is saved in this entry. Add it to Case Map separately if you want a key-date record; this form does not schedule care or send reminders.</InfoCallout> : null}
  </View>;
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
        Add a place name if it helps describe the event. This form does not collect GPS coordinates.
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

function StepAttach({ attachments, picking, onPick, onRemove }: {
  attachments: StagedAttachment[];
  picking: EvidencePickerSource | null;
  onPick: (source: EvidencePickerSource) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.stepBody}>
      <StepKicker>ATTACH EVIDENCE</StepKicker>
      <Display size={26} style={styles.stepTitle}>Anything to attach?</Display>
      <StepHelp>
        Select original photos, screenshots, receipts, or documents. Maximum 25 MiB per file.
        Selected files are saved with the entry on the final step.
      </StepHelp>
      <View style={styles.stack}>
        <PillButton tone="primary" icon="camera" full disabled={Boolean(picking)} onPress={() => onPick('photo')}>
          {picking === 'photo' ? 'Opening photo library' : 'Choose photo or screenshot'}
        </PillButton>
        <PillButton tone="soft" icon="doc" full disabled={Boolean(picking)} onPress={() => onPick('document')}>
          {picking === 'document' ? 'Opening files' : 'Choose receipt or document'}
        </PillButton>
        <PillButton tone="soft" icon="camera" full disabled={Boolean(picking)} onPress={() => onPick('camera')}>
          {picking === 'camera' ? 'Opening camera' : 'Take a photo'}
        </PillButton>
      </View>
      {attachments.map((attachment) => (
        <SoftCard key={attachment.attachmentId} p={16}>
          <Text style={styles.reviewBody}>{attachment.filename}</Text>
          <Text style={styles.help}>
            {attachment.fileSizeBytes == null ? 'Size checked at save' : `${(attachment.fileSizeBytes / 1024 / 1024).toFixed(2)} MiB`} · Selected, not saved yet
          </Text>
          <PillButton tone="ghost" icon="x" size="sm" disabled={Boolean(picking)} onPress={() => onRemove(attachment.attachmentId)}>Remove file</PillButton>
        </SoftCard>
      ))}
      <InfoCallout title="Original files" tone="ink">
        Original bytes are encrypted on this device and checked with SHA-256 when saved.
        Keep your source files until the app confirms a verified cloud backup.
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
  attachments,
  locked,
  details,
  childName,
  custodyPeriod,
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
  attachments: StagedAttachment[];
  locked: boolean;
  details: TypedCaptureDetails | null;
  childName: string;
  custodyPeriod: string;
}) {
  const option = getEntryTypeOption(entryType);
  const summaryRows: [string, string][] = [
    ['Date', isDateInput(eventDate) ? formatPrettyDate(eventDate) : eventDate || '—'],
    ['Time', eventTime || '—'],
    ['Type', option.label],
    ['Child', childName],
    ['Custody period', custodyPeriod ? captureChoiceLabel(custodyPeriod) : 'Not recorded'],
    ...(details ? typedCaptureSummary(details) : []),
    ['Mood', childMood ? childMood : '—'],
    ['Location', locationName || '—'],
    ['Attachments', attachments.length ? attachments.map((file) => file.filename).join(', ') : 'None'],
  ];
  return (
    <View style={styles.stepBody}>
      <StepKicker>ALMOST DONE</StepKicker>
      <Display size={26} style={styles.stepTitle}>
        Does this look right?
      </Display>
      <StepHelp>
        We&apos;ll save this as one entry with the selected original files.{' '}
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
        editable={!locked}
        placeholder={option.defaultTitle}
      />

      <FlagToggle value={isFlagged} onChange={setIsFlagged} disabled={locked} />

      <View style={styles.fieldGap} />
      <FieldLabel>PRIVATE NOTE (NOT FOR COURT)</FieldLabel>
      <TextInput
        value={privateNotes}
        accessibilityLabel="Private note (excluded from factual reports)"
        onChangeText={setPrivateNotes}
        editable={!locked}
        placeholder="Context you do not want mixed into a court-ready summary."
        placeholderTextColor={fbColors.inkMute}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.inputMultiline]}
      />

      <InfoCallout title="What happens when you save" tone="ink">
        Your entry and original files are saved in encrypted device storage before success is shown.
        Cloud backup status remains visible in the case. You can review the entry after saving.
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
  const { home, loading, hasHydrated } = useCaseIntelligenceHome();
  if (!home.activeCase) {
    return <CaseScreen>
      <InfoCallout title="Case record" tone="ink">{loading || !hasHydrated ? 'Opening your case…' : 'Set up your case before capturing an entry.'}</InfoCallout>
      {!loading && hasHydrated ? <PillButton tone="primary" onPress={() => router.replace('/onboarding' as never)}>Set up case</PillButton> : null}
    </CaseScreen>;
  }
  return <CaptureForm key={`${home.activeCase.user_id}:${home.activeCase.id}`} />;
}

function CaptureForm() {
  const params = useLocalSearchParams();
  const createEntry = useCaptureEntry();
  const createAttachment = useCreateLocalAttachment();
  const { home, snapshot } = useCaseIntelligenceHome();
  const children = snapshot.children.filter((child) => !child.deleted_at && child.case_id === home.activeCase?.id && child.user_id === home.activeCase?.user_id);
  const [childId, setChildId] = useState(children.length === 1 ? children[0].id : children.length > 1 ? "unselected" : "");
  const [custodyPeriod, setCustodyPeriod] = useState<"" | "my_time" | "their_time" | "transition" | "neutral">("");
  const [draft, setDraft] = useState<CaptureDraft>({ parentNotification: "unknown", consent: "unknown", tone: "not_assessed" });
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
  const [draftEntryId] = useState(() => Crypto.randomUUID());
  const [attachments, setAttachments] = useState<StagedAttachment[]>([]);
  const attachmentRefs = useRef<StagedAttachment[]>([]);
  attachmentRefs.current = attachments;
  const [picking, setPicking] = useState<EvidencePickerSource | null>(null);
  const savedEntryRef = useRef<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const completedAttachments = useRef(new Set<string>());
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    for (const attachment of attachmentRefs.current) void discardPickedEvidence(attachment).catch(() => { /* Global cleanup notice retains failures. */ });
  }; }, []);

  function pinCaptureContext() {
    const generation = getWorkspaceGeneration(); const caseId = home.activeCase?.id; const ownerId = home.activeCase?.user_id;
    return () => mounted.current && generation === getWorkspaceGeneration() && useAuthStore.getState().session?.user.id === ownerId
      && useCaseIntelligenceStore.getState().ownerId === ownerId && getActiveCase(useCaseIntelligenceStore.getState().snapshot)?.id === caseId;
  }

  useEffect(() => {
    setEntryType(requestedType);
  }, [requestedType]);

  const isLastStep = step === TOTAL_STEPS - 1;
  const canContinue = !saving && !picking;
  const canSkip = SKIPPABLE[step] && (step !== 2 || !TYPED_CAPTURE_FIELDS[entryType]);
  let details: TypedCaptureDetails | null = null;
  try { details = buildTypedCaptureDetails(entryType, draft, eventDate, eventTime); } catch { /* Show validation on Continue/save. */ }
  const replyOptions = snapshot.entries.filter((entry) => {
    if (entry.deleted_at || entry.case_id !== home.activeCase?.id || entry.user_id !== home.activeCase?.user_id || entry.entry_type !== 'message') return false;
    const metadata = entry.metadata && typeof entry.metadata === 'object' && !Array.isArray(entry.metadata) ? entry.metadata : {};
    const value = metadata.typed_capture;
    return value && typeof value === 'object' && !Array.isArray(value) && value.kind === 'message' && value.direction === 'sent'
      && value.platform === draft.platform && typeof value.correspondent === 'string' && value.correspondent.trim().toLowerCase() === draft.correspondent?.trim().toLowerCase();
  }).map((entry) => ({ id: entry.id, title: `${entry.event_date} · ${entry.title || entry.body || 'Sent message'}` }));

  function validateStep(final = false) {
    if ((step === 0 || final) && childId === 'unselected') throw new Error('Choose a child or select Whole case.');
    if (step === 1 || final) {
      if (!isDateInput(eventDate)) throw new Error('Enter a real date in YYYY-MM-DD format.');
      normalizeOptionalTime(eventTime.replace(/(?:Z|[+-]\d{2}:\d{2})$/, ""));
      if (eventTime.trim()) recordedInstant(`${eventDate.trim()}T${eventTime.trim()}`, "Event time");
    }
    if (step === 2 || final) buildTypedCaptureDetails(entryType, draft, eventDate, eventTime);
    if (final && !body.trim() && !attachments.length && !typedCaptureSummary(buildTypedCaptureDetails(entryType, draft, eventDate, eventTime)).length) throw new Error('Add an observation or original file before saving.');
    if (final && entryType === 'message' && !body.trim() && !attachments.length) throw new Error('Add the message content or attach its original before saving.');
    if (final && draft.replyToEntryId && entryType === 'message' && !replyOptions.some((entry) => entry.id === draft.replyToEntryId)) throw new Error('The linked sent message must belong to this case, person and platform. Review the reply link.');
  }

  function next() {
    try { if (!savedEntryRef.current) validateStep(isLastStep); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Review these details.'); return; }
    setError(null);
    if (isLastStep) { void onSave(); return; }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1) as StepIndex);
  }

  function back() {
    if (saving || picking) return;
    if (savedEntryRef.current) {
      router.replace(`/entry/${savedEntryRef.current}` as never);
      return;
    }
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => Math.max(s - 1, 0) as StepIndex);
  }

  async function pickAttachment(source: EvidencePickerSource) {
    if (picking || saving || savedEntryRef.current) return;
    setPicking(source);
    setError(null);
    const current = pinCaptureContext();
    try {
      const selected = await pickEvidenceFile(source);
      if (!current()) { if (selected) await discardPickedEvidence(selected); return; }
      if (selected) { const next = [...attachmentRefs.current, { ...selected, attachmentId: Crypto.randomUUID() }]; attachmentRefs.current = next; setAttachments(next); }
    } catch (error) { if (mounted.current) setError(error instanceof Error ? error.message : 'Unable to select this file.'); }
    finally { if (mounted.current) setPicking(null); }
  }

  async function removeAttachment(id: string) {
    if (picking || saving || savedEntryRef.current) return;
    const selected = attachments.find((attachment) => attachment.attachmentId === id);
    if (!selected) return;
    setPicking('document');
    setError(null);
    try {
      await discardPickedEvidence(selected);
      setAttachments((current) => current.filter((attachment) => attachment.attachmentId !== id));
    } catch (error) { setError(error instanceof Error ? error.message : 'The temporary source could not be discarded.'); }
    finally { setPicking(null); }
  }

  async function onSave() {
    if (saving || picking) return;
    try { if (!savedEntryRef.current) validateStep(true); } catch (failure) { setError(failure instanceof Error ? failure.message : "Review these details."); return; }
    setSaving(true);
    setError(null);
    const current = pinCaptureContext();
    try {
      if (!current()) throw new Error('The account or case changed. Reopen capture before saving.');
      if (!savedEntryRef.current) {
        const finalTitle = title.trim() || getEntryTypeOption(entryType).defaultTitle;
        const capturedDetails = buildTypedCaptureDetails(entryType, draft, eventDate, eventTime);
        const capturedBody = [body.trim(), ...typedCaptureSummary(capturedDetails).map(([label, value]) => `${label}: ${value}`)].filter(Boolean).join("\n");
        const result = await createEntry({
          id: draftEntryId,
          entryType,
          eventDate: eventDate.trim(),
          eventTime: eventTime.trim().replace(/(?:Z|[+-]\d{2}:\d{2})$/, "") || null,
          title: finalTitle,
          body: capturedBody,
          childId: childId || null,
          custodyPeriod: custodyPeriod || null,
          typedDetails: capturedDetails,
          locationName,
          childMood: childMood ?? null,
          isFlagged,
          privateNotes,
        });
        if (!current()) return;
        savedEntryRef.current = result.entry.id;
        setSavedEntryId(result.entry.id);
      }
      await savePendingCaptureAttachments({
        entryId: savedEntryRef.current,
        attachments,
        completedIds: completedAttachments.current,
        save: async (input) => { if (!current()) throw new Error('The account or case changed while saving attachments.'); const result = await createAttachment(input); if (!current()) throw new Error('The account or case changed while saving attachments.'); return result; },
      });
      if (!current()) return;
      router.replace('/timeline' as never);
    } catch (err) {
      if (!mounted.current) return;
      const message = err instanceof Error ? err.message : 'Unable to save this entry.';
      const pending = attachments.length - completedAttachments.current.size;
      setError(savedEntryRef.current
        ? `Your entry is saved. ${pending} attachment${pending === 1 ? '' : 's'} still need to be saved. Retry them here or open the saved entry. ${message}`
        : message);
    } finally {
      if (mounted.current) setSaving(false);
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
              disabled={saving || Boolean(picking)}
              onPress={() => { setError(null); setStep((s) => Math.min(s + 1, 5) as StepIndex); }}
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
            {isLastStep ? (saving ? 'Saving entry and originals' : savedEntryId ? 'Retry remaining attachments' : 'Save entry and originals') : 'Continue'}
          </PillButton>
          {error ? <Text accessibilityRole="alert" style={styles.footerError}>{error}</Text> : null}
          {savedEntryId && !saving && error ? (
            <PillButton tone="ghost" size="sm" onPress={() => router.replace(`/entry/${savedEntryId}` as never)}>Open saved entry</PillButton>
          ) : null}
        </View>
      }
    >
      <View style={styles.wizHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 0 ? 'Cancel capture' : 'Previous step'}
          disabled={saving || Boolean(picking)}
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
          disabled={saving || Boolean(picking)}
          onPress={() => savedEntryRef.current ? router.replace(`/entry/${savedEntryRef.current}` as never) : router.back()}
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
          <View style={styles.stack}>
            <FieldLabel>Child</FieldLabel>
            <BigChoice label="Whole case" selected={childId === ''} onPress={() => setChildId('')} />
            {children.map((child) => <BigChoice key={child.id} label={child.name} selected={childId === child.id} onPress={() => setChildId(child.id)} />)}
            <FieldLabel>Custody period (optional)</FieldLabel>
            <CaptureChoices label="Custody period" options={["", "my_time", "their_time", "transition", "neutral"]} value={custodyPeriod} onChange={(value) => setCustodyPeriod(value as typeof custodyPeriod)} />
            <StepType entryType={entryType} onChangeType={(value) => { setEntryType(value); setError(null); }} />
          </View>
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
          <StepDetails
            entryType={entryType}
            childMood={childMood}
            onChangeMood={setChildMood}
            body={body}
            onChangeBody={setBody}
            draft={draft}
            onChangeDraft={(key, value) => setDraft((current) => ({ ...current, [key]: value, ...(["platform", "correspondent", "direction"].includes(key) ? { replyToEntryId: "" } : {}) }))}
            replyOptions={replyOptions}
          />
        ) : null}
        {step === 3 ? (
          <StepWhere
            entryType={entryType}
            locationName={locationName}
            setLocationName={setLocationName}
          />
        ) : null}
        {step === 4 ? <StepAttach attachments={attachments} picking={picking} onPick={pickAttachment} onRemove={removeAttachment} /> : null}
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
            attachments={attachments}
            locked={saving || Boolean(savedEntryId)}
            details={details}
            childName={children.find((child) => child.id === childId)?.name || "Whole case"}
            custodyPeriod={custodyPeriod}
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
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: fbSpacing.x2 },
  choiceButton: { minHeight: fbTouch.min, justifyContent: "center" },
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
