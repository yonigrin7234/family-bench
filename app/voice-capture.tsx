import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
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
import { useCaptureEntry, useCaseIntelligenceHome } from '@/lib/case-intelligence';

type FlagSeverity = 'low' | 'medium' | 'high';

const WAVEFORM_BARS = [20, 34, 18, 42, 28, 52, 24, 40, 32, 22, 46, 26];

function toDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <FormLabel>{label}</FormLabel>
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

function WaveformPlaceholder() {
  return (
    <View style={styles.waveform}>
      {WAVEFORM_BARS.map((height, index) => (
        <View key={`${height}-${index}`} style={[styles.waveformBar, { height }]} />
      ))}
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
  const createEntry = useCaptureEntry();
  const { home } = useCaseIntelligenceHome();
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
  const hasTranscript = Boolean(transcript.trim());
  const hasReviewedBody = Boolean(reviewedBody.trim());
  const canAccept = hasTranscript && hasReviewedBody && isDateInput(eventDate) && !saving;

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

  function rejectDraft() {
    setTranscript('');
    setReviewedBody('');
    setReviewedTouched(false);
    setTitle('Voice transcript reviewed');
    setIsFlagged(false);
    setFlagSeverity('low');
    setError(null);
  }

  async function acceptDraft() {
    if (!canAccept) {
      setError('Paste a transcript, review the body, and use a valid date before accepting.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createEntry({
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
        captureSource: 'voice_placeholder',
        forceLocalOnly: true,
      });
      router.replace('/timeline' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this transcript draft.');
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
            disabled={!canAccept}
            onPress={acceptDraft}
          >
            {saving ? 'Saving draft' : 'Accept draft'}
          </PillButton>
          <PillButton
            tone="ghost"
            size="md"
            full
            icon="x"
            disabled={!hasTranscript || saving}
            onPress={rejectDraft}
          >
            Reject draft
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
          <Chip tone="amber" outline={false}>
            Placeholder
          </Chip>
          <Chip tone="mute" outline={false}>
            Local only
          </Chip>
        </View>
        <Display italic size={32} style={styles.title}>
          Voice capture
        </Display>
        <Text style={styles.subtitle}>
          Prepare a transcript-based journal entry. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="Case record" tone="ink">
        {home.activeCase?.title || 'Current case'} · No audio is recorded, uploaded, or analyzed in
        this placeholder.
      </InfoCallout>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleLeft}>
            <Icon name="mic" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>Voice memo placeholder</Text>
          </View>
          <Text style={styles.timer}>00:00</Text>
        </View>
        <WaveformPlaceholder />
        <Text style={styles.sectionBody}>
          Record voice memo coming later. This screen only prepares the review workflow.
        </Text>
        <View style={styles.actionStack}>
          <PillButton tone="ghost" size="md" icon="mic" disabled full>
            Record voice memo coming later
          </PillButton>
          <PillButton tone="ghost" size="md" icon="clock" disabled full>
            Pause coming later
          </PillButton>
          <PillButton tone="ghost" size="md" icon="clock" disabled full>
            Resume coming later
          </PillButton>
        </View>
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
            <Field label="Date" value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" />
          </View>
          <View style={styles.twoColItem}>
            <Field label="Time" value={eventTime} onChangeText={setEventTime} placeholder="HH:MM" />
          </View>
        </View>
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Voice transcript reviewed"
        />
        <Field
          label="Reviewed body"
          value={reviewedBody}
          onChangeText={onReviewedBodyChange}
          placeholder="Reviewed body will appear here after a transcript is entered."
          multiline
        />
        <FlagToggle value={isFlagged} onChange={setIsFlagged} />
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
              onChange={setFlagSeverity}
            />
          </View>
        ) : null}
      </SoftCard>

      <InfoCallout title="Source separation" tone="ink">
        Raw transcript, reviewed body, and future AI-structured interpretation stay separate. AI
        interpretation is not generated in this PR.
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
  timer: {
    minWidth: 64,
    textAlign: 'right',
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  waveform: {
    minHeight: 78,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
    paddingHorizontal: fbSpacing.x3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  waveformBar: {
    flex: 1,
    maxWidth: 12,
    borderRadius: fbRadii.pill,
    backgroundColor: fbColors.inkFaint,
  },
  actionStack: {
    gap: fbSpacing.x2,
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
