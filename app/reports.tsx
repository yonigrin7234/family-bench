import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  getEntryMetadata,
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

type FlagFilter = ReportPreviewFlagFilter;
type ReportType = ReportPreviewType;

type ReportPreview = {
  id: ReportType;
  title: string;
  description: string;
  icon: IconName;
  entries: Entry[];
  keyFacts: string[];
  placeholder?: string;
};
type AttachmentCountsByEntryId = Record<string, number>;

const REPORT_TYPES: Array<{ value: ReportType; label: string; tone: ChipTone }> = [
  { value: 'timeline', label: 'Timeline summary', tone: 'ink' },
  { value: 'flagged', label: 'Flagged entries', tone: 'ox' },
  { value: 'communication', label: 'Communication', tone: 'sand' },
  { value: 'medical', label: 'Medical', tone: 'forest' },
  { value: 'custodyExchange', label: 'Exchange placeholder', tone: 'amber' },
];

function byEntryDateAsc(a: Entry, b: Entry) {
  const left = `${a.event_date}T${a.event_time ?? '00:00:00'}`;
  const right = `${b.event_date}T${b.event_time ?? '00:00:00'}`;
  return left.localeCompare(right);
}

function titleForEntry(entry: Entry) {
  return entry.title || getEntryTypeOption(entry.entry_type).defaultTitle;
}

function bodyForFact(entry: Entry) {
  return entry.body || entry.court_ready_summary || 'No body text recorded.';
}

function trimFact(value: string, max = 132) {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1).trim()}...`;
}

function distinctTypes(entries: Entry[]) {
  const labels = Array.from(
    new Set(entries.map((entry) => getEntryTypeOption(entry.entry_type).shortLabel)),
  );
  return labels.length ? labels.join(', ') : 'No entry types in this preview';
}

function metadataString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function minutesFromTime(value?: string | null) {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function getExchangeTimes(entry: Entry) {
  const metadata = getEntryMetadata(entry);
  const scheduled =
    metadataString(metadata.scheduled_time) ??
    metadataString(metadata.scheduled_exchange_time) ??
    metadataString(metadata.scheduled_at);
  const actual =
    metadataString(metadata.actual_time) ??
    metadataString(metadata.actual_exchange_time) ??
    entry.event_time;
  const scheduledMinutes = minutesFromTime(scheduled);
  const actualMinutes = minutesFromTime(actual);

  if (scheduledMinutes === null || actualMinutes === null) {
    return { scheduled, actual, lateMinutes: null };
  }

  return {
    scheduled,
    actual,
    lateMinutes: Math.max(0, actualMinutes - scheduledMinutes),
  };
}

function buildCustodyCalculation(entries: Entry[]) {
  const exchangeEntries = entries.filter((entry) =>
    ['pickup_dropoff', 'visit_denied', 'schedule_change'].includes(entry.entry_type),
  );
  const calculatedRows = exchangeEntries
    .map((entry) => ({ entry, ...getExchangeTimes(entry) }))
    .filter((row) => row.lateMinutes !== null);
  const totalLateMinutes = calculatedRows.reduce((total, row) => total + (row.lateMinutes ?? 0), 0);

  return {
    exchangeCount: exchangeEntries.length,
    flaggedExchangeCount: exchangeEntries.filter((entry) => entry.is_flagged).length,
    calculatedRows,
    totalLateMinutes,
    summary:
      calculatedRows.length > 0
        ? `${calculatedRows.length} entries have scheduled/actual time fields. Calculated late minutes total ${totalLateMinutes}.`
        : 'Scheduled-vs-actual calculation placeholder: no entries currently include both scheduled and actual exchange times.',
  };
}

function dateRangeLabel(entries: Entry[]) {
  if (!entries.length) return 'Date range placeholder: no entries in the current preview.';

  const sorted = [...entries].sort(byEntryDateAsc);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (first.event_date === last.event_date) {
    return `Date range placeholder: ${formatDateLabel(first.event_date)}.`;
  }

  return `Date range placeholder: ${formatDateLabel(first.event_date)} to ${formatDateLabel(last.event_date)}.`;
}

function fallbackFacts(entries: Entry[]) {
  if (!entries.length) return ['No matching entries are included in this preview.'];

  return entries.slice(0, 4).map((entry) => {
    const option = getEntryTypeOption(entry.entry_type);
    return `${formatDateLabel(entry.event_date, entry.event_time)} · ${option.shortLabel}: ${trimFact(bodyForFact(entry))}`;
  });
}

function buildReports(entries: Entry[]): Record<ReportType, ReportPreview> {
  const flaggedEntries = entries.filter((entry) => entry.is_flagged);
  const communicationEntries = entries.filter((entry) =>
    ['message', 'schedule_change', 'child_statement'].includes(entry.entry_type),
  );
  const medicalEntries = entries.filter((entry) => entry.entry_type === 'medical');
  const custodyExchangeEntries = entries.filter((entry) =>
    ['pickup_dropoff', 'visit_denied', 'schedule_change'].includes(entry.entry_type),
  );
  const custodyCalculation = buildCustodyCalculation(custodyExchangeEntries);

  return {
    timeline: {
      id: 'timeline',
      title: 'Timeline summary',
      description: 'A factual sequence of the entries currently shown by filters.',
      icon: 'clock',
      entries,
      keyFacts: entries.length
        ? [
            `${entries.length} entries are included in the current preview.`,
            `${flaggedEntries.length} included entries are flagged for review.`,
            `Included entry types: ${distinctTypes(entries)}.`,
            ...fallbackFacts(entries).slice(0, 2),
          ]
        : fallbackFacts(entries),
    },
    flagged: {
      id: 'flagged',
      title: 'Flagged entries report',
      description: 'A list of entries marked for closer review.',
      icon: 'flag',
      entries: flaggedEntries,
      keyFacts: flaggedEntries.length
        ? [
            `${flaggedEntries.length} flagged entries are included.`,
            `Flag categories recorded: ${
              Array.from(new Set(flaggedEntries.map((entry) => entry.flag_category).filter(Boolean))).join(', ') ||
              'not specified'
            }.`,
            ...fallbackFacts(flaggedEntries).slice(0, 3),
          ]
        : ['No flagged entries match the current filters.'],
    },
    communication: {
      id: 'communication',
      title: 'Communication summary',
      description: 'Messages, schedule changes, and child-statement notes from the filtered set.',
      icon: 'chat',
      entries: communicationEntries,
      keyFacts: communicationEntries.length
        ? [
            `${communicationEntries.length} communication-related entries are included.`,
            `Included categories: ${distinctTypes(communicationEntries)}.`,
            ...fallbackFacts(communicationEntries).slice(0, 3),
          ]
        : ['No communication-related entries match the current filters.'],
    },
    medical: {
      id: 'medical',
      title: 'Medical summary',
      description: 'Medical appointments, symptoms, medications, or health notes from entries.',
      icon: 'shield',
      entries: medicalEntries,
      keyFacts: medicalEntries.length
        ? [
            `${medicalEntries.length} medical entries are included.`,
            ...fallbackFacts(medicalEntries).slice(0, 4),
          ]
        : ['No medical entries match the current filters.'],
    },
    custodyExchange: {
      id: 'custodyExchange',
      title: 'Custody/exchange summary placeholder',
      description: 'Exchange, missed-time, and schedule-change entries grouped for later drafting.',
      icon: 'home',
      entries: custodyExchangeEntries,
      keyFacts: custodyExchangeEntries.length
        ? [
            `${custodyExchangeEntries.length} custody or exchange entries are included.`,
            `${custodyCalculation.flaggedExchangeCount} included exchange entries are flagged.`,
            custodyCalculation.summary,
            `Included categories: ${distinctTypes(custodyExchangeEntries)}.`,
            ...fallbackFacts(custodyExchangeEntries).slice(0, 3),
          ]
        : ['No custody or exchange entries match the current filters.'],
      placeholder: 'This is a preview grouping only. Court PDF drafting comes later.',
    },
  };
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
}: {
  report: ReportPreview;
  attachmentCountsByEntryId: AttachmentCountsByEntryId;
  filingLinkCount: number;
  dense?: boolean;
  selectable?: boolean;
  selectedEntryIds?: Set<string>;
  onToggleEntry?: (entryId: string) => void;
}) {
  const references = report.entries.slice(0, 6);
  const attachmentCount = report.entries.reduce(
    (total, entry) => total + (attachmentCountsByEntryId[entry.id] ?? 0),
    0,
  );
  const custodyCalculation = report.id === 'custodyExchange' ? buildCustodyCalculation(report.entries) : null;

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
          <Text style={styles.metaValue}>{dateRangeLabel(report.entries)}</Text>
        </View>
        <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
          <Text style={styles.metaLabel}>INCLUDED ENTRIES</Text>
          <Text style={styles.metaValue}>{report.entries.length} entries</Text>
        </View>
        <View style={[styles.metaBox, dense && styles.desktopMetaBox]}>
          <Text style={styles.metaLabel}>SOURCE ATTACHMENTS</Text>
          <Text style={styles.metaValue}>
            {attachmentCount
              ? `${attachmentCount} local attachment metadata records`
              : 'No attachment metadata in this preview'}
          </Text>
        </View>
      </View>

      {report.placeholder ? (
        <InfoCallout title="Placeholder" tone="ink">
          {report.placeholder}
        </InfoCallout>
      ) : null}

      {custodyCalculation ? (
        <View style={styles.calculationPanel}>
          <View style={styles.calculationHeader}>
            <Icon name="clock" size={15} color={fbColors.ink} />
            <Text style={styles.calculationTitle}>Custody calculation foundation</Text>
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
                  : 'Placeholder until scheduled and actual times exist'}
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

      <PillButton tone="ghost" size="md" icon="doc" disabled full>
        Export PDF coming later
      </PillButton>
      <PillButton
        tone="soft"
        size="md"
        icon="doc"
        full
        onPress={() => router.push({ pathname: '/export-prep', params: { mode: 'report' } } as never)}
      >
        Preview report export data
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
  onToggleReportFiling: (packageId: string) => void;
}) {
  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>REPORT CONTEXT</Text>
      <Text style={styles.railValue}>{report.entries.length} entries</Text>
      <Text style={styles.railText}>{report.title}</Text>
      <Rule />
      <PillButton tone="primary" size="sm" icon="check" onPress={onSaveReport}>
        Save report version
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
        <Text style={styles.railSectionTitle}>Add to filing package</Text>
        {filingPackages.length ? (
          filingPackages.slice(0, 4).map((filingPackage) => (
            <PillButton
              key={filingPackage.id}
              tone="ghost"
              size="sm"
              icon={filingLinkCount ? 'check' : 'plus'}
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
        {attachmentCount} local attachment references · {filingLinkCount ? 'linked to a filing package' : 'not linked to a filing package'}.
      </Text>
      <Text style={styles.railText}>
        Persistence {persistenceActive ? 'active' : 'inactive'}. Source: {sourceLabel}.
      </Text>
    </SoftCard>
  );
}

export default function Reports() {
  const { snapshot, entries, activeCase, source, loading, persistence } = useCaseIntelligenceTimeline();
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
  const [excludedEntryIds, setExcludedEntryIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const reportType = reportPreviewState.reportType;
  const typeFilter = reportPreviewState.typeFilter;
  const flagFilter = reportPreviewState.flagFilter;

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.entry_type !== typeFilter) return false;
      if (flagFilter === 'flagged' && !entry.is_flagged) return false;
      if (childFilter !== 'all' && entry.child_id !== childFilter) return false;
      return true;
    });
  }, [childFilter, entries, flagFilter, typeFilter]);

  const reports = useMemo(() => buildReports(filteredEntries), [filteredEntries]);
  const activeSourceReport = reports[reportType];
  const includedEntries = activeSourceReport.entries.filter((entry) => !excludedEntryIds.includes(entry.id));
  const activeReport = buildReports(includedEntries)[reportType];
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
      if (!attachment.entry_id || attachment.deleted_at) return counts;
      counts[attachment.entry_id] = (counts[attachment.entry_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [snapshot.evidenceAttachments]);
  const activeReportAttachmentCount = activeReport.entries.reduce(
    (total, entry) => total + (attachmentCountsByEntryId[entry.id] ?? 0),
    0,
  );
  const activeReportFilingLinkCount = filingReportLinkCounts[activeReport.id] ?? 0;
  const showDesktopRail = !isMobile && width >= 1280;
  const sourceLabel =
    source === 'supabase' ? 'Supabase data' : source === 'local' ? 'Local persisted data' : 'Local demo data';

  function toggleIncludedEntry(entryId: string) {
    setNotice(null);
    setExcludedEntryIds((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId],
    );
  }

  function saveCurrentReport() {
    const saved = saveReportVersion({
      reportType,
      title: `${activeReport.title} - ${new Date().toISOString().slice(0, 10)}`,
      includedEntryIds: activeReport.entries.map((entry) => entry.id),
      filters: {
        typeFilter,
        flagFilter,
        childFilter: childFilter === 'all' ? null : childFilter,
        dateRangeLabel: dateRangeLabel(activeReport.entries),
      },
    });
    setNotice(`${saved.title} was saved locally.`);
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

      <View style={styles.typeFilters}>
        {REPORT_TYPES.map((option) => (
          <ReportTypeChip
            key={option.value}
            value={option.value}
            label={option.label}
            tone={option.tone}
            active={reportType === option.value}
            filingLinkCount={filingReportLinkCounts[option.value] ?? 0}
            onPress={() => setReportPreviewState({ reportType: option.value })}
          />
        ))}
      </View>

      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderTitle}>Date range</Text>
        <Text style={styles.placeholderBody}>Date range selector coming later. Current preview uses matching saved entries.</Text>
      </View>

      <Segment<FlagFilter>
        items={[
          { v: 'all', label: 'All' },
          { v: 'flagged', label: 'Flagged' },
        ]}
        value={flagFilter}
        onChange={(value) => setReportPreviewState({ flagFilter: value })}
      />

      <View style={styles.typeFilters}>
        <Text style={styles.filterSubhead}>Entry type</Text>
        <TypeFilterChip
          value="all"
          active={typeFilter === 'all'}
          onPress={() => setReportPreviewState({ typeFilter: 'all' })}
        />
        {ENTRY_TYPE_OPTIONS.map((option) => (
          <TypeFilterChip
            key={option.value}
            value={option.value}
            active={typeFilter === option.value}
            onPress={() => setReportPreviewState({ typeFilter: option.value })}
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
            onPress={() => setChildFilter('all')}
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
              onPress={() => setChildFilter(child.id)}
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
        These previews use existing local or synced entries only. They do not generate AI analysis, legal advice, uploads, database changes, or court PDFs. Local persistence is {persistence.active ? 'active' : 'inactive'}.
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
        selectable={!isMobile}
        selectedEntryIds={selectedEntryIds}
        onToggleEntry={toggleIncludedEntry}
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
            onSaveReport={saveCurrentReport}
            onToggleReportFiling={(packageId) => toggleFilingPackageReport(packageId, activeReport.id)}
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
      </View>

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
