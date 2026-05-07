import { useMemo } from 'react';
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
  getEntryTypeOption,
  useCaseIntelligenceTimeline,
  useReportPreviewState,
  type Entry,
  type EntryTypeFilterValue,
  type ReportPreviewFlagFilter,
  type ReportPreviewType,
} from '@/lib/case-intelligence';

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
  onPress,
}: {
  value: ReportType;
  label: string;
  tone: ChipTone;
  active: boolean;
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
        {label}
      </Chip>
    </Pressable>
  );
}

function SourceEntryRow({
  entry,
  attachmentCount,
}: {
  entry: Entry;
  attachmentCount: number;
}) {
  const option = getEntryTypeOption(entry.entry_type);
  const attachmentLabel =
    attachmentCount > 0
      ? ` · ${attachmentCount === 1 ? '1 attachment' : `${attachmentCount} attachments`}`
      : '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open source entry: ${titleForEntry(entry)}`}
      onPress={() => openEntry(entry.id)}
      style={({ pressed }) => [styles.sourceRow, pressed && styles.pressed]}
    >
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
    </Pressable>
  );
}

function ReportPreviewCard({
  report,
  attachmentCountsByEntryId,
}: {
  report: ReportPreview;
  attachmentCountsByEntryId: AttachmentCountsByEntryId;
}) {
  const references = report.entries.slice(0, 6);
  const attachmentCount = report.entries.reduce(
    (total, entry) => total + (attachmentCountsByEntryId[entry.id] ?? 0),
    0,
  );

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
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>DATE RANGE</Text>
          <Text style={styles.metaValue}>{dateRangeLabel(report.entries)}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>INCLUDED ENTRIES</Text>
          <Text style={styles.metaValue}>{report.entries.length} entries</Text>
        </View>
        <View style={styles.metaBox}>
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
    </SoftCard>
  );
}

export default function Reports() {
  const { snapshot, entries, activeCase, source, loading, persistence } = useCaseIntelligenceTimeline();
  const { reportPreviewState, setReportPreviewState } = useReportPreviewState();
  const reportType = reportPreviewState.reportType;
  const typeFilter = reportPreviewState.typeFilter;
  const flagFilter = reportPreviewState.flagFilter;

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.entry_type !== typeFilter) return false;
      if (flagFilter === 'flagged' && !entry.is_flagged) return false;
      return true;
    });
  }, [entries, flagFilter, typeFilter]);

  const reports = useMemo(() => buildReports(filteredEntries), [filteredEntries]);
  const activeReport = reports[reportType];
  const attachmentCountsByEntryId = useMemo(() => {
    return snapshot.evidenceAttachments.reduce<AttachmentCountsByEntryId>((counts, attachment) => {
      if (!attachment.entry_id || attachment.deleted_at) return counts;
      counts[attachment.entry_id] = (counts[attachment.entry_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [snapshot.evidenceAttachments]);

  return (
    <CaseScreen>
      <View style={styles.header}>
        <Display italic size={32} style={styles.title}>
          Reports
        </Display>
        <Text style={styles.subtitle}>
          Factual previews from saved entries. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={16} style={styles.filterCard}>
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
              onPress={() => setReportPreviewState({ reportType: option.value })}
            />
          ))}
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
      </SoftCard>

      <InfoCallout title="Report limits" tone="ink">
        These previews use existing local or synced entries only. They do not generate AI analysis, legal advice, uploads, database changes, or court PDFs. Local persistence is {persistence.active ? 'active' : 'inactive'}.
      </InfoCallout>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionLabel}>REPORT PREVIEW</Text>
        <Text style={styles.resultCount}>
          {activeCase?.title || 'Current case'} · {source === 'supabase' ? 'Supabase data' : source === 'local' ? 'Local persisted data' : 'Local demo data'}
        </Text>
      </View>

      <ReportPreviewCard
        report={activeReport}
        attachmentCountsByEntryId={attachmentCountsByEntryId}
      />
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
  filterCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
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
  metaBox: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.sm,
    backgroundColor: fbColors.paperDeep,
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
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
