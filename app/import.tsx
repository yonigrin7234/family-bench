import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { Chip, Display, PillButton, SoftCard, fbColors, fbFonts, fbSpacing, fbTouch, fbType } from '@/components/ui/fb';
import { getActiveCase, useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getWorkspaceGeneration, getWorkspaceOwnerId } from '@/lib/auth/session';
import { getEvidenceAttachmentBytes } from '@/lib/evidence';
import { discardPickedEvidence, type PickedEvidence } from '@/lib/evidence/picker';
import { CSV_HEADERS, CSV_TEMPLATE, CsvValidationError, parseCsvImport } from '@/lib/imports/csv';
import { buildCsvImportPlan, findImportedDuplicate, type CsvImportPlan } from '@/lib/imports/plan';
import { frozenCsvSource, hashCsvBytes, pickCsvBytes } from '@/lib/imports/files';
import { CSV_FIELD_GUIDE } from '@/lib/imports/guide';
import { CsvImportStopped, runCsvImport, type CsvImportProgress } from '@/lib/imports/run';

type Preview = { plan: CsvImportPlan; picked: PickedEvidence; bytes: Uint8Array; generation: number };
const PAGE_SIZE = 20;
export default function ImportCsv() {
  const { home, snapshot } = useCaseIntelligenceHome();
  const ownerId = useCaseIntelligenceStore((state) => state.ownerId);
  const workspaceReady = useCaseIntelligenceStore((state) => state.hasLoaded && !state.loading && !state.storageBlocked && !state.switchingCase);
  const activeCase = home.activeCase;
  const caseId = activeCase?.id;
  const children = snapshot.children.filter((row) => row.user_id === ownerId && row.case_id === caseId && !row.deleted_at);
  const [confirmedCase, setConfirmedCase] = useState(false), [child, setChild] = useState<string>('unselected');
  const [preview, setPreview] = useState<Preview | null>(null), [busy, setBusy] = useState(false), [reviewed, setReviewed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]), [progress, setProgress] = useState<CsvImportProgress | null>(null);
  const [page, setPage] = useState(0), [expanded, setExpanded] = useState<number | null>(null);
  const mounted = useRef(true), operation = useRef(0), inFlight = useRef(false), currentPreview = useRef<Preview | null>(null);
  const chosenScope = useRef({ confirmedCase, child }); chosenScope.current = { confirmedCase, child };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; operation.current++; const old = currentPreview.current; currentPreview.current = null; old?.bytes.fill(0); if (old) void discardPickedEvidence(old.picked).catch(() => undefined); }; }, []);

  function guard(run: number, generation: number) {
    const state = useCaseIntelligenceStore.getState();
    if (!mounted.current || run !== operation.current || generation !== getWorkspaceGeneration() || getWorkspaceOwnerId() !== ownerId || state.ownerId !== ownerId || getActiveCase(state.snapshot)?.id !== caseId || !chosenScope.current.confirmedCase || chosenScope.current.child !== child || (child !== 'whole-case' && !state.snapshot.children.some((row) => row.id === child && row.case_id === caseId && row.user_id === ownerId && !row.deleted_at))) throw new Error('Your account, case, or child selection changed. Reopen import and select the file again.');
  }
  function isCurrent(run: number, generation: number) { try { guard(run, generation); return true; } catch { return false; } }
  async function clearPreview() {
    operation.current++; const old = currentPreview.current; currentPreview.current = null;
    setPreview(null); setProgress(null); setReviewed(false); setPage(0); setExpanded(null); old?.bytes.fill(0);
    if (old) try { await discardPickedEvidence(old.picked); } catch { if (mounted.current) setErrors(['The temporary selected-file cache could not be cleared. Retry on this device before leaving it.']); }
  }
  async function selectFile() {
    if (inFlight.current || !confirmedCase || child === 'unselected' || !ownerId || !caseId) return;
    inFlight.current = true; setBusy(true); setErrors([]);
    await clearPreview(); const run = ++operation.current, generation = getWorkspaceGeneration();
    let selected: Awaited<ReturnType<typeof pickCsvBytes>> = null;
    try {
      guard(run, generation); selected = await pickCsvBytes(); guard(run, generation); if (!selected) return;
      const rows = parseCsvImport(selected.bytes);
      const plan = await buildCsvImportPlan({ ownerId, caseId, childId: child === 'whole-case' ? null : child }, selected.bytes, rows, hashCsvBytes); guard(run, generation);
      for (const row of plan.rows) findImportedDuplicate(useCaseIntelligenceStore.getState().snapshot.entries, plan, row);
      const next = { ...selected, plan, generation }; currentPreview.current = next; setPreview(next); selected = null;
    } catch (failure) {
      if (isCurrent(run, generation)) setErrors(failure instanceof CsvValidationError ? failure.issues.map((issue) => `${issue.rowIndex === null ? 'CSV' : `Data row ${issue.rowIndex}`}: ${issue.message}`) : [failure instanceof Error ? failure.message : 'The CSV could not be opened.']);
    } finally {
      if (selected) { selected.bytes.fill(0); await discardPickedEvidence(selected.picked).catch(() => undefined); }
      inFlight.current = false; if (mounted.current) setBusy(false);
    }
  }
  async function startImport() {
    if (!preview || !reviewed || inFlight.current) return;
    inFlight.current = true; setBusy(true); setErrors([]);
    const run = ++operation.current, generation = preview.generation; let frozen: Awaited<ReturnType<typeof frozenCsvSource>> | null = null;
    try {
      guard(run, generation); frozen = await frozenCsvSource(preview.picked, preview.bytes); guard(run, generation);
      const hash = await hashCsvBytes(preview.bytes); guard(run, generation); if (hash !== preview.plan.fileHash) throw new Error('The reviewed CSV bytes changed. Select the file again.');
      await runCsvImport(preview.plan, { assertCurrent: () => guard(run, generation), source: frozen.input, hash: hashCsvBytes,
        entries: () => useCaseIntelligenceStore.getState().snapshot.entries, attachments: () => useCaseIntelligenceStore.getState().snapshot.evidenceAttachments,
        saveEntry: (input) => useCaseIntelligenceStore.getState().createEntry(input), saveAttachment: (input) => useCaseIntelligenceStore.getState().createLocalAttachment(input),
        flush: () => useCaseIntelligenceStore.getState().retrySave(), readOriginal: (attachment) => getEvidenceAttachmentBytes(attachment, ownerId!), onProgress: setProgress });
    } catch (failure) {
      if (isCurrent(run, generation)) { if (failure instanceof CsvImportStopped) setProgress(failure.progress); setErrors([failure instanceof Error ? failure.message : 'Import stopped. Retry the same file and scope.']); }
    } finally {
      if (frozen) try { await frozen.release(); } catch { if (isCurrent(run, generation)) setErrors((old) => [...old, 'Temporary CSV cache cleanup failed. Keep this device secure and retry cleanup.']); }
      inFlight.current = false; if (mounted.current) setBusy(false);
    }
  }
  async function template(guide = false) {
    try { const { downloadArtifact } = await import('@/lib/export/download'); await downloadArtifact({ name: guide ? 'family-bench-csv-field-guide.txt' : 'family-bench-import-template.csv', mimeType: guide ? 'text/plain' : 'text/csv', bytes: new TextEncoder().encode(guide ? CSV_FIELD_GUIDE : CSV_TEMPLATE) }); }
    catch (failure) { setErrors([failure instanceof Error ? failure.message : 'The template could not be downloaded.']); }
  }
  const rows = preview?.plan.rows ?? [], pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const matches = useMemo(() => {
    const result = new Map<string, { duplicate: boolean; error?: string }>();
    if (preview) for (const row of preview.plan.rows) {
      try { result.set(row.id, { duplicate: row.repeatedRow !== null || Boolean(findImportedDuplicate(snapshot.entries, preview.plan, row)) }); }
      catch (failure) { result.set(row.id, { duplicate: false, error: failure instanceof Error ? failure.message : 'This row conflicts with an existing record.' }); }
    }
    return result;
  }, [preview, snapshot.entries]);
  const duplicates = [...matches.values()].filter((match) => match.duplicate).length;
  const identityError = [...matches.values()].find((match) => match.error)?.error;
  return <CaseScreen desktopMaxWidth={1060} rightRail={false}><View style={styles.page}>
    <View style={styles.card}><Chip tone="forest">Review before importing</Chip><Display size={34} accessibilityRole="header">Import a CSV</Display><Text style={styles.intro}>Bring a prepared table into one case. The complete CSV is preserved privately, and imported entries stay private until you review them.</Text></View>
    <SoftCard p={16} style={styles.card}><Text accessibilityRole="header" style={styles.title}>Use the Family Bench template</Text><Text style={styles.body}>UTF-8 CSV, up to 4 MiB and 500 data records. Quoted commas, escaped quotes, multiline fields, CRLF, LF, and a leading UTF-8 BOM are supported. Provider-specific exports are not mapped automatically.</Text><Text selectable style={styles.body}>{CSV_HEADERS.join(', ')}</Text><Text style={styles.body}>Required: entry_type, event_date (YYYY-MM-DD), and body. Optional: event_time (24-hour HH:MM or HH:MM:SS), title, private_notes, is_flagged (true/false), and typed_details JSON. Blank flags mean false. Leading and trailing field whitespace is normalized when saving; the original bytes remain intact.</Text><Text style={styles.body}>typed_details is optional. If supplied, it must use the matching version 1 capture schema with no unknown fields. Expense reimbursements use null for unknown and 0 only for a known zero; linked message IDs are not imported.</Text><PillButton tone="ghost" disabled={busy} onPress={() => void template()}>Download CSV template</PillButton><PillButton tone="ghost" disabled={busy} onPress={() => void template(true)}>Download field guide and typed examples</PillButton></SoftCard>
    {!activeCase ? <SoftCard p={16} style={styles.card}><Text style={styles.body}>Set up a case before importing records.</Text><PillButton onPress={() => router.push('/onboarding')}>Set up a case</PillButton></SoftCard> : <SoftCard p={16} style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Choose the destination</Text><PillButton disabled={busy || !workspaceReady} tone={confirmedCase ? 'primary' : 'ghost'} accessibilityLabel={`Import into ${activeCase.title}, ${confirmedCase ? 'selected' : 'not selected'}`} onPress={() => setConfirmedCase(true)}>Use {activeCase.title || 'this case'}</PillButton><PillButton disabled={busy} tone="ghost" onPress={() => router.push('/cases' as never)}>Choose another case</PillButton>
      <Text style={styles.label}>Apply these rows to</Text><View style={styles.row}>{[{ id: 'whole-case', name: 'Whole case' }, ...children].map((row) => <PillButton key={row.id} disabled={busy} tone={child === row.id ? 'primary' : 'ghost'} accessibilityLabel={`${row.name}, ${child === row.id ? 'selected' : 'not selected'}`} onPress={() => { if (child !== row.id) { void clearPreview(); setChild(row.id); } }}>{row.name}</PillButton>)}</View>
      <PillButton tone="primary" disabled={busy || !workspaceReady || !confirmedCase || child === 'unselected'} onPress={() => void selectFile()}>{busy && !preview ? 'Opening CSV…' : preview ? 'Choose a different CSV' : 'Choose CSV to review'}</PillButton>
    </SoftCard>}
    {!!errors.length && <SoftCard p={16} style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{progress ? `Import stopped after ${progress.processed} of ${progress.total} rows were processed. Completed records remain saved; retry this file and destination to resume.` : 'No CSV records were imported from this selection.'}</Text>{errors.map((error, i) => <Text key={i} style={styles.error}>{error}</Text>)}</SoftCard>}
    {preview && <><SoftCard p={16} style={styles.card}><Text accessibilityRole="header" style={styles.title}>{preview.picked.filename}</Text><Text style={styles.body}>{rows.length} data rows · {duplicates} exact duplicates or existing CSV import records in this case and child scope. Matches retain any later edits or review decisions.</Text><Text selectable style={styles.hash}>SHA-256: {preview.plan.fileHash}</Text><Text style={styles.body}>Exact duplicate detection compares original imported field values from CSV imports in this case and child scope. It does not infer matches to manually created records. The source file is kept even when all rows are duplicates.</Text>
      {rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((row) => <View key={row.id} style={styles.record}><Text accessibilityRole="header" style={styles.label}>Data row {row.data.rowIndex} · {row.data.title}</Text><Text style={styles.body}>{row.data.eventDate} {row.data.eventTime || ''} · {row.data.entryType}{row.repeatedRow ? ` · repeats data row ${row.repeatedRow}` : matches.get(row.id)?.error ? ' · identity conflict; import unavailable' : matches.get(row.id)?.duplicate ? ' · existing CSV import record' : ' · new private entry'}</Text><Text numberOfLines={expanded === row.data.rowIndex ? undefined : 3} style={styles.body}>{row.data.body}</Text><PillButton size="sm" tone="ghost" onPress={() => setExpanded(expanded === row.data.rowIndex ? null : row.data.rowIndex)}>{expanded === row.data.rowIndex ? 'Collapse row' : 'Review all row fields'}</PillButton>{expanded === row.data.rowIndex && <><Text style={styles.body}>Private notes: {row.data.privateNotes || 'None'}</Text><Text style={styles.body}>Flagged: {String(row.data.isFlagged)}</Text><Text selectable style={styles.body}>Typed details: {row.data.typedDetails ? JSON.stringify(row.data.typedDetails, null, 2) : 'Not supplied'}</Text></>}</View>)}
      <View style={styles.row}><PillButton disabled={page === 0} onPress={() => setPage((value) => value - 1)}>Previous rows</PillButton><Text style={styles.body}>Page {page + 1} of {pages}</Text><PillButton disabled={page + 1 === pages} onPress={() => setPage((value) => value + 1)}>Next rows</PillButton></View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: reviewed, disabled: busy }} aria-checked={reviewed} disabled={busy} onPress={() => setReviewed((value) => !value)} style={styles.confirm}><Text style={styles.body}>{reviewed ? '☑' : '☐'} I reviewed the destination and CSV rows. Import new entries privately for individual review.</Text></Pressable>
      {identityError && <Text accessibilityRole="alert" style={styles.error}>{identityError}</Text>}
      <PillButton tone="primary" disabled={busy || !reviewed || !!identityError || progress?.phase === 'complete'} onPress={() => void startImport()}>{busy ? 'Importing…' : progress ? 'Resume private import' : 'Preserve source and import privately'}</PillButton>
    </SoftCard>{progress && <SoftCard p={16} style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.body}>{progress.phase === 'complete' ? 'Import completed.' : progress.phase === 'source' ? 'Preserving source.' : 'Import progress.'} {progress.processed}/{progress.total} rows processed; {progress.created} newly saved, {progress.existing} already present, {progress.repeated} repeated rows skipped.</Text><Text style={styles.body}>Source record: {progress.sourceEntrySaved ? 'saved' : 'not yet saved'}. Original CSV: {progress.sourceOriginalSaved ? 'saved and verified' : 'not yet verified'}.</Text>{progress.sourceEntrySaved && <PillButton onPress={() => router.push({ pathname: '/entry/[id]', params: { id: preview.plan.sourceEntryId } })}>Open private CSV source</PillButton>}{progress.lastEntryId && <PillButton onPress={() => router.push({ pathname: '/entry/[id]', params: { id: progress.lastEntryId! } })}>Review an imported entry</PillButton>}<PillButton tone="ghost" onPress={() => router.push('/evidence')}>Open evidence for review</PillButton></SoftCard>}</>}
    <Text style={styles.body}>Import saves records one at a time after preserving the source. A failure can leave a partial import. Select the same file, case, and child scope to resume safely; choosing another child is a separate import. Original attachments embedded or linked inside CSV cells are not downloaded.</Text>
  </View></CaseScreen>;
}
const styles = StyleSheet.create({ page: { gap: fbSpacing.x5 }, card: { gap: fbSpacing.x3 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: fbSpacing.x2 }, intro: { fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, color: fbColors.inkSoft }, title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink }, label: { fontFamily: fbFonts.sansMedium, fontSize: fbType.body, lineHeight: 21, color: fbColors.ink }, body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute }, hash: { fontFamily: fbFonts.monoRegular, fontSize: 11, lineHeight: 17, color: fbColors.inkSoft }, error: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.oxDeep }, record: { gap: fbSpacing.x2, paddingVertical: fbSpacing.x3 }, confirm: { minHeight: fbTouch.min, justifyContent: 'center' } });
