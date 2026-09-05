import { localCalendarDate } from '@/lib/utils/dateInput';
import { useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { discardPickedEvidence } from '@/lib/evidence/picker';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  LocalAudioRecorder,
  type RecordedAudioMemo,
} from '@/components/case-intelligence/LocalAudioRecorder';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
  Segment,
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
} from '@/components/ui/fb';
import {
  useCaptureEntry,
  useCaseIntelligenceHome,
  useCreateLocalAttachment,
} from '@/lib/case-intelligence';

type FlagSeverity = 'low' | 'medium' | 'high';

function toDateInput(date = new Date()) {
  return localCalendarDate(date);
}

function toTimeInput(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

function isDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function FormLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function Field({
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
  return (
    <View style={styles.field}>
      <FormLabel>{label}</FormLabel>
      <TextInput
        value={value}
        editable={editable}
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
      accessibilityLabel="Flag this transcript entry for review"
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.flagToggle, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value ? <Icon name="check" size={14} color={fbColors.paper} /> : null}
      </View>
      <View style={styles.flagCopy}>
        <Text style={styles.flagTitle}>Flag for review</Text>
        <Text style={styles.flagBody}>Choose a severity only if this entry needs follow-up.</Text>
      </View>
    </Pressable>
  );
}

export default function VoiceCapture() {
  const { home, loading, hasHydrated } = useCaseIntelligenceHome();
  if (!home.activeCase) {
    return <CaseScreen>
      <InfoCallout title="Case record" tone="ink">{loading || !hasHydrated ? 'Opening your case…' : 'Set up your case before recording a voice entry.'}</InfoCallout>
      {!loading && hasHydrated ? <PillButton tone="primary" onPress={() => router.replace('/onboarding' as never)}>Set up case</PillButton> : null}
    </CaseScreen>;
  }
  return <VoiceCaptureForm key={`${home.activeCase.user_id}:${home.activeCase.id}`} />;
}

function VoiceCaptureForm() {
  const createEntry = useCaptureEntry();
  const createLocalAttachment = useCreateLocalAttachment();
  const { home } = useCaseIntelligenceHome();
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioMemo | null>(null);
  const [transcript, setTranscript] = useState('');
  const [reviewedBody, setReviewedBody] = useState('');
  const [reviewedTouched, setReviewedTouched] = useState(false);
  const [eventDate, setEventDate] = useState(toDateInput());
  const [eventTime, setEventTime] = useState(toTimeInput());
  const [title, setTitle] = useState('Voice transcript reviewed');
  const [isFlagged, setIsFlagged] = useState(false);
  const [flagSeverity, setFlagSeverity] = useState<FlagSeverity>('low');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftEntryId, setDraftEntryId] = useState(() => Crypto.randomUUID());
  const [attachmentId, setAttachmentId] = useState(() => Crypto.randomUUID());
  const savedEntryRef = useRef<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const audioSavedRef = useRef(false);
  const recordingSources = useRef(new Map<string, RecordedAudioMemo>());
  const [recorderEpoch, setRecorderEpoch] = useState(0);
  const [hasRecordedSource, setHasRecordedSource] = useState(false);
  const hasTranscript = Boolean(transcript.trim());
  const hasAudio = Boolean(recordedAudio);
  const hasReviewedBody = Boolean(reviewedBody.trim());
  const canAccept = (hasTranscript || hasAudio) && hasReviewedBody && isDateInput(eventDate) && !saving && !recordingActive;
  const locked = saving || Boolean(savedEntryId);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    for (const memo of recordingSources.current.values()) void discardPickedEvidence({ kind: 'voice_memo', filename: memo.filename, localUri: memo.uri }).catch(() => { /* Global cleanup notice retains failures. */ });
  }; }, []);

  function pinVoiceContext() {
    const generation = getWorkspaceGeneration(); const owner = home.activeCase?.user_id; const caseId = home.activeCase?.id;
    return () => mounted.current && generation === getWorkspaceGeneration() && useAuthStore.getState().session?.user.id === owner
      && useCaseIntelligenceStore.getState().ownerId === owner && getActiveCase(useCaseIntelligenceStore.getState().snapshot)?.id === caseId;
  }

  function onTranscriptChange(next: string) {
    setTranscript(next);
    if (!reviewedTouched) {
      setReviewedBody(next);
    }
  }

  function onReviewedBodyChange(next: string) {
    setReviewedTouched(true);
    setReviewedBody(next);
  }

  async function rejectDraft() {
    if (saving || savedEntryRef.current || recordingActive) return;
    setSaving(true);
    try {
      for (const memo of recordingSources.current.values()) {
        await discardPickedEvidence({ kind: 'voice_memo', filename: memo.filename, localUri: memo.uri });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The temporary recording could not be removed.');
      setSaving(false);
      return;
    }
    recordingSources.current.clear();
    setHasRecordedSource(false);
    setRecorderEpoch((value) => value + 1);
    setTranscript('');
    setReviewedBody('');
    setReviewedTouched(false);
    setTitle('Voice transcript reviewed');
    setRecordedAudio(null);
    setIsFlagged(false);
    setFlagSeverity('low');
    setError(null);
    setDraftEntryId(Crypto.randomUUID());
    setAttachmentId(Crypto.randomUUID());
    audioSavedRef.current = false;
    setSaving(false);
  }

  async function acceptDraft() {
    if (!canAccept) {
      setError('Add a recording or transcript, review the body, and use a valid date before accepting.');
      return;
    }

    setSaving(true);
    setError(null);
    const current = pinVoiceContext();

    try {
      if (!current()) throw new Error('The account or case changed. Reopen voice capture before saving.');
      if (!savedEntryRef.current) {
        const result = await createEntry({
          id: draftEntryId,
          entryType: 'journal',
          eventDate: eventDate.trim(),
          eventTime: eventTime.trim() || null,
          title: title.trim() || 'Voice transcript reviewed',
          body: reviewedBody,
          locationName: '',
          childMood: null,
          isFlagged,
          flagSeverity: isFlagged ? flagSeverity : null,
          privateNotes: '',
          sourceCapturedText: transcript,
          captureSource: 'voice',
        });
        if (!current()) return;
        savedEntryRef.current = result.entry.id;
        setSavedEntryId(result.entry.id);
      }
      if (recordedAudio && !audioSavedRef.current) {
        if (!current()) return;
        await createLocalAttachment({
          entryId: savedEntryRef.current,
          attachmentId,
          kind: 'voice_memo',
          filename: recordedAudio.filename,
          mimeType: recordedAudio.mimeType,
          fileSizeBytes: recordedAudio.fileSizeBytes,
          durationMs: recordedAudio.durationMs,
          localUri: recordedAudio.uri,
          localReference: recordedAudio.localReference,
          sourceLabel: 'Voice Capture local recording',
          capturedAt: recordedAudio.capturedAt,
        });
        if (!current()) return;
        audioSavedRef.current = true;
      }
      for (const memo of recordingSources.current.values()) {
        await discardPickedEvidence({ kind: 'voice_memo', filename: memo.filename, localUri: memo.uri });
      }
      recordingSources.current.clear();
      if (!current()) return;
      router.replace('/timeline' as never);
    } catch (err) {
      if (!mounted.current) return;
      const message = err instanceof Error ? err.message : 'Unable to save this transcript draft.';
      setError(savedEntryRef.current
        ? audioSavedRef.current || !recordedAudio
          ? `Your entry is saved. A temporary recording copy still needs cleanup. Retry to finish. ${message}`
          : `Your entry is saved, but the original voice memo is still pending. Retry to attach it to the same entry. ${message}`
        : message);
    } finally {
      if (mounted.current) setSaving(false);
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
            disabled={!canAccept}
            onPress={acceptDraft}
          >
            {saving ? 'Saving entry and audio' : savedEntryId ? audioSavedRef.current || !recordedAudio ? 'Retry temporary copy cleanup' : 'Retry voice memo attachment' : 'Save reviewed entry'}
          </PillButton>
          <PillButton
            tone="ghost"
            size="md"
            full
            icon="x"
            disabled={!(hasTranscript || hasAudio || hasRecordedSource) || locked || recordingActive}
            onPress={rejectDraft}
          >
            Reject draft
          </PillButton>
          {error ? <Text style={styles.footerError}>{error}</Text> : null}
          {savedEntryId && !saving && error ? (
            <PillButton tone="ghost" size="sm" full onPress={() => router.replace(`/entry/${savedEntryId}` as never)}>Open saved entry</PillButton>
          ) : null}
        </View>
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" disabled={saving || recordingActive || Boolean(savedEntryId)} onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="amber" outline={false}>
            Original audio
          </Chip>
          <Chip tone="mute" outline={false}>
            Manual transcript
          </Chip>
        </View>
        <Display size={32} style={styles.title}>
          Voice capture
        </Display>
        <Text style={styles.subtitle}>
          Record a local voice memo or prepare a manual transcript-based journal entry. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="Case record" tone="ink">
        {home.activeCase?.title || 'Current case'} · Saved originals are encrypted on this device,
        hashed, and queued for verified cloud backup. Maximum 25 MiB per recording. Transcripts are entered manually.
      </InfoCallout>

      <SoftCard p={16} style={styles.section}>
        <LocalAudioRecorder
          key={recorderEpoch}
          title="Voice memo source"
          body="Record the source audio for this draft. The audio can be attached when you accept the reviewed entry. Manual transcript remains separate."
          saveLabel="Use recording with draft"
          savedLabel="Voice memo will attach when this draft is accepted."
          disabled={locked}
          onRecordingChange={setRecordingActive}
          onRecorded={(memo) => { recordingSources.current.set(memo.uri, memo); setHasRecordedSource(true); }}
          onSave={(memo) => {
            setRecordedAudio(memo);
            setAttachmentId(Crypto.randomUUID());
            audioSavedRef.current = false;
          }}
        />
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Transcript review</Text>
          <Chip tone={hasTranscript ? 'forest' : 'mute'} outline={false}>
            Raw source
          </Chip>
        </View>
        <Field
          label="Raw transcript"
          value={transcript}
          onChangeText={onTranscriptChange}
          editable={!locked}
          placeholder="Paste or type what was said. This remains the raw source transcript."
          multiline
        />
        <Rule />
        <Text style={styles.sectionBody}>
          The reviewed body starts as the raw transcript. Edit it only for clarity while keeping the
          raw transcript separate.
        </Text>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Structured entry preview</Text>
          <Chip tone="mute" outline={false}>
            Journal
          </Chip>
        </View>
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>ENTRY TYPE</Text>
          <Text style={styles.previewValue}>Journal</Text>
        </View>
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Field label="Date" value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" editable={!locked} />
          </View>
          <View style={styles.twoColItem}>
            <Field label="Time" value={eventTime} onChangeText={setEventTime} placeholder="HH:MM" editable={!locked} />
          </View>
        </View>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          editable={!locked}
          placeholder="Voice transcript reviewed"
        />
        <Field
          label="Reviewed body"
          value={reviewedBody}
          onChangeText={onReviewedBodyChange}
          editable={!locked}
          placeholder="Reviewed body will appear here after a transcript is entered."
          multiline
        />
        <FlagToggle value={isFlagged} onChange={setIsFlagged} disabled={locked} />
        {isFlagged ? (
          <View style={styles.field}>
            <FormLabel>Flag severity</FormLabel>
            <Segment<FlagSeverity>
              items={[
                { v: 'low', label: 'Low' },
                { v: 'medium', label: 'Medium' },
                { v: 'high', label: 'High' },
              ]}
              value={flagSeverity}
              onChange={(severity) => { if (!locked) setFlagSeverity(severity); }}
            />
          </View>
        ) : null}
      </SoftCard>

      <InfoCallout title="Source separation" tone="ink">
        Original audio, manual transcript, and reviewed body remain separate. This screen does not generate automatic transcription or AI interpretation.
      </InfoCallout>
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
    marginTop: fbSpacing.x2,
  },
  title: {
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
  sectionTitleRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  sectionTitleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  sectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  sectionBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  field: {
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
  input: {
    minHeight: fbTouch.min,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    paddingHorizontal: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  inputMultiline: {
    minHeight: 128,
    paddingTop: fbSpacing.x3,
    lineHeight: 21,
  },
  previewBox: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    backgroundColor: fbColors.paperDeep,
  },
  previewLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  previewValue: {
    marginTop: fbSpacing.x1,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  twoCol: {
    flexDirection: 'row',
    gap: fbSpacing.x3,
  },
  twoColItem: {
    flex: 1,
  },
  flagToggle: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    padding: fbSpacing.x3,
    backgroundColor: fbColors.paper,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: fbRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: fbBorder.selected,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  checkboxActive: {
    backgroundColor: fbColors.ox,
    borderColor: fbColors.ox,
  },
  flagCopy: {
    flex: 1,
  },
  flagTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
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
  footer: {
    gap: fbSpacing.x2,
    paddingTop: fbSpacing.x2,
    backgroundColor: fbColors.paper,
  },
  footerError: {
    color: fbColors.ox,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
    textAlign: 'center',
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
