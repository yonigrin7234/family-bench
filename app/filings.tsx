import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EntryCard } from '@/components/case-intelligence/EntryCard';
import { Chip, Display, Icon, InfoCallout, PillButton, ProgressBar, Segment, SoftCard, fbAlpha, fbBorder, fbColors, fbFonts, fbLegalCopy, fbRadii, fbSpacing, fbTouch, fbType, fbWeights, type ChipTone, type IconName } from '@/components/ui/fb';
import { useFilingBuilder, useCaseIntelligenceHome, getActiveCase, type FilingChecklistKey, type FilingPackageStatus, type ReportPreviewType } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { resolveFilingPackageSelection } from '@/lib/filings/model';
import { isPrivateEntry } from '@/lib/export/model';
import { useResponsive } from '@/lib/hooks/useResponsive';

const FILING_TYPES: Array<{ value: string; label: string; tone: ChipTone }> = [
  { value: 'request_for_order', label: 'Request for order', tone: 'ink' },
  { value: 'response', label: 'Response', tone: 'sand' },
  { value: 'custody_visitation', label: 'Custody / visitation', tone: 'forest' },
  { value: 'compliance_packet', label: 'Compliance packet', tone: 'amber' },
  { value: 'expense_support', label: 'Expense support', tone: 'ox' },
];
const REPORT_OPTIONS: Array<{ value: ReportPreviewType; label: string; icon: IconName }> = [
  { value: 'timeline', label: 'Timeline summary', icon: 'clock' },
  { value: 'flagged', label: 'Flagged entries report', icon: 'flag' },
  { value: 'communication', label: 'Communication summary', icon: 'chat' },
  { value: 'medical', label: 'Medical summary', icon: 'shield' },
  { value: 'custodyExchange', label: 'Exchange and missed-time summary', icon: 'home' },
  { value: 'late', label: 'Late incident report', icon: 'clock' },
  { value: 'expense', label: 'Expense report', icon: 'receipt' },
  { value: 'benchBrief', label: 'Bench Brief — factual overview', icon: 'doc' },
];
const CHECKLIST_ITEMS: Array<{ value: FilingChecklistKey; label: string; body: string }> = [
  { value: 'forms', label: 'Forms reviewed', body: 'Prepare editable court forms and check the required forms for your court.' },
  { value: 'exhibits', label: 'Sources reviewed', body: 'Review factual text and every original file you intend to share.' },
  { value: 'declarations', label: 'Declaration reviewed', body: 'Review your own declaration text, supporting papers and signing requirements.' },
  { value: 'service', label: 'Service requirements reviewed', body: 'Record only your preparation review here. This checkbox does not record or perform service.' },
];
const param = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const filingTypeLabel = (value: string) => FILING_TYPES.find((type) => type.value === value)?.label ?? value.replace(/_/g, ' ');
const statusLabel = (value: string) => value === 'ready_for_review' ? 'Ready for review' : value === 'in_progress' ? 'In progress' : 'Draft';

export default function Filings() {
  const { home } = useCaseIntelligenceHome();
  return <FilingWorkspace key={`${home.activeCase?.user_id ?? ''}:${home.activeCase?.id ?? ''}`} />;
}

function FilingWorkspace() {
  const params = useLocalSearchParams(); const packageIdParam = param(params.packageId);
  const { activeCase, snapshot, filingPackages, selectedPackage: storedPackage, selectedPackageState: storedPackageState, filingBuilderState, entries, attachments, filingEntryLinkCounts, createFilingPackage, selectFilingPackage, updateFilingPackageStatus, toggleFilingPackageEntry, toggleFilingPackageAttachment, toggleFilingPackageReport, toggleFilingPackageChecklist, loading } = useFilingBuilder();
  const contextError = useCaseIntelligenceStore((state) => state.contextError);
  const { isMobile } = useResponsive();
  const [title, setTitle] = useState(''); const [filingType, setFilingType] = useState(FILING_TYPES[0].value); const [dueDate, setDueDate] = useState('');
  const [draftId, setDraftId] = useState(() => Crypto.randomUUID());
  const [busy, setBusy] = useState(false); const operation = useRef(false); const mounted = useRef(true);
  const [notice, setNotice] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const attemptedRoute = useRef<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const routeUnavailable = Boolean(packageIdParam && !filingPackages.some((row) => row.id === packageIdParam));
  const selectedPackage = packageIdParam && storedPackage?.id !== packageIdParam ? null : storedPackage;
  const selectedPackageState = selectedPackage ? storedPackageState : null;
  const selection = useMemo(() => activeCase && selectedPackage ? resolveFilingPackageSelection({ snapshot, ownerId: activeCase.user_id, caseId: activeCase.id, packageId: selectedPackage.id, packageState: selectedPackageState }) : null, [snapshot, activeCase, selectedPackage, selectedPackageState]);
  const disabled = busy || loading || !activeCase || !!contextError;
  const canReview = !disabled && !!selection?.entries.length && !selection.issues.length;

  function pinContext() {
    const generation = getWorkspaceGeneration(); const sessionGeneration = useAuthStore.getState().sessionGeneration;
    return () => {
      const current = useCaseIntelligenceStore.getState(); const auth = useAuthStore.getState();
      if (!mounted.current || generation !== getWorkspaceGeneration() || auth.sessionGeneration !== sessionGeneration || auth.recovery
        || auth.session?.user.id !== activeCase?.user_id || current.ownerId !== activeCase?.user_id || getActiveCase(current.snapshot)?.id !== activeCase?.id) throw new Error('The account or case changed. Reopen this package before continuing.');
    };
  }
  async function run(action: () => Promise<void>, success?: string) {
    if (operation.current) return;
    const assertCurrent = pinContext(); operation.current = true; setBusy(true); setNotice(null); setError(null);
    try { assertCurrent(); await action(); assertCurrent(); if (success) setNotice(success); }
    catch (failure) { if (mounted.current) setError(failure instanceof Error ? failure.message : 'Unable to save this package. Try again.'); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  }
  useEffect(() => {
    if (!packageIdParam || loading || !activeCase || attemptedRoute.current === packageIdParam || routeUnavailable) return;
    attemptedRoute.current = packageIdParam;
    void run(() => selectFilingPackage(packageIdParam));
  }, [packageIdParam, loading, activeCase?.id, routeUnavailable]);

  function choosePackage(id: string) {
    const assertCurrent = pinContext();
    void run(async () => { await selectFilingPackage(id); assertCurrent(); router.setParams({ packageId: id }); });
  }
  function createPackage() {
    const assertCurrent = pinContext();
    void run(async () => {
      const result = await createFilingPackage({ id: draftId, title: title.trim() || `${filingTypeLabel(filingType)} package`, filingType, dueDate, status: 'draft' });
      assertCurrent(); setTitle(''); setDueDate(''); setDraftId(Crypto.randomUUID()); router.setParams({ packageId: result.filingPackage.id });
    }, 'Package saved on this device. Account sync status appears above.');
  }
  function navigate(pathname: '/export-prep' | '/reports', reportType?: ReportPreviewType) {
    if (!canReview || !selectedPackage || !activeCase) return;
    try {
      pinContext()();
      const current = useCaseIntelligenceStore.getState();
      const reviewed = resolveFilingPackageSelection({ snapshot: current.snapshot, ownerId: activeCase.user_id, caseId: activeCase.id, packageId: selectedPackage.id, packageState: current.filingBuilderState.packageStates[selectedPackage.id] });
      if (reviewed.issues.length || !reviewed.entryIds.length) throw new Error(reviewed.issues[0] || 'Link at least one shareable source before reviewing.');
      router.push({ pathname, params: { packageId: selectedPackage.id, ...(reportType ? { reportType } : {}) } } as never);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Review the package selections.'); }
  }

  return <CaseScreen desktopMaxWidth={1180}>
    <View style={styles.header}>
      <Display size={32}>Filing Builder</Display>
      <Text style={styles.subtitle}>Organize selected records, review factual reports, and prepare court forms. {fbLegalCopy.legalInformationNotAdvice}</Text>
    </View>
    <InfoCallout title="Preparation status" tone="ink">Package status and checklist marks are your preparation notes. They do not establish that a document is complete, filed, accepted by a court or served. Filing and service are not performed by the app.</InfoCallout>
    <View style={styles.actionRow}>
      <PillButton tone="ghost" icon="doc" disabled={busy} onPress={() => router.push('/forms' as never)}>Prepare court forms</PillButton>
      <PillButton tone="ghost" icon="folder" disabled={busy} onPress={() => router.push('/briefcase' as never)}>Open hearing Briefcase</PillButton>
    </View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    {routeUnavailable && !loading ? <InfoCallout title="Package unavailable" tone="ink">The requested package is not available in this case. Choose an available package below; no substitute selection will be exported.</InfoCallout> : null}
    {!activeCase && !loading ? <PillButton onPress={() => router.push('/onboarding' as never)}>Set up a case</PillButton> : null}
    <View style={!isMobile ? styles.desktopFilingsGrid : undefined}>
      <View style={!isMobile ? styles.desktopListColumn : undefined}>
        <SoftCard p={16} style={styles.createCard}>
          <Text style={styles.sectionTitle}>New filing package</Text>
          <Text style={styles.label}>Title</Text>
          <TextInput accessibilityLabel="Package title" value={title} onChangeText={setTitle} editable={!disabled} placeholder="Example: Hearing evidence packet" placeholderTextColor={fbColors.inkFaint} style={styles.input} />
          <Text style={styles.label}>Filing type</Text>
          <View style={styles.chipWrap}>{FILING_TYPES.map((option) => <PillButton key={option.value} tone={filingType === option.value ? 'soft' : 'ghost'} size="sm" disabled={disabled} onPress={() => setFilingType(option.value)}>{option.label}</PillButton>)}</View>
          <Text style={styles.label}>Due date (optional)</Text>
          <TextInput accessibilityLabel="Package due date" value={dueDate} onChangeText={setDueDate} editable={!disabled} placeholder="YYYY-MM-DD" autoCapitalize="none" placeholderTextColor={fbColors.inkFaint} style={styles.input} />
          <PillButton icon="plus" disabled={disabled} onPress={createPackage}>{busy ? 'Saving…' : 'Create filing package'}</PillButton>
        </SoftCard>
        <View style={styles.resultsHeader}><Text style={styles.sectionLabel}>FILING PACKAGES</Text><Text style={styles.resultCount}>{filingPackages.length} · {activeCase?.title ?? 'Current case'}</Text></View>
        <View style={styles.packageStack}>{filingPackages.map((pkg) => <Pressable key={pkg.id} accessibilityRole="button" accessibilityLabel={`Open ${pkg.title}`} accessibilityState={{ selected: selectedPackage?.id === pkg.id, disabled }} disabled={disabled} onPress={() => choosePackage(pkg.id)}>
          <SoftCard p={14} style={[styles.packageCard, selectedPackage?.id === pkg.id && styles.packageCardActive]}>
            <Text style={styles.packageTitle}>{pkg.title}</Text><Text style={styles.packageMeta}>{filingTypeLabel(pkg.filing_type)} · {statusLabel(pkg.status)} · Due {pkg.due_date || 'not set'}</Text>
            <Text style={styles.packageMeta}>{filingBuilderState.packageStates[pkg.id]?.linkedEntryIds.length ?? 0} entry links · {filingBuilderState.packageStates[pkg.id]?.linkedAttachmentIds.length ?? 0} original links</Text>
          </SoftCard>
        </Pressable>)}</View>
        {!filingPackages.length ? <Text style={styles.emptyBody}>Create a draft package, then choose its records and review its outputs.</Text> : null}
      </View>
      <View style={!isMobile ? styles.desktopDetailColumn : undefined}>
        {selectedPackage && selectedPackageState ? <View style={styles.detailStack}>
          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionTitle}>{selectedPackage.title}</Text>
            <Text style={styles.sectionBody}>Your preparation status</Text>
            <Segment<FilingPackageStatus> disabled={disabled} items={[{ v: 'draft', label: 'Draft' }, { v: 'in_progress', label: 'In progress' }, { v: 'ready_for_review', label: 'Ready for review' }]} value={selectedPackage.status as FilingPackageStatus} onChange={(status) => void run(() => updateFilingPackageStatus(selectedPackage.id, status), 'Preparation status saved.')} />
            <ProgressBar pct={selectedPackage.completion_percent} label="Your checklist marks" />
            {CHECKLIST_ITEMS.map((item) => <Pressable key={item.value} accessibilityRole="checkbox" accessibilityLabel={item.label} accessibilityState={{ checked: selectedPackageState.checklist[item.value], disabled }} disabled={disabled} onPress={() => void run(() => toggleFilingPackageChecklist(selectedPackage.id, item.value), 'Checklist mark saved.')} style={styles.checklistRow}>
              <Text style={styles.rowTitle}>{selectedPackageState.checklist[item.value] ? '☑' : '☐'}</Text><View style={styles.checklistCopy}><Text style={styles.rowTitle}>{item.label}</Text><Text style={styles.rowBody}>{item.body}</Text></View>
            </Pressable>)}
          </SoftCard>
          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>REVIEW THIS PACKAGE</Text>
            <Text style={styles.sectionBody}>{selection?.entryIds.length ?? 0} shareable entries · {selection?.attachments.length ?? 0} original files · {selection?.reportTypes.length ?? 0} linked report types.</Text>
            <Text style={styles.sectionBody}>An original-file link includes its parent entry in the review. The evidence ZIP includes every live original attached to the reviewed entries, including sibling files you did not link individually. The PDF lists source references; it does not embed those original files.</Text>
            {selection?.issues.map((issue) => <Text key={issue} accessibilityRole="alert" style={styles.error}>{issue}</Text>)}
            {selection && (selection.unavailableEntryIds.length > 0 || selection.unavailableAttachmentIds.length > 0) ? <View style={styles.entryStack}>
              <Text style={styles.sectionLabel}>UNAVAILABLE LINKED SOURCES</Text>
              <Text style={styles.sectionBody}>These source records are no longer available in this case. Unlinking removes only the package reference; it does not delete a record or original file.</Text>
              {selection.unavailableEntryIds.map((id, index) => <PillButton key={`entry-${id}`} tone="ghost" size="sm" disabled={disabled} onPress={() => void run(() => toggleFilingPackageEntry(selectedPackage.id, id), 'Unavailable entry link removed from this package.')}>
                Unlink unavailable entry {index + 1}
              </PillButton>)}
              {selection.unavailableAttachmentIds.map((id, index) => <PillButton key={`original-${id}`} tone="ghost" size="sm" disabled={disabled} onPress={() => void run(() => toggleFilingPackageAttachment(selectedPackage.id, id), 'Unavailable original link removed from this package.')}>
                Unlink unavailable original {index + 1}
              </PillButton>)}
            </View> : null}
            {selection?.entries.map((entry) => <PillButton key={entry.id} tone="ghost" size="sm" icon="doc" disabled={busy} onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } } as never)}>{entry.title || 'Untitled entry'}{selection.attachmentParentEntryIds.includes(entry.id) && !selectedPackageState.linkedEntryIds.includes(entry.id) ? ' · from original link' : ''}</PillButton>)}
            {!selection?.entryIds.length ? <Text style={styles.emptyBody}>Link at least one shareable entry or original below. A report-type link alone does not select case records.</Text> : null}
            <PillButton icon="doc" disabled={!canReview} onPress={() => navigate('/export-prep')}>Review timeline PDF / evidence ZIP</PillButton>
            <Text style={styles.rowBody}>Private entries are blocked. Private notes and app metadata are excluded from shared outputs. Verify the content of every original before sharing.</Text>
          </SoftCard>
          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK ENTRIES</Text>
            {entries.map((entry) => { const linked = selectedPackageState.linkedEntryIds.includes(entry.id); const privateEntry = isPrivateEntry(entry); return <View key={entry.id} style={styles.entryLinkBlock}>
              <EntryCard entry={entry} attachmentCount={attachments.filter((file) => file.entry_id === entry.id).length} filingLinkCount={filingEntryLinkCounts[entry.id] ?? 0} compact onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } } as never)} />
              <PillButton tone={linked ? 'soft' : 'ghost'} size="sm" disabled={disabled || (!linked && privateEntry)} onPress={() => void run(() => toggleFilingPackageEntry(selectedPackage.id, entry.id), 'Entry selection saved.')}>{linked ? 'Unlink entry' : privateEntry ? 'Private entry — excluded' : 'Link entry'}</PillButton>
            </View>; })}
          </SoftCard>
          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK REPORT TYPES</Text>
            <Text style={styles.sectionBody}>Each report uses this package’s selected entries and original-file parents. Review its report-specific subset before downloading a factual PDF.</Text>
            {REPORT_OPTIONS.map((report) => { const linked = selectedPackageState.linkedReportTypes.includes(report.value); return <View key={report.value} style={styles.linkRow}>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{report.label}</Text></View>
              <PillButton tone={linked ? 'soft' : 'ghost'} size="sm" disabled={disabled} onPress={() => void run(() => toggleFilingPackageReport(selectedPackage.id, report.value), 'Report link saved.')}>{linked ? 'Unlink' : 'Link'}</PillButton>
              {linked ? <PillButton size="sm" tone="ghost" disabled={!canReview} onPress={() => navigate('/reports', report.value)}>Review</PillButton> : null}
            </View>; })}
          </SoftCard>
          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK ORIGINAL FILES</Text>
            <Text style={styles.sectionBody}>Linking an original includes its parent entry and that entry’s other originals in package review. Files are verified again when generating the evidence ZIP.</Text>
            {attachments.map((attachment) => { const linked = selectedPackageState.linkedAttachmentIds.includes(attachment.id); const privateSource = entries.some((entry) => entry.id === attachment.entry_id && isPrivateEntry(entry)); return <View key={attachment.id} style={styles.linkRow}>
              <View style={styles.rowCopy}><Text style={styles.rowTitle}>{attachment.file_name}</Text><Text style={styles.rowBody}>{privateSource ? 'Private source — excluded' : attachment.mime_type || 'Original file'}</Text></View>
              <PillButton size="sm" tone={linked ? 'soft' : 'ghost'} disabled={disabled || (!linked && privateSource)} onPress={() => void run(() => toggleFilingPackageAttachment(selectedPackage.id, attachment.id), 'Original link saved.')}>{linked ? 'Unlink' : 'Link'}</PillButton>
            </View>; })}
            {!attachments.length ? <Text style={styles.emptyBody}>Capture an original with a case entry to make it available here.</Text> : null}
          </SoftCard>
          <InfoCallout title="Forms, filing and service" tone="ink">Court forms opens a separate editable MC-031 / FL-300 draft workflow for this case. Review and explicitly insert source text there; package links are not automatically inserted. The app does not submit filings, arrange service or determine whether your papers satisfy local requirements.</InfoCallout>
        </View> : <Text style={styles.emptyBody}>{busy ? 'Opening package…' : 'Choose a package to review its sources and outputs.'}</Text>}
      </View>
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  error: { color: fbColors.ox, fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21 },
  header: {
    gap: fbSpacing.x2,
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
  filingDesktopContent: {
    paddingHorizontal: fbSpacing.x4,
  },
  createCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopPanelCard: {
    marginTop: 0,
  },
  desktopFilingsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x5,
  },
  desktopListColumn: {
    width: 340,
  },
  desktopDetailColumn: {
    flex: 1,
    minWidth: 0,
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
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  filterChip: {
    minHeight: fbTouch.min,
    justifyContent: 'center',
    borderRadius: fbRadii.pill,
  },
  filterChipActive: {
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.inkFaint,
  },
  notice: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  resultsHeader: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  sectionLabel: {
    color: fbColors.ox,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  resultCount: {
    flexShrink: 1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: fbFonts.sansRegular,
  },
  packageStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  packageCard: {
    gap: fbSpacing.x3,
  },
  packageCardActive: {
    borderColor: fbColors.ox,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  packageTitleCopy: {
    flex: 1,
  },
  packageTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  packageMeta: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  packageMetricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  emptyCard: {
    marginTop: fbSpacing.x3,
  },
  emptyTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  emptyBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  detailStack: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopDetailStack: {
    marginTop: 0,
  },
  detailCard: {
    gap: fbSpacing.x4,
  },
  sectionBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  checklistRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
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
    backgroundColor: fbColors.ink,
    borderColor: fbColors.ink,
  },
  checklistCopy: {
    flex: 1,
  },
  rowTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  rowBody: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  linkRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  rowCopy: {
    flex: 1,
  },
  entryStack: {
    gap: fbSpacing.x3,
  },
  entryLinkBlock: {
    gap: fbSpacing.x2,
  },
  exhibitStack: {
    gap: fbSpacing.x3,
  },
  exhibitGroup: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
    gap: fbSpacing.x2,
  },
  exhibitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  bottomRule: {
    marginTop: fbSpacing.x5,
  },
  footerNote: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railCard: {
    gap: fbSpacing.x3,
  },
  railSection: {
    gap: fbSpacing.x2,
  },
  railSectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railChecklistRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  railCheckbox: {
    width: 22,
    height: 22,
    borderRadius: fbRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: fbBorder.selected,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  railChecklistText: {
    flex: 1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  warningBox: {
    gap: fbSpacing.x1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.sandDeep,
    backgroundColor: fbColors.sandWash,
  },
  warningTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  warningText: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railValue: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
