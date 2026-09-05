import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip, Display, Icon, InfoCallout, PillButton, Rule, SoftCard,
  fbAlpha, fbBorder, fbColors, fbFonts, fbRadii, fbSpacing, fbTouch, fbType,
} from '@/components/ui/fb';
import { formatDateLabel, getEntryTypeOption, useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import { resolveFilingPackageSelection } from '@/lib/filings/model';
import { parseRequestedEntrySelection } from '@/lib/export/request';
import { getEvidenceAttachmentBytes } from '@/lib/evidence';
import { createSharedTimeline, inDateRange, isPrivateEntry, validateDateRange, type TimelineSelection } from '@/lib/export/model';

function param(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default function ExportPrepRoute() {
  const params = useLocalSearchParams();
  const entryId = param(params.entryId);
  const reportIds = param(params.entryIds);
  const packageId = param(params.packageId);
  const hasPackageRequest = packageId !== undefined;
  const requestedSelection = useMemo(() => parseRequestedEntrySelection(entryId, reportIds), [entryId, reportIds]);
  const { snapshot, home } = useCaseIntelligenceHome();
  const filingBuilderState = useCaseIntelligenceStore((state) => state.filingBuilderState);
  const contextError = useCaseIntelligenceStore((state) => state.contextError);
  const ownerId = useAuthStore((state) => state.session?.user.id);
  const [fromDate, setFromDate] = useState(param(params.fromDate) || '');
  const [toDate, setToDate] = useState(param(params.toDate) || '');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<'pdf' | 'zip' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef<string | null>(null);
  const operation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const caseId = home.activeCase?.id;
  const packageSelection = useMemo(() => hasPackageRequest ? resolveFilingPackageSelection({ snapshot, ownerId: ownerId || '', caseId: caseId || '', packageId: packageId || '', packageState: filingBuilderState.packageStates[packageId || ''] }) : null, [snapshot, ownerId, caseId, packageId, hasPackageRequest, filingBuilderState]);
  const packageError = packageSelection ? (contextError ? 'Review the preserved working-context issue in Settings before exporting this package.' : packageSelection.issues[0] || null) : null;
  const requestError = requestedSelection.error || packageError;
  const entries = useMemo(() => snapshot.entries
    .filter((entry) => !entry.deleted_at && entry.case_id === caseId && entry.user_id === ownerId && (!packageSelection || packageSelection.entryIds.includes(entry.id)))
    .sort((a, b) => `${a.event_date}${a.event_time || ''}`.localeCompare(`${b.event_date}${b.event_time || ''}`)),
  [caseId, ownerId, snapshot.entries, packageSelection]);

  useEffect(() => {
    const key = `${ownerId}:${caseId}:${entryId || ''}:${reportIds || ''}:${packageId ?? ''}`;
    if (!caseId || !entries.length || initialized.current === key) return;
    initialized.current = key;
    const wanted = requestedSelection.ids;
    setSelectedIds(entries.filter((entry) => !isPrivateEntry(entry) && (!wanted || wanted.includes(entry.id))).map((entry) => entry.id));
    setNotice(null);
    setError(requestError);
  }, [caseId, entries, entryId, ownerId, reportIds, requestedSelection, packageId, requestError]);

  const rangeError = useMemo(() => {
    try { validateDateRange(fromDate, toDate); return null; }
    catch (failure) { return failure instanceof Error ? failure.message : 'Check the selected dates.'; }
  }, [fromDate, toDate]);
  const eligibleEntries = entries.filter((entry) => !isPrivateEntry(entry) && inDateRange(entry, fromDate, toDate));
  const includedEntryIds = eligibleEntries.filter((entry) => selectedIds.includes(entry.id)).map((entry) => entry.id);
  const input: TimelineSelection = {
    caseId: caseId || '', caseTitle: home.activeCase?.title || 'Case timeline', entries,
    attachments: snapshot.evidenceAttachments, includedEntryIds, fromDate, toDate,
  };
  const preview = useMemo(() => {
    if (!includedEntryIds.length || rangeError || requestError) return null;
    try { return createSharedTimeline(input); } catch { return null; }
  }, [caseId, entries, snapshot.evidenceAttachments, selectedIds, fromDate, toDate, rangeError, requestError]);
  const attachmentCount = preview?.entries.reduce((total, entry) => total + entry.attachments.length, 0) || 0;
  const privateCount = entries.filter(isPrivateEntry).length;

  function toggle(id: string) {
    setNotice(null);
    setError(null);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function exportFile(format: 'pdf' | 'zip') {
    if (operation.current) return;
    setNotice(null);
    setError(null);
    if (!ownerId) { setError('Sign in before creating an export.'); return; }
    if (requestError) { setError(requestError); return; }
    const start = useCaseIntelligenceStore.getState();
    const generation = getWorkspaceGeneration();
    const sessionGeneration = useAuthStore.getState().sessionGeneration;
    const assertCurrent = () => {
      if (!mounted.current || getWorkspaceGeneration() !== generation || useAuthStore.getState().sessionGeneration !== sessionGeneration || useAuthStore.getState().recovery || useAuthStore.getState().session?.user.id !== ownerId
        || getActiveCase(useCaseIntelligenceStore.getState().snapshot)?.id !== caseId
        || useCaseIntelligenceStore.getState().ownerId !== ownerId || useCaseIntelligenceStore.getState().snapshot !== start.snapshot || (hasPackageRequest && useCaseIntelligenceStore.getState().filingBuilderState !== start.filingBuilderState)) {
        throw new Error('The account, case, or records changed during export. Review the current selection and try again.');
      }
    };
    operation.current = true;
    setBusy(format);
    try {
      const selection = { ...input, generatedAt: new Date().toISOString() };
      const { createTimelinePdf, createEvidencePacket } = await import('@/lib/export/timeline');
      const { downloadArtifact, loadTimelineFonts, sha256Bytes } = await import('@/lib/export/download');
      const fonts = await loadTimelineFonts();
      assertCurrent();
      const artifact = format === 'pdf'
        ? await createTimelinePdf(createSharedTimeline(selection), fonts)
        : await createEvidencePacket(selection, {
          fonts, sha256: sha256Bytes,
          getAttachmentBytes: async (attachment) => { assertCurrent(); const bytes = await getEvidenceAttachmentBytes(attachment, ownerId); assertCurrent(); return bytes; },
        });
      assertCurrent();
      await downloadArtifact(artifact, assertCurrent);
      setNotice(Platform.OS === 'web' ? `${artifact.name} is ready in your downloads.` : 'The export was created. Use your device’s share sheet to save or share it.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The export could not be created. Please try again.');
    } finally { operation.current = false; if (mounted.current) setBusy(null); }
  }

  return (
    <CaseScreen desktopMaxWidth={1060}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>Back</PillButton>
        <View style={styles.row}>
          <Chip tone="forest" outline={false}>Factual timeline</Chip>
          <Chip tone="mute" outline={false}>{includedEntryIds.length} selected</Chip>
        </View>
        <Display size={32}>Prepare an export</Display>
        <Text style={styles.body}>Choose the events to include, review their factual text, then download a PDF or a packet containing the original evidence files.</Text>
      </View>

      <InfoCallout title="What will be shared" tone="ink">
        The report includes selected entry titles, dates, factual text, and source references. Private notes, private entries, raw app metadata, and account details are excluded. Original evidence files can contain their own metadata or sensitive content; review them before sharing a ZIP packet.
      </InfoCallout>
      {hasPackageRequest ? <InfoCallout title="Selected filing package" tone="ink">This review is limited to the package’s linked entries and the parent entries of explicitly linked originals. You may narrow the selection below. Its ZIP includes every live original attached to the remaining selected entries, including sibling files not individually linked. Report-type links do not add entries.</InfoCallout> : null}
      {requestError && <Text accessibilityRole="alert" style={styles.error}>{requestError}</Text>}

      <SoftCard p={16} style={styles.card}>
        <Text style={styles.sectionTitle}>Event date range</Text>
        <Text style={styles.body}>Leave either date blank to keep that end of the range open. Dates include the whole day.</Text>
        <View style={styles.row}>
          <View style={styles.dateField}>
            <Text style={styles.label}>FROM</Text>
            <TextInput accessibilityLabel="Export start date" placeholder="YYYY-MM-DD" value={fromDate} onChangeText={setFromDate} editable={!busy} autoCapitalize="none" style={styles.input} placeholderTextColor={fbColors.inkMute} />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>THROUGH</Text>
            <TextInput accessibilityLabel="Export end date" placeholder="YYYY-MM-DD" value={toDate} onChangeText={setToDate} editable={!busy} autoCapitalize="none" style={styles.input} placeholderTextColor={fbColors.inkMute} />
          </View>
        </View>
        {rangeError ? <Text accessibilityRole="alert" style={styles.error}>{rangeError}</Text> : null}
      </SoftCard>

      <SoftCard p={16} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Included entries</Text>
          <PillButton size="sm" tone="ghost" disabled={!!busy || !!rangeError} onPress={() => setSelectedIds(eligibleEntries.map((entry) => entry.id))}>Select all in range</PillButton>
          <PillButton size="sm" tone="ghost" disabled={!!busy} onPress={() => setSelectedIds([])}>Clear</PillButton>
        </View>
        {privateCount ? <Text style={styles.body}>{privateCount} private {privateCount === 1 ? 'entry is' : 'entries are'} excluded. Review visibility in the entry’s detail screen before sharing. Original CSV import sources stay private because they can contain private fields.</Text> : null}
        {eligibleEntries.length ? eligibleEntries.map((entry) => {
          const selected = selectedIds.includes(entry.id);
          return (
            <Pressable key={entry.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: !!busy }} accessibilityLabel={`Include ${entry.title || 'Untitled entry'}`} disabled={!!busy} onPress={() => toggle(entry.id)} style={({ pressed }) => [styles.entryRow, selected && styles.selectedRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, selected && styles.checked]}>{selected ? <Icon name="check" size={12} color={fbColors.paper} /> : null}</View>
              <View style={styles.entryCopy}>
                <Text style={styles.entryTitle}>{entry.title || getEntryTypeOption(entry.entry_type).defaultTitle}</Text>
                <Text style={styles.body}>{formatDateLabel(entry.event_date, entry.event_time)} · {getEntryTypeOption(entry.entry_type).shortLabel}</Text>
              </View>
            </Pressable>
          );
        }) : <Text style={styles.body}>No shareable entries match this date range.</Text>}
      </SoftCard>

      <SoftCard p={16} style={styles.card}>
        <Text style={styles.sectionTitle}>Review the report</Text>
        <Text style={styles.body}>{includedEntryIds.length} entries · {attachmentCount} evidence references. This report records what you entered; it does not independently verify events or provide legal conclusions.</Text>
        {preview?.entries.map((entry) => (
          <View key={entry.reference} style={styles.previewEntry}>
            <Text style={styles.label}>{entry.reference} · {entry.date}{entry.time ? ` ${entry.time}` : ''}</Text>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text selectable style={styles.factualText}>{entry.text}</Text>
            {entry.attachments.map((attachment) => <Text key={attachment.reference} style={styles.body}>{attachment.reference} · {attachment.name}</Text>)}
          </View>
        ))}
        {!includedEntryIds.length ? <Text style={styles.body}>Select at least one entry to create an export.</Text> : null}
        <Rule />
        <View style={styles.row}>
          <PillButton tone="primary" size="md" icon="doc" disabled={!!busy || !!rangeError || !!requestError || !preview} onPress={() => void exportFile('pdf')}>{busy === 'pdf' ? 'Creating PDF…' : 'Download timeline PDF'}</PillButton>
          <PillButton tone="soft" size="md" icon="doc" disabled={!!busy || !!rangeError || !!requestError || !preview} onPress={() => void exportFile('zip')}>{busy === 'zip' ? 'Verifying evidence…' : 'Download evidence ZIP'}</PillButton>
        </View>
        <Text style={styles.body}>The PDF lists evidence references. The ZIP also includes original files, the timeline, and a SHA-256 file manifest. If any selected evidence is unavailable or fails verification, the packet stops and no incomplete ZIP is downloaded.</Text>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      </SoftCard>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: fbSpacing.x3 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x3 },
  card: { marginTop: fbSpacing.x4, gap: fbSpacing.x3 },
  sectionTitle: { color: fbColors.ink, fontSize: fbType.body, fontFamily: fbFonts.sansSemi },
  body: { color: fbColors.inkMute, fontSize: fbType.small, lineHeight: 20, fontFamily: fbFonts.sansRegular },
  label: { color: fbColors.ox, fontSize: fbType.micro, lineHeight: 18, fontFamily: fbFonts.sansSemi, letterSpacing: 0.6 },
  dateField: { flex: 1, minWidth: 170, gap: fbSpacing.x2 },
  input: { minHeight: fbTouch.min, borderWidth: fbBorder.hairline, borderColor: fbColors.rule, borderRadius: fbRadii.sm, padding: fbSpacing.x3, color: fbColors.ink, fontFamily: fbFonts.sansRegular, fontSize: fbType.body },
  entryRow: { minHeight: fbTouch.min, flexDirection: 'row', alignItems: 'center', gap: fbSpacing.x3, padding: fbSpacing.x3, borderRadius: fbRadii.md, borderWidth: fbBorder.hairline, borderColor: fbColors.ruleSoft },
  selectedRow: { backgroundColor: fbColors.paperDeep, borderColor: fbColors.inkFaint },
  checkbox: { width: 22, height: 22, borderRadius: fbRadii.sm, borderWidth: 1, borderColor: fbColors.inkFaint, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: fbColors.ink, borderColor: fbColors.ink },
  entryCopy: { flex: 1, gap: 2 },
  entryTitle: { color: fbColors.ink, fontSize: fbType.body, lineHeight: 21, fontFamily: fbFonts.sansSemi },
  previewEntry: { paddingVertical: fbSpacing.x3, gap: fbSpacing.x2, borderBottomWidth: fbBorder.hairline, borderBottomColor: fbColors.ruleSoft },
  factualText: { color: fbColors.ink, fontSize: fbType.body, lineHeight: 22, fontFamily: fbFonts.sansRegular },
  error: { color: fbColors.ox, fontSize: fbType.body, lineHeight: 21, fontFamily: fbFonts.sansMedium },
  notice: { color: fbColors.forest, fontSize: fbType.body, lineHeight: 21, fontFamily: fbFonts.sansMedium },
  pressed: { opacity: fbAlpha.pressedSubtle },
});
