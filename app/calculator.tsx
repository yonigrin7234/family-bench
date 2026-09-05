import { useId, useMemo, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Display, InfoCallout, PillButton, Segment, SoftCard, fbColors, fbFonts, fbSpacing } from '@/components/ui/fb';
import { getActiveCase, useCaptureEntry } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { calculateCustodyTime, readCustodyInterval, validateCustodyInterval, type CustodyBasis, type CustodyCaregiver, type CustodyTimeResult } from '@/lib/calculations/custody';
import { recordedInstant } from '@/lib/reporting/capture';
import { isCalendarDate, localCalendarDate } from '@/lib/utils/dateInput';

const caregivers: Array<{ v: CustodyCaregiver; label: string }> = [
  { v: 'me', label: 'Me' }, { v: 'other_parent', label: 'Other parent' }, { v: 'neutral', label: 'Third party' },
];
const number = (value: number) => Number(value.toFixed(2)).toLocaleString();

function DateField({ label, value, onChange, disabled = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder: string }) {
  const id = useId();
  return <View style={styles.field}>
    <Text nativeID={id} style={styles.label}>{label}</Text>
    <TextInput accessibilityLabel={label} aria-labelledby={id} value={value} onChangeText={onChange}
      editable={!disabled} placeholder={placeholder} placeholderTextColor={fbColors.inkMute} autoCapitalize="none" style={styles.input} />
  </View>;
}

function TimeSummary({ result, title }: { result: CustodyTimeResult; title: string }) {
  return <SoftCard p={20} style={styles.summary}>
    <Text accessibilityRole="header" style={styles.title}>{title}</Text>
    <Text style={styles.percentage}>{result.yourRecordedShare === null ? '—' : `${number(result.yourRecordedShare)}%`}</Text>
    <Text style={styles.body}>Your share of {number(result.coveredHours)} recorded hours with an unambiguous caregiver.</Text>
    {caregivers.map(({ v, label }) => <View key={v} style={styles.row}><Text style={styles.body}>{label}</Text><Text style={styles.value}>{number(result.hours[v])} h</Text></View>)}
    <View style={styles.row}><Text style={styles.body}>No interval recorded</Text><Text style={styles.value}>{number(result.unknownHours)} h</Text></View>
    <View style={styles.row}><Text style={styles.body}>Conflicting caregivers</Text><Text style={styles.value}>{number(result.conflictingHours)} h</Text></View>
    <Text style={styles.body}>Selected period: {number(result.totalHours)} hours. Gaps and conflicts are excluded from the percentage.</Text>
    {result.invalidIntervalCount > 0 && <Text style={styles.error}>{result.invalidIntervalCount} interval records are invalid and excluded. Review the source records.</Text>}
  </SoftCard>;
}

export default function Calculator() {
  const state = useCaseIntelligenceStore();
  const activeCase = getActiveCase(state.snapshot);
  const createEntry = useCaptureEntry();
  const today = localCalendarDate();
  const [fromDate, setFromDate] = useState(`${today.slice(0, 8)}01`);
  const [toDate, setToDate] = useState(today);
  const [childId, setChildId] = useState('case-wide');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [caregiver, setCaregiver] = useState<CustodyCaregiver>('me');
  const [basis, setBasis] = useState<CustodyBasis>('actual');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const retryId = useRef<string | null>(null);
  const pendingOriginal = retryId.current ? state.snapshot.entries.find((entry) => entry.id === retryId.current) : null;
  const lockDraft = saving || Boolean(pendingOriginal);
  const children = state.snapshot.children.filter((child) => !child.deleted_at && child.case_id === activeCase?.id && child.user_id === state.ownerId);
  const scopeChoices = [{ v: 'case-wide', label: 'Case-wide records' }, ...children.map((child) => ({ v: child.id, label: child.name }))];
  const result = useMemo(() => {
    if (!activeCase || !state.ownerId) return null;
    try {
      if (!isCalendarDate(fromDate) || !isCalendarDate(toDate) || fromDate > toDate) throw new Error('Choose valid start and end dates in YYYY-MM-DD format.');
      const nextDay = new Date(`${toDate}T12:00:00`); nextDay.setDate(nextDay.getDate() + 1);
      const filter = { ownerId: state.ownerId, caseId: activeCase.id, childId: childId === 'case-wide' ? null : childId,
        fromAt: recordedInstant(`${fromDate}T00:00`, 'Period start'), toAt: recordedInstant(`${localCalendarDate(nextDay)}T00:00`, 'Period end') };
      return { actual: calculateCustodyTime(state.snapshot.entries, { ...filter, basis: 'actual' }), scheduled: calculateCustodyTime(state.snapshot.entries, { ...filter, basis: 'scheduled' }), error: null };
    } catch (failure) { return { actual: null, scheduled: null, error: failure instanceof Error ? failure.message : 'Unable to calculate this period.' }; }
  }, [state.snapshot.entries, state.ownerId, activeCase?.id, fromDate, toDate, childId]);

  async function saveInterval() {
    if (saving || !activeCase) return;
    setError(null); setSavedEntryId(null);
    try {
      const interval = validateCustodyInterval({ version: 1, startAt: recordedInstant(startAt, 'Start'), endAt: recordedInstant(endAt, 'End'), caregiver, basis });
      if (basis === 'actual' && Date.parse(interval.endAt) > Date.now()) throw new Error('Actual time must have finished. Choose Scheduled for a future interval.');
      if (!scopeChoices.some((choice) => choice.v === childId)) throw new Error('Choose an available child or case-wide records.');
      setSaving(true);
      retryId.current ??= Crypto.randomUUID();
      const beginning = new Date(interval.startAt);
      const scopeName = scopeChoices.find((choice) => choice.v === childId)!.label;
      const saved = await createEntry({
        id: retryId.current, entryType: 'other', childId: childId === 'case-wide' ? null : childId,
        title: `${basis === 'actual' ? 'Actual' : 'Scheduled'} custody time — ${caregivers.find((item) => item.v === caregiver)!.label}`,
        body: `${scopeName}. ${basis === 'actual' ? 'Recorded actual interval' : 'User-recorded scheduled interval'}: ${interval.startAt} to ${interval.endAt}. Caregiver: ${caregivers.find((item) => item.v === caregiver)!.label}.${note.trim() ? `\n\n${note.trim()}` : ''}`,
        eventDate: localCalendarDate(beginning), eventTime: beginning.toTimeString().slice(0, 8), custodyInterval: interval,
        custodyPeriod: caregiver === 'me' ? 'my_time' : caregiver === 'other_parent' ? 'their_time' : 'neutral', captureSource: 'manual', isFlagged: false,
      });
      setSavedEntryId(saved.entry.id); retryId.current = null; setStartAt(''); setEndAt(''); setNote('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save the interval. Your inputs remain here.'); }
    finally { setSaving(false); }
  }

  return <CaseScreen desktopMaxWidth={980} rightRail={false}>
    <View style={styles.page}>
      <Display size={34} accessibilityRole="header">Custody time</Display>
      <Text style={styles.intro}>Compare recorded actual and scheduled hours for {activeCase?.title || 'your case'}.</Text>
      {!activeCase ? <PillButton onPress={() => router.push('/onboarding')}>Set up a case</PillButton> : <>
        <SoftCard p={20} style={styles.section}>
          <Text style={styles.label}>Choose one record scope</Text>
          <View style={styles.choices}>{scopeChoices.map((choice) => <Pressable key={choice.v} accessibilityRole="button" accessibilityState={{ selected: childId === choice.v, disabled: lockDraft }} disabled={lockDraft} onPress={() => setChildId(choice.v)} style={[styles.choice, childId === choice.v && styles.choiceSelected]}>
            <Text style={styles.body}>{choice.label}</Text>
          </Pressable>)}</View>
          <Text style={styles.body}>Child-specific and case-wide intervals are calculated separately so time is never counted once per child and then added together.</Text>
          <View style={styles.columns}>
            <View style={styles.dateColumn}><DateField label="From date" value={fromDate} onChange={setFromDate} placeholder="YYYY-MM-DD" /></View>
            <View style={styles.dateColumn}><DateField label="Through date" value={toDate} onChange={setToDate} placeholder="YYYY-MM-DD" /></View>
          </View>
          <Text style={styles.body}>Date boundaries use this device’s time zone. Recorded intervals retain their exact instants and offsets.</Text>
        </SoftCard>
        {result?.error && <Text accessibilityRole="alert" style={styles.error}>{result.error}</Text>}
        {result?.actual && result.scheduled && <View style={styles.columns}>
          <TimeSummary result={result.actual} title="Actual time recorded" />
          <TimeSummary result={result.scheduled} title="Schedule recorded" />
        </View>}
        <InfoCallout title="How these hours are counted" tone="ink">Only explicit intervals in the chosen scope are counted. Overlapping records for the same caregiver count once. Overlaps naming different caregivers remain conflicting. No time is inferred from entry counts, exchange counts, or a missing record. A schedule you enter is not a determination of a court-ordered schedule.</InfoCallout>
        <SoftCard p={20} style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>Record a time interval</Text>
          <Text style={styles.body}>Saving creates a source entry in this case for the selected child or case-wide scope.</Text>
          <Segment<CustodyBasis> value={basis} disabled={lockDraft} items={[{ v: 'actual', label: 'Actual' }, { v: 'scheduled', label: 'Scheduled' }]} onChange={setBasis} />
          <Segment<CustodyCaregiver> value={caregiver} disabled={lockDraft} items={caregivers} onChange={setCaregiver} />
          <DateField label="Start date and time" value={startAt} onChange={setStartAt} disabled={lockDraft} placeholder="YYYY-MM-DD HH:MM" />
          <DateField label="End date and time" value={endAt} onChange={setEndAt} disabled={lockDraft} placeholder="YYYY-MM-DD HH:MM" />
          <Text style={styles.body}>Times use this device’s zone unless you include an offset, such as 2026-11-01T01:30-07:00. Include the end date for overnight periods.</Text>
          <DateField label="Source or notes (optional)" value={note} onChange={setNote} disabled={lockDraft} placeholder="Where this schedule or recorded time came from" />
          <Text style={styles.body}>These notes are part of the entry and can appear in a factual export. Use the entry’s private-notes field for information you do not intend to share.</Text>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          {pendingOriginal && !saving && <Text style={styles.body}>This interval is waiting for its save to finish. Retry the same interval before changing its details.</Text>}
          <PillButton onPress={saveInterval} disabled={saving || state.loading || state.saving > 0 || state.storageBlocked} full>{saving ? 'Saving interval…' : 'Save time interval'}</PillButton>
          {savedEntryId && <PillButton tone="soft" onPress={() => router.push(`/entry/${savedEntryId}` as never)}>Review saved interval</PillButton>}
        </SoftCard>
        {result?.actual && result.scheduled && <SoftCard p={20} style={styles.section}>
          <Text accessibilityRole="header" style={styles.title}>Source intervals in this period</Text>
          {[...result.actual.sourceEntries, ...result.scheduled.sourceEntries].map((entry) => {
            const interval = readCustodyInterval(entry)!;
            return <Pressable key={entry.id} accessibilityRole="link" onPress={() => router.push(`/entry/${entry.id}` as never)} style={styles.source}>
              <Text style={styles.label}>{entry.title}</Text>
              <Text style={styles.body}>{new Date(interval.startAt).toLocaleString()} → {new Date(interval.endAt).toLocaleString()}</Text>
            </Pressable>;
          })}
          {!result.actual.sourceEntries.length && !result.scheduled.sourceEntries.length && <Text style={styles.body}>No explicit time intervals are recorded in this scope and period.</Text>}
        </SoftCard>}
      </>}
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  page: { gap: fbSpacing.x5 }, intro: { color: fbColors.inkSoft, fontSize: 16, lineHeight: 24, fontFamily: fbFonts.sansRegular },
  section: { gap: 14 }, title: { color: fbColors.ink, fontFamily: fbFonts.sansSemi, fontSize: 20, lineHeight: 26 },
  label: { color: fbColors.ink, fontFamily: fbFonts.sansMedium, fontSize: 14, lineHeight: 20 },
  body: { color: fbColors.inkSoft, fontFamily: fbFonts.sansRegular, fontSize: 14, lineHeight: 21 },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, field: { gap: 8 }, dateColumn: { flexGrow: 1, flexBasis: 220 },
  input: { color: fbColors.ink, backgroundColor: fbColors.surface, fontFamily: fbFonts.sansRegular, fontSize: 16, borderWidth: 1, borderColor: fbColors.rule, borderRadius: 8, paddingHorizontal: 12, minHeight: 48 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, borderRadius: 8, borderWidth: 1, borderColor: fbColors.rule },
  choiceSelected: { backgroundColor: fbColors.paperDeep, borderColor: fbColors.ink },
  summary: { flexGrow: 1, flexBasis: 260, gap: 12 }, percentage: { color: fbColors.ink, fontSize: 44, lineHeight: 50, fontFamily: fbFonts.sansSemi },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, value: { color: fbColors.ink, fontFamily: fbFonts.monoMedium, fontSize: 14 },
  error: { color: fbColors.oxDeep, fontFamily: fbFonts.sansRegular, fontSize: 14, lineHeight: 21 },
  source: { paddingVertical: 12, gap: 6, borderBottomColor: fbColors.rule, borderBottomWidth: 1, minHeight: 48 },
});
