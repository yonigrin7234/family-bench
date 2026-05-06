import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  MoodPicker,
  PillButton,
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

function EntryTypePicker({
  value,
  onChange,
}: {
  value: EntryTypeValue;
  onChange: (value: EntryTypeValue) => void;
}) {
  return (
    <View style={styles.typeGrid}>
      {ENTRY_TYPE_OPTIONS.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.typeOption,
              active && styles.typeOptionActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.typeHeader}>
              <Icon
                name={option.icon as IconName}
                size={15}
                color={active ? fbColors.oxDeep : fbColors.ink}
              />
              <Chip tone={option.tone as ChipTone} outline={false}>
                {option.shortLabel}
              </Chip>
            </View>
            <Text style={styles.typeTitle}>{option.label}</Text>
            <Text style={styles.typeBody}>{option.body}</Text>
          </Pressable>
        );
      })}
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
        <Text style={styles.flagTitle}>Flag for review</Text>
        <Text style={styles.flagBody}>Use this for entries that may need follow-up later.</Text>
      </View>
    </Pressable>
  );
}

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedOption = getEntryTypeOption(entryType);
  const hasText = Boolean(title.trim() || body.trim());
  const canSave = isDateInput(eventDate) && hasText && !saving;

  useEffect(() => {
    setEntryType(requestedType);
  }, [requestedType]);

  async function onSave() {
    if (!canSave) {
      setError('Add a date and at least a short title or note.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createEntry({
        entryType,
        eventDate: eventDate.trim(),
        eventTime: eventTime.trim() || null,
        title,
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
          <PillButton
            tone="primary"
            size="lg"
            full
            icon="check"
            disabled={!canSave}
            onPress={onSave}
          >
            {saving ? 'Saving' : 'Save entry'}
          </PillButton>
          {error ? <Text style={styles.footerError}>{error}</Text> : null}
        </View>
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <Display italic size={32} style={styles.title}>
          Capture entry
        </Display>
        <Text style={styles.subtitle}>
          Record facts while details are fresh. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="Case record" tone="ink">
        {home.activeCase?.title || 'Current case'} · Separate private notes from court-ready facts.
      </InfoCallout>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Entry type</Text>
          <Chip tone={selectedOption.tone as ChipTone} outline={false}>
            {selectedOption.shortLabel}
          </Chip>
        </View>
        <EntryTypePicker value={entryType} onChange={setEntryType} />
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <Text style={styles.sectionTitle}>Common fields</Text>
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
          placeholder={selectedOption.defaultTitle}
        />
        <Field
          label="What happened"
          value={body}
          onChangeText={setBody}
          placeholder="Keep this factual and specific."
          multiline
        />
        <Field
          label="Location"
          value={locationName}
          onChangeText={setLocationName}
          placeholder="Optional"
        />
        <Rule />
        <FormLabel>Child mood</FormLabel>
        <MoodPicker value={childMood} onPick={setChildMood} />
        <FlagToggle value={isFlagged} onChange={setIsFlagged} />
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <Text style={styles.sectionTitle}>Private note</Text>
        <Text style={styles.privateHelp}>
          Use this space for context you do not want mixed into a court-ready summary.
        </Text>
        <TextInput
          value={privateNotes}
          onChangeText={setPrivateNotes}
          placeholder="Optional private note"
          placeholderTextColor={fbColors.inkFaint}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.inputMultiline]}
        />
      </SoftCard>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
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
  sectionTitleRow: {
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
    letterSpacing: -0.18,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  typeOption: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 132,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  typeOptionActive: {
    borderWidth: fbBorder.focus,
    borderColor: fbColors.ox,
    backgroundColor: fbColors.oxWash,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x2,
  },
  typeTitle: {
    marginTop: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.14,
  },
  typeBody: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  twoCol: {
    flexDirection: 'row',
    gap: fbSpacing.x3,
  },
  twoColItem: {
    flex: 1,
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
    minHeight: 116,
    paddingTop: fbSpacing.x3,
    lineHeight: 21,
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
    fontFamily: fbFonts.sansRegular,
  },
  privateHelp: {
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
