import { localCalendarDate } from '@/lib/utils/dateInput';
import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { resolveFilingPackageSelection } from '@/lib/filings/model';
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
  type ChipTone,
  type IconName,
} from '@/components/ui/fb';
import {
  ENTRY_TYPE_OPTIONS,
  formatDateLabel,
  getEntryTypeOption,
  useCaseIntelligenceTimeline,
  useReportPreviewState,
  type Entry,
  type EntryTypeFilterValue,
  type FilingPackage,
  type ReportPreviewFlagFilter,
  type ReportPreviewType,
  type SavedReportVersion,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { validateDateRange } from '@/lib/export/model';
import { buildFactualReports, exchangeCalculation, reportDateRange, selectReportEntries, type FactualReport } from '@/lib/reporting/reports';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { getActiveCase } from '@/lib/case-intelligence/selectors';

type FlagFilter = ReportPreviewFlagFilter;
type ReportType = ReportPreviewType;

type ReportPreview = FactualReport;
type AttachmentCountsByEntryId = Record<string, number>;

const REPORT_TYPES: Array<{ value: ReportType; label: string; tone: ChipTone }> = [
  { value: 'timeline', label: 'Full journal', tone: 'ink' },
  { value: 'flagged', label: 'Flagged entries', tone: 'ox' },
  { value: 'communication', label: 'Communication', tone: 'sand' },
  { value: 'medical', label: 'Medical', tone: 'forest' },
  { value: 'custodyExchange', label: 'Exchange and missed time', tone: 'amber' },
  { value: 'late', label: 'Late incidents', tone: 'ox' },
  { value: 'expense', label: 'Expenses', tone: 'sand' },
  { value: 'benchBrief', label: 'Bench Brief', tone: 'ink' },
];

function titleForEntry(entry: Entry) {
  return entry.title || getEntryTypeOption(entry.entry_type).defaultTitle;
}

function openEntry(entryId: string) {
  router.push({ pathname: '/entry/[id]', params: { id: entryId } } as never);
}

function TypeFilterChip({
  value,
  active,
  onPress,
}: {
  value: EntryTypeFilterValue;
  active: boolean;
  onPress: () => void;
}) {
  const option = value === 'all' ? null : getEntryTypeOption(value);
  const label = option?.shortLabel ?? 'All';
  const tone = (option?.tone ?? 'ink') as ChipTone;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter report entries: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Chip tone={tone} outline={!active}>
        {label}
      </Chip>
    </Pressable>
  );
}

function ReportTypeChip({
  value,
  label,
  tone,
  active,
  filingLinkCount,
  onPress,
}: {
  value: ReportType;
  label: string;
  tone: ChipTone;
  active: boolean;
  filingLinkCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Report type: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Chip tone={tone} outline={!active}>
        {filingLinkCount > 0 ? `${label} · linked to filing` : label}
      </Chip>
    </Pressable>
  );
}

function SourceEntryRow({
  entry,
  attachmentCount,
  selected,
  onToggle,
}: {
  entry: Entry;
  attachmentCount: number;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const option = getEntryTypeOption(entry.entry_type);
  const attachmentLabel =
    attachmentCount > 0
      ? ` · ${attachmentCount === 1 ? '1 attachment' : `${attachmentCount} attachments`}`
      : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={typeof selected === 'boolean' ? { selected } : undefined}
      accessibilityLabel={`${onToggle ? 'Toggle' : 'Open'} source entry: ${titleForEntry(entry)}`}
      onPress={onToggle ?? (() => openEntry(entry.id))}
      style={({ pressed }) => [styles.sourceRow, pressed && styles.pressed]}
    >
      {onToggle ? (
        <View style={[styles.sourceCheckbox, selected && styles.sourceCheckboxActive]}>
          {selected ? <Icon name="check" size={12} color={fbColors.paper} /> : null}
        </View>
      ) : null}
      <View style={styles.sourceIcon}>
        <Icon name={option.icon as IconName} size={14} color={fbColors.ink} />
      </View>
      <View style={styles.sourceCopy}>
        <Text style={styles.sourceTitle}>{titleForEntry(entry)}</Text>
        <Text style={styles.sourceMeta}>
          {formatDateLabel(entry.event_date, entry.event_time)} · {option.shortLabel}{attachmentLabel}
        </Text>
      </View>
      {entry.is_flagged ? (
        <Chip tone="ox" outline={false}>
          Flagged
        </Chip>
      ) : null}
      {!onToggle ? <Icon name="chevR" size={14} color={fbColors.inkMute} /> : null}
    </Pressable>
  );
}

function ReportPreviewCard({
  report,
  attachmentCountsByEntryId,
  filingLinkCount,
  dense,
  selectable,
  selectedEntryIds,
  onToggleEntry,
  sourceEntries,
  onExport,
  exportDisabled,
  onDownloadReport,
  downloadingReport,
}: {
  report: ReportPreview;
  attachmentCountsByEntryId: AttachmentCountsByEntryId;
  filingLinkCount: number;
  dense?: boolean;
  selectable?: boolean;
  selectedEntryIds?: Set<string>;
  onToggleEntry?: (entryId: string) => void;
  sourceEntries?: Entry[];
  onExport: () => void;
  exportDisabled: boolean;
  onDownloadReport: () => void;
  downloadingReport: boolean;
}) {
  const references = sourceEntries ?? report.entries;
  const attachmentCount = report.entries.reduce(
    (total, entry) => total + (attachmentCountsByEntryId[entry.id] ?? 0),
    0,
  );
  const custodyCalculation = ['custodyExchange', 'late'].includes(report.id) ? exchangeCalculation(report.entries) : null;

  return (
    <SoftCard p={16} style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTitleRow}>
          <View style={styles.reportIcon}>
            <Icon name={report.icon} size={17} color={fbColors.ink} />
          </View>
          <View style={styles.reportTitleCopy}>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportDescription}>{report.description}</Text>
          </View>
        </View>
        <Chip tone={report.entries.length ? 'ink' : 'mute'} outline={false}>
          {report.entries.length}
        </Chip>
        {filingLinkCount > 0 ? (
          <Chip tone="forest" outline={false}>
            Linked to filing
          </Chip>
        ) : null}
      </View>

      <View style={[styles.metaGrid, dense && styles.desktopMetaGrid]}>
        <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
          <Text style={styles.metaLabel}>DATE RANGE</Text>
          <Text style={styles.metaValue}>{reportDateRange(report.entries)}</Text>
        </View>
        <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
          <Text style={styles.metaLabel}>INCLUDED ENTRIES</Text>
          <Text style={styles.metaValue}>{report.entries.length} entries</Text>
        </View>
        <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
          <Text style={styles.metaLabel}>SOURCE ATTACHMENTS</Text>
          <Text style={styles.metaValue}>
            {attachmentCount
              ? `${attachmentCount} linked file records`
              : 'No linked originals in this selection'}
          </Text>
        </View>
      </View>

      {custodyCalculation ? (
        <View style={styles.calculationPanel}>
          <View style={styles.calculationHeader}>
            <Icon name="clock" size={15} color={fbColors.ink} />
            <Text style={styles.calculationTitle}>Recorded exchange timing</Text>
          </View>
          <View style={[styles.metaGrid, dense && styles.desktopMetaGrid]}>
            <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
              <Text style={styles.metaLabel}>EXCHANGES</Text>
              <Text style={styles.metaValue}>{custodyCalculation.exchangeCount} source entries</Text>
            </View>
            <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
              <Text style={styles.metaLabel}>FLAGGED</Text>
              <Text style={styles.metaValue}>{custodyCalculation.flaggedExchangeCount} flagged entries</Text>
            </View>
            <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
              <Text style={styles.metaLabel}>LATE MINUTES</Text>
              <Text style={styles.metaValue}>
                {custodyCalculation.calculatedRows.length
                  ? `${custodyCalculation.totalLateMinutes} calculated minutes`
                  : 'No valid paired times recorded'}
              </Text>
            </View>
          </View>
          <Text style={styles.calculationBody}>{custodyCalculation.summary}</Text>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>KEY FACTS</Text>
        <View style={styles.factList}>
          {report.keyFacts.map((fact) => (
            <View key={fact} style={styles.factRow}>
              <Icon name="dot" size={10} color={fbColors.ox} />
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </View>
      </View>

      {report.calculationRows.length ? <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>CALCULATIONS AND SOURCES</Text>
        {report.calculationRows.map((row) => <Pressable key={`${row.entryId}:${row.text}`} accessibilityRole="button" accessibilityLabel={`Open source for ${row.text}`} onPress={() => openEntry(row.entryId)} style={styles.metaBox}>
          <Text style={styles.factText}>{row.text}</Text>
          <Text style={styles.metaValue}>Source: {row.entryId}</Text>
        </Pressable>)}
      </View> : null}
      <Rule />

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLabel}>SOURCE ENTRY REFERENCES</Text>
        {references.length ? (
          <View style={styles.sourceStack}>
            {references.map((entry) => (
              <SourceEntryRow
                key={entry.id}
                entry={entry}
                attachmentCount={attachmentCountsByEntryId[entry.id] ?? 0}
                selected={selectedEntryIds?.has(entry.id)}
                onToggle={selectable ? () => onToggleEntry?.(entry.id) : undefined}
              />
            ))}
            {report.entries.length > references.length ? (
              <Text style={styles.moreText}>
                {report.entries.length - references.length} more source entries included in this preview.
              </Text>
            ) : null}
          </View>
        ) : (
          <Text style={styles.emptyText}>No source entries for this report under the current filters.</Text>
        )}
      </View>

      <PillButton tone="primary" icon="doc" disabled={exportDisabled || downloadingReport} onPress={onDownloadReport}>
        {downloadingReport ? 'Preparing report PDF…' : 'Download this report PDF'}
      </PillButton>
      <PillButton
        tone="soft"
        size="md"
        icon="doc"
        full
        disabled={exportDisabled}
        onPress={onExport}
      >
        Prepare PDF or evidence ZIP
      </PillButton>
    </SoftCard>
  );
}

function ReportsContextRail({
  report,
  attachmentCount,
  filingLinkCount,
  persistenceActive,
  sourceLabel,
  savedReportVersions,
  filingPackages,
  onSaveReport,
  savingReport,
  saveDisabled,
  onToggleReportFiling,
}: {
  report: ReportPreview;
  attachmentCount: number;
  filingLinkCount: number;
  persistenceActive: boolean;
  sourceLabel: string;
  savedReportVersions: SavedReportVersion[];
  filingPackages: FilingPackage[];
  onSaveReport: () => void;
  savingReport: boolean;
  saveDisabled: boolean;
  onToggleReportFiling: (packageId: string) => void;
}) {
  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>REPORT CONTEXT</Text>
      <Text style={styles.railValue}>{report.entries.length} entries</Text>
      <Text style={styles.railText}>{report.title}</Text>
      <Rule />
      <PillButton tone="primary" size="sm" icon="check" disabled={saveDisabled || savingReport} onPress={onSaveReport}>
        {savingReport ? 'Saving report…' : 'Save report version'}
      </PillButton>
      <View style={styles.railSection}>
        <Text style={styles.railSectionTitle}>Saved versions</Text>
        {savedReportVersions.length ? (
          savedReportVersions.slice(0, 4).map((version) => (
            <Text key={version.id} style={styles.railText}>
              {version.title} · {version.includedEntryIds.length} entries
            </Text>
          ))
        ) : (
          <Text style={styles.railText}>No saved report versions yet.</Text>
        )}
      </View>
      <Rule />
      <View style={styles.railSection}>
        <Text style={styles.railSectionTitle}>Link report type to a package</Text>
        <Text style={styles.railText}>This saves a report-type link. It does not add this preview’s entries to that package.</Text>
        {filingPackages.length ? (
          filingPackages.slice(0, 4).map((filingPackage) => (
            <PillButton
              key={filingPackage.id}
              tone="ghost"
              size="sm"
              icon="plus"
              disabled={saveDisabled || savingReport}
              onPress={() => onToggleReportFiling(filingPackage.id)}
            >
              {filingPackage.title}
            </PillButton>
          ))
        ) : (
          <Text style={styles.railText}>Create a filing package before linking report previews.</Text>
        )}
      </View>
      <Rule />
      <Text style={styles.railText}>
        {attachmentCount} original-file references · {filingLinkCount ? 'linked to a filing package' : 'not linked to a filing package'}.
      </Text>
      <Text style={styles.railText}>
        Persistence {persistenceActive ? 'active' : 'inactive'}. Source: {sourceLabel}.
      </Text>
    </SoftCard>
  );
}

export default function Reports() {
  const { snapshot, activeCase, source, loading, persistence } = useCaseIntelligenceTimeline();
  const params = useLocalSearchParams();
  const packageId = Array.isArray(params.packageId) ? params.packageId[0] : params.packageId;
  const requestedReportType = Array.isArray(params.reportType) ? params.reportType[0] : params.reportType;
  const hasPackageRequest = packageId !== undefined;
  const filingBuilderState = useCaseIntelligenceStore((state) => state.filingBuilderState);
  const contextError = useCaseIntelligenceStore((state) => state.contextError);
  const packageSelection = useMemo(() => hasPackageRequest ? resolveFilingPackageSelection({ snapshot, ownerId: activeCase?.user_id || '', caseId: activeCase?.id || '', packageId: packageId || '', packageState: filingBuilderState.packageStates[packageId || ''] }) : null, [snapshot, activeCase, packageId, hasPackageRequest, filingBuilderState]);
  const validRequestedReport = REPORT_TYPES.find((type) => type.value === requestedReportType)?.value;
  const packageError = packageSelection ? (contextError ? 'Review the preserved working-context issue in Settings before preparing package reports.' : packageSelection.issues[0] || (!packageSelection.reportTypes.length ? 'Link a report type in Filing Builder before opening its package report.' : null) || (requestedReportType !== undefined && (!validRequestedReport || !packageSelection.reportTypes.includes(validRequestedReport)) ? 'This report is not linked to the selected package. Reopen it from Filing Builder.' : null)) : null;
  const [packageFilters, setPackageFilters] = useState<{ typeFilter: EntryTypeFilterValue; flagFilter: ReportPreviewFlagFilter }>({ typeFilter: 'all', flagFilter: 'all' });
  const {
    reportPreviewState,
    setReportPreviewState,
    filingReportLinkCounts,
    savedReportVersions,
    saveReportVersion,
    filingPackages,
    toggleFilingPackageReport,
  } = useReportPreviewState();
  const { isMobile, width } = useResponsive();
  const [childFilter, setChildFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dateError = useMemo(() => {
    try { validateDateRange(fromDate, toDate); return null; }
    catch (failure) { return failure instanceof Error ? failure.message : 'Check the date range.'; }
  }, [fromDate, toDate]);
  const [excludedEntryIds, setExcludedEntryIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [linkingReport, setLinkingReport] = useState(false);
  const reportOperation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const storedReportType = REPORT_TYPES.some((option) => option.value === reportPreviewState.reportType) ? reportPreviewState.reportType : 'timeline';
  const reportType = packageSelection ? validRequestedReport ?? packageSelection.reportTypes[0] ?? 'timeline' : storedReportType;
  const typeFilter = hasPackageRequest ? packageFilters.typeFilter : reportPreviewState.typeFilter;
  const flagFilter = hasPackageRequest ? packageFilters.flagFilter : reportPreviewState.flagFilter;
  function updateFilters(patch: Partial<typeof reportPreviewState>) {
    if (reportOperation.current) return;
    if (hasPackageRequest) {
      if (patch.reportType) router.setParams({ reportType: patch.reportType });
      setPackageFilters((current) => ({ ...current, ...(patch.typeFilter ? { typeFilter: patch.typeFilter } : {}), ...(patch.flagFilter ? { flagFilter: patch.flagFilter } : {}) }));
    } else setReportPreviewState(patch);
  }

  const filteredEntries = useMemo(() => {
    if (!activeCase || dateError || packageError) return [];
    return selectReportEntries(packageSelection ? packageSelection.entries : snapshot.entries, { caseId: activeCase.id, userId: activeCase.user_id,
      fromDate, toDate, childId: childFilter === 'all' ? undefined : childFilter,
      entryType: typeFilter === 'all' ? undefined : typeFilter, flaggedOnly: flagFilter === 'flagged' });
  }, [activeCase?.id, activeCase?.user_id, childFilter, dateError, snapshot.entries, flagFilter, typeFilter, fromDate, toDate, packageSelection, packageError]);

  const reports = useMemo(() => buildFactualReports(filteredEntries), [filteredEntries]);
  const activeSourceReport = reports[reportType];
  const includedEntries = activeSourceReport.entries.filter((entry) => !excludedEntryIds.includes(entry.id));
  const activeReport = buildFactualReports(includedEntries)[reportType];
  const selectedEntryIds = useMemo(() => new Set(includedEntries.map((entry) => entry.id)), [includedEntries]);
  const children = useMemo(() => {
    const caseId = activeCase?.id;
    if (!caseId) return [];
    return snapshot.children
      .filter((child) => !child.deleted_at && child.case_id === caseId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCase?.id, snapshot.children]);
  const attachmentCountsByEntryId = useMemo(() => {
    return snapshot.evidenceAttachments.reduce<AttachmentCountsByEntryId>((counts, attachment) => {
      if (!attachment.entry_id || attachment.deleted_at || attachment.case_id !== activeCase?.id || attachment.user_id !== activeCase?.user_id) return counts;
      counts[attachment.entry_id] = (counts[attachment.entry_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [snapshot.evidenceAttachments, activeCase?.id, activeCase?.user_id]);
  const activeReportAttachmentCount = activeReport.entries.reduce(
    (total, entry) => total + (attachmentCountsByEntryId[entry.id] ?? 0),
    0,
  );
  const activeReportFilingLinkCount = filingReportLinkCounts[activeReport.id] ?? 0;
  const showDesktopRail = !isMobile && width >= 1280;
  const sourceLabel =
    source === 'supabase' ? 'Account records' : source === 'local' ? 'Saved on this device' : 'Demo records';

  async function downloadReportPdf() {
    if (reportOperation.current || dateError || packageError || !activeCase || !activeReport.entries.length) return;
    const start = useCaseIntelligenceStore.getState();
    const startAuth = useAuthStore.getState();
    const generation = getWorkspaceGeneration();
    const assertCurrent = () => {
      const current = useCaseIntelligenceStore.getState(); const auth = useAuthStore.getState();
      if (!mounted.current || getWorkspaceGeneration() !== generation || getActiveCase(current.snapshot)?.id !== activeCase.id
        || current.ownerId !== activeCase.user_id || auth.session?.user.id !== activeCase.user_id || auth.recovery
        || auth.sessionGeneration !== startAuth.sessionGeneration || current.snapshot !== start.snapshot || (hasPackageRequest && current.filingBuilderState !== start.filingBuilderState)) {
        throw new Error('The account or case records changed during export. Review the selection and try again.');
      }
    };
    reportOperation.current = true; setDownloadingReport(true); setNotice(null);
    try {
      assertCurrent();
      const [{ createFactualReportPdf }, { downloadArtifact, loadTimelineFonts }] = await Promise.all([
        import('@/lib/reporting/pdf'), import('@/lib/export/download'),
      ]);
      const artifact = await createFactualReportPdf({ caseId: activeCase.id, caseTitle: activeCase.title || activeCase.case_number || 'Case record', entries: start.snapshot.entries,
        attachments: start.snapshot.evidenceAttachments, includedEntryIds: activeReport.entries.map((entry) => entry.id), fromDate, toDate },
        { reportType, ownerId: activeCase.user_id, fonts: await loadTimelineFonts(), assertCurrent });
      assertCurrent();
      await downloadArtifact(artifact, assertCurrent);
      setNotice('Report PDF prepared. Review it before sharing. Original files are available separately in the evidence ZIP.');
    } catch (failure) { setNotice(failure instanceof Error ? failure.message : 'The report PDF could not be prepared.'); }
    finally { reportOperation.current = false; if (mounted.current) setDownloadingReport(false); }
  }

  function toggleIncludedEntry(entryId: string) {
    if (reportOperation.current) return;
    setNotice(null);
    setExcludedEntryIds((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId],
    );
  }

  function pinReportContext() {
    const generation = getWorkspaceGeneration(); const sessionGeneration = useAuthStore.getState().sessionGeneration;
    return () => {
      const current = useCaseIntelligenceStore.getState(); const auth = useAuthStore.getState();
      if (!mounted.current || generation !== getWorkspaceGeneration() || auth.sessionGeneration !== sessionGeneration || auth.recovery
        || auth.session?.user.id !== activeCase?.user_id || current.ownerId !== activeCase?.user_id || getActiveCase(current.snapshot)?.id !== activeCase?.id) throw new Error('The account or case changed. Reopen the report before continuing.');
    };
  }
  async function saveCurrentReport() {
    if (reportOperation.current || dateError || packageError || !activeReport.entries.length) return;
    const assertCurrent = pinReportContext(); reportOperation.current = true; setSavingReport(true); setNotice(null);
    try {
      assertCurrent();
      const saved = await saveReportVersion({ reportType, title: `${activeReport.title} - ${localCalendarDate()}`, includedEntryIds: activeReport.entries.map((entry) => entry.id),
        filters: { typeFilter, flagFilter, childFilter: childFilter === 'all' ? null : childFilter, dateRangeLabel: `${fromDate || 'First recorded'} to ${toDate || 'Latest recorded'}` } });
      assertCurrent(); setNotice(`${saved.title} was saved. Account sync status appears above.`);
    } catch (failure) { if (mounted.current) setNotice(failure instanceof Error ? failure.message : 'The report version could not be saved. Please try again.'); }
    finally { reportOperation.current = false; if (mounted.current) setSavingReport(false); }
  }
  async function toggleReportLink(id: string) {
    if (reportOperation.current || packageError) return;
    const assertCurrent = pinReportContext(); reportOperation.current = true; setLinkingReport(true); setNotice(null);
    try { assertCurrent(); await toggleFilingPackageReport(id, activeReport.id); assertCurrent(); setNotice('Report-type link saved. This link does not add source entries; review the package selections in Filing Builder.'); }
    catch (failure) { if (mounted.current) setNotice(failure instanceof Error ? failure.message : 'The report link could not be saved.'); }
    finally { reportOperation.current = false; if (mounted.current) setLinkingReport(false); }
  }

  const filterPanel = (
    <SoftCard p={16} style={[styles.filterCard, !isMobile && styles.desktopPanelCard]}>
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleRow}>
          <Icon name="filter" size={16} color={fbColors.ink} />
          <Text style={styles.filterTitle}>Preview filters</Text>
        </View>
        <Text style={styles.resultCount}>
          {loading ? 'Loading' : `${filteredEntries.length} entries`}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.filterSubhead}>From</Text>
          <TextInput accessibilityLabel="Report start date" placeholder="YYYY-MM-DD" value={fromDate} editable={!downloadingReport && !savingReport && !linkingReport} onChangeText={setFromDate} autoCapitalize="none" style={styles.dateInput} placeholderTextColor={fbColors.inkMute} />
        </View>
        <View style={styles.dateField}>
          <Text style={styles.filterSubhead}>Through</Text>
          <TextInput accessibilityLabel="Report end date" placeholder="YYYY-MM-DD" value={toDate} editable={!downloadingReport && !savingReport && !linkingReport} onChangeText={setToDate} autoCapitalize="none" style={styles.dateInput} placeholderTextColor={fbColors.inkMute} />
        </View>
      </View>
      {dateError ? <Text accessibilityRole="alert" style={styles.dateError}>{dateError}</Text> : null}

      <View style={styles.typeFilters}>
        {REPORT_TYPES.filter((option) => !packageSelection || packageSelection.reportTypes.includes(option.value)).map((option) => (
          <ReportTypeChip
            key={option.value}
            value={option.value}
            label={option.label}
            tone={option.tone}
            active={reportType === option.value}
            filingLinkCount={filingReportLinkCounts[option.value] ?? 0}
            onPress={() => updateFilters({ reportType: option.value })}
          />
        ))}
      </View>

      <Segment<FlagFilter>
        items={[
          { v: 'all', label: 'All' },
          { v: 'flagged', label: 'Flagged' },
        ]}
        value={flagFilter}
        onChange={(value) => updateFilters({ flagFilter: value })}
      />

      <View style={styles.typeFilters}>
        <Text style={styles.filterSubhead}>Entry type</Text>
        <TypeFilterChip
          value="all"
          active={typeFilter === 'all'}
          onPress={() => updateFilters({ typeFilter: 'all' })}
        />
        {ENTRY_TYPE_OPTIONS.map((option) => (
          <TypeFilterChip
            key={option.value}
            value={option.value}
            active={typeFilter === option.value}
            onPress={() => updateFilters({ typeFilter: option.value })}
          />
        ))}
      </View>

      {children.length ? (
        <View style={styles.typeFilters}>
          <Text style={styles.filterSubhead}>Child</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: childFilter === 'all' }}
            accessibilityLabel="Filter reports by all children"
            onPress={() => { if (!reportOperation.current) setChildFilter('all'); }}
            style={({ pressed }) => [
              styles.filterChip,
              childFilter === 'all' && styles.filterChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Chip tone="ink" outline={childFilter !== 'all'}>All children</Chip>
          </Pressable>
          {children.map((child) => (
            <Pressable
              key={child.id}
              accessibilityRole="button"
              accessibilityState={{ selected: childFilter === child.id }}
              accessibilityLabel={`Filter reports by ${child.name}`}
              onPress={() => { if (!reportOperation.current) setChildFilter(child.id); }}
              style={({ pressed }) => [
                styles.filterChip,
                childFilter === child.id && styles.filterChipActive,
                pressed && styles.pressed,
              ]}
            >
              <Chip tone="forest" outline={childFilter !== child.id}>{child.name}</Chip>
            </Pressable>
          ))}
        </View>
      ) : null}
    </SoftCard>
  );

  const previewPanel = (
    <>
      <InfoCallout title="Report limits" tone="ink">
        These reports summarize your selected records and identify missing calculation fields. Private entries and notes are excluded. Download the report PDF or prepare a separate timeline and original-file ZIP. Local persistence is {persistence.active ? 'active' : 'inactive'}.
      </InfoCallout>

      <View style={[styles.resultsHeader, !isMobile && styles.desktopResultsHeader]}>
        <Text style={styles.sectionLabel}>REPORT PREVIEW</Text>
        <Text style={styles.resultCount}>
          {activeCase?.title || 'Current case'} · {sourceLabel}
        </Text>
      </View>

      <ReportPreviewCard
        report={activeReport}
        attachmentCountsByEntryId={attachmentCountsByEntryId}
        filingLinkCount={activeReportFilingLinkCount}
        dense={!isMobile}
        selectable
        selectedEntryIds={selectedEntryIds}
        onToggleEntry={toggleIncludedEntry}
        sourceEntries={activeSourceReport.entries}
        exportDisabled={!!dateError || !!packageError || downloadingReport || savingReport || linkingReport || !activeReport.entries.length}
        onDownloadReport={() => void downloadReportPdf()}
        downloadingReport={downloadingReport}
        onExport={() => router.push({ pathname: '/export-prep', params: {
          mode: 'report', ...(hasPackageRequest ? { packageId } : {}), entryIds: JSON.stringify(activeReport.entries.map((entry) => entry.id)), fromDate, toDate,
        } } as never)}
      />
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    </>
  );

  return (
    <CaseScreen
      desktopMaxWidth={1120}
      contentStyle={!isMobile ? styles.reportsDesktopContent : undefined}
      rightRail={
        showDesktopRail ? (
          <ReportsContextRail
            report={activeReport}
            attachmentCount={activeReportAttachmentCount}
            filingLinkCount={activeReportFilingLinkCount}
            persistenceActive={persistence.active}
            sourceLabel={sourceLabel}
            savedReportVersions={savedReportVersions}
            filingPackages={filingPackages}
            onSaveReport={() => void saveCurrentReport()}
            savingReport={savingReport}
            saveDisabled={!!dateError || !!packageError || downloadingReport || linkingReport || !activeReport.entries.length}
            onToggleReportFiling={(id) => void toggleReportLink(id)}
          />
        ) : (
          false
        )
      }
    >
      <View style={styles.header}>
        <Display size={32} style={styles.title}>
          Reports
        </Display>
        <Text style={styles.subtitle}>
          Factual previews from saved entries. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: fbSpacing.x2, marginTop: fbSpacing.x3 }}>
          <PillButton
            tone="soft"
            size="sm"
            icon="scales"
            onPress={() => router.push('/calculator' as never)}
          >
            Open custody calculator
          </PillButton>
        </View>
      </View>

      {hasPackageRequest ? <InfoCallout title="Selected filing package" tone="ink">This report is limited to the package’s linked entries and the parent entries of explicitly linked originals. Filters can narrow that scope. Original-file ZIPs include all originals attached to their selected entries.</InfoCallout> : null}
      {packageError ? <Text accessibilityRole="alert" style={styles.dateError}>{packageError}</Text> : null}
      {isMobile ? (
        <>
          {filterPanel}
          {previewPanel}
        </>
      ) : (
        <View style={styles.desktopReportsGrid}>
          <View style={styles.desktopFilterColumn}>{filterPanel}</View>
          <View style={styles.desktopPreviewColumn}>{previewPanel}</View>
        </View>
      )}
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  dateRow: { gap: fbSpacing.x3 },
  dateField: { gap: fbSpacing.x2 },
  dateInput: { minHeight: fbTouch.min, borderWidth: fbBorder.hairline, borderColor: fbColors.rule, borderRadius: fbRadii.sm, padding: fbSpacing.x3, color: fbColors.ink, fontFamily: fbFonts.sansRegular, fontSize: fbType.body },
  dateError: { color: fbColors.ox, fontFamily: fbFonts.sansRegular, fontSize: fbType.small, lineHeight: 20 },
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
  reportsDesktopContent: {
    paddingHorizontal: fbSpacing.x4,
  },
  filterCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopPanelCard: {
    marginTop: 0,
  },
  desktopReportsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x5,
  },
  desktopFilterColumn: {
    width: 320,
  },
  desktopPreviewColumn: {
    flex: 1,
    minWidth: 0,
  },
  filterHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  filterTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  filterSubhead: {
    width: '100%',
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
  },
  placeholderBox: {
    gap: fbSpacing.x1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  placeholderTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  placeholderBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
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
  resultsHeader: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  desktopResultsHeader: {
    marginTop: fbSpacing.x4,
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
    lineHeight: 17,
    textAlign: 'right',
    fontFamily: fbFonts.sansRegular,
  },
  reportCard: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x4,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  reportTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x3,
  },
  reportIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  reportTitleCopy: {
    flex: 1,
  },
  reportTitle: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 23,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  reportDescription: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  metaGrid: {
    gap: fbSpacing.x2,
  },
  desktopMetaGrid: {
    flexDirection: 'row',
  },
  metaBox: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.sm,
    backgroundColor: fbColors.paperDeep,
  },
  desktopMetaBox: {
    flex: 1,
  },
  metaLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  metaValue: {
    marginTop: fbSpacing.x1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  calculationPanel: {
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  calculationTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  calculationBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  sectionBlock: {
    gap: fbSpacing.x3,
  },
  factList: {
    gap: fbSpacing.x2,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
  },
  factText: {
    flex: 1,
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  sourceStack: {
    gap: fbSpacing.x2,
  },
  sourceRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
  },
  sourceCheckbox: {
    width: 22,
    height: 22,
    borderRadius: fbRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: fbBorder.selected,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  sourceCheckboxActive: {
    borderColor: fbColors.ink,
    backgroundColor: fbColors.ink,
  },
  sourceIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  sourceCopy: {
    flex: 1,
  },
  sourceTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  sourceMeta: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansRegular,
  },
  moreText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  emptyText: {
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
  notice: {
    marginTop: fbSpacing.x3,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
