import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
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
} from '@/components/ui/fb';
import {
  formatDateLabel,
  getEntryTypeOption,
  useCasePatterns,
  type DetectedCasePattern,
  type DetectedPatternKind,
  type Entry,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type PatternKindFilter = 'all' | DetectedPatternKind;
type PatternStatusFilter = 'active' | 'acknowledged' | 'dismissed' | 'all';
type PatternFilingFilter = 'all' | 'related';

const PATTERN_KIND_LABELS: Record<DetectedPatternKind, string> = {
  late_exchanges: 'Late exchanges',
  denied_visits: 'Denied visits',
  flagged_incidents: 'Flagged entries',
  medical_entries: 'Medical',
  communication_non_response: 'Communication',
  filing_linked_entries: 'Filing-linked',
};

function dateRangeLabel(pattern: DetectedCasePattern) {
  if (!pattern.firstSeenOn || !pattern.lastSeenOn) return 'Date range not available';
  if (pattern.firstSeenOn === pattern.lastSeenOn) return formatDateLabel(pattern.firstSeenOn);
  return `${formatDateLabel(pattern.firstSeenOn)} - ${formatDateLabel(pattern.lastSeenOn)}`;
}

function statusLabel(pattern: DetectedCasePattern) {
  if (pattern.status === 'acknowledged') return 'Acknowledged';
  if (pattern.status === 'dismissed') return 'Dismissed';
  return 'New';
}

function statusTone(pattern: DetectedCasePattern): ChipTone {
  if (pattern.status === 'acknowledged') return 'forest';
  if (pattern.status === 'dismissed') return 'mute';
  return 'amber';
}

function openEntry(entryId: string) {
  router.push({ pathname: '/entry/[id]', params: { id: entryId } } as never);
}

function SourceEntryRow({ entry }: { entry: Entry }) {
  const option = getEntryTypeOption(entry.entry_type);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open source entry: ${entry.title || option.defaultTitle}`}
      onPress={() => openEntry(entry.id)}
      style={({ pressed }) => [styles.sourceRow, pressed && styles.pressed]}
    >
      <View style={styles.sourceIcon}>
        <Icon name={option.icon as IconName} size={14} color={fbColors.ink} />
      </View>
      <View style={styles.sourceCopy}>
        <Text style={styles.sourceTitle}>{entry.title || option.defaultTitle}</Text>
        <Text style={styles.sourceMeta}>
          {formatDateLabel(entry.event_date, entry.event_time)} · {option.shortLabel}
          {entry.is_flagged ? ' · Flagged' : ''}
        </Text>
      </View>
      <Icon name="chevR" size={14} color={fbColors.inkMute} />
    </Pressable>
  );
}

function attachmentCountForEntry(snapshot: ReturnType<typeof useCasePatterns>['snapshot'], entryId: string) {
  return snapshot.evidenceAttachments.filter((attachment) => !attachment.deleted_at && attachment.entry_id === entryId).length;
}

function RelatedFilingLine({ pattern }: { pattern: DetectedCasePattern }) {
  if (!pattern.relatedFilingPackages.length) return null;

  return (
    <View style={styles.relatedLine}>
      <Icon name="folder" size={14} color={fbColors.inkMute} />
      <Text style={styles.relatedText}>
        Related filing package:{' '}
        {pattern.relatedFilingPackages.map((filingPackage) => filingPackage.title).join(', ')}
      </Text>
    </View>
  );
}

function PatternActions({
  pattern,
  onAcknowledge,
  onDismiss,
  onRestore,
}: {
  pattern: DetectedCasePattern;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onRestore: () => void;
}) {
  if (pattern.status === 'dismissed') {
    return (
      <View style={styles.actionRow}>
        <PillButton tone="soft" size="sm" icon="check" onPress={onRestore}>
          Restore
        </PillButton>
      </View>
    );
  }

  return (
    <View style={styles.actionRow}>
      <PillButton
        tone={pattern.status === 'acknowledged' ? 'soft' : 'primary'}
        size="sm"
        icon="check"
        onPress={onAcknowledge}
      >
        {pattern.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
      </PillButton>
      <PillButton tone="ghost" size="sm" icon="x" onPress={onDismiss}>
        Dismiss
      </PillButton>
    </View>
  );
}

function PatternCard({
  pattern,
  expanded,
  onToggleExpanded,
  onAcknowledge,
  onDismiss,
  onRestore,
}: {
  pattern: DetectedCasePattern;
  expanded: boolean;
  onToggleExpanded: () => void;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onRestore: () => void;
}) {
  return (
    <SoftCard p={15} style={styles.patternCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${pattern.title}`}
        onPress={onToggleExpanded}
        style={({ pressed }) => [styles.patternHeader, pressed && styles.pressed]}
      >
        <View style={styles.patternTitleCopy}>
          <View style={styles.patternTitleRow}>
            <Icon name="filter" size={15} color={fbColors.ink} />
            <Text style={styles.patternTitle}>{pattern.title}</Text>
          </View>
          <Text style={styles.patternBody}>{pattern.explanation}</Text>
        </View>
        <View style={styles.statusWrap}>
          <Chip tone={statusTone(pattern)} outline={false}>
            {statusLabel(pattern)}
          </Chip>
          <Icon name={expanded ? 'caretDown' : 'chevR'} size={14} color={fbColors.inkMute} />
        </View>
      </Pressable>

      <View style={styles.patternMetaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{pattern.entryCount}</Text>
          <Text style={styles.metaLabel}>entries</Text>
        </View>
        <View style={styles.metaItemWide}>
          <Text style={styles.metaValue}>{dateRangeLabel(pattern)}</Text>
          <Text style={styles.metaLabel}>date range</Text>
        </View>
      </View>

      <RelatedFilingLine pattern={pattern} />

      {expanded ? (
        <View style={styles.detailBlock}>
          <Text style={styles.sectionLabel}>SUPPORTING ENTRIES</Text>
          {pattern.sourceEntries.map((entry) => (
            <SourceEntryRow key={entry.id} entry={entry} />
          ))}
          <PatternActions
            pattern={pattern}
            onAcknowledge={onAcknowledge}
            onDismiss={onDismiss}
            onRestore={onRestore}
          />
        </View>
      ) : null}
    </SoftCard>
  );
}

function PatternStats({
  activeCount,
  dismissedCount,
  acknowledgedCount,
  compact,
}: {
  activeCount: number;
  dismissedCount: number;
  acknowledgedCount: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.statsGrid, compact && styles.desktopStatsGrid]}>
      <SoftCard p={12} style={[styles.statCard, compact && styles.desktopStatCard]}>
        <Text style={styles.statValue}>{activeCount}</Text>
        <Text style={styles.statLabel}>Active</Text>
      </SoftCard>
      <SoftCard p={12} style={[styles.statCard, compact && styles.desktopStatCard]}>
        <Text style={styles.statValue}>{acknowledgedCount}</Text>
        <Text style={styles.statLabel}>Acknowledged</Text>
      </SoftCard>
      <SoftCard p={12} style={[styles.statCard, compact && styles.desktopStatCard]}>
        <Text style={styles.statValue}>{dismissedCount}</Text>
        <Text style={styles.statLabel}>Dismissed</Text>
      </SoftCard>
    </View>
  );
}

function PatternsContextRail({
  selectedPattern,
  snapshot,
  onOpenEntry,
  activeCount,
  dismissedCount,
  acknowledgedCount,
  totalCount,
  sourceLabel,
}: {
  selectedPattern: DetectedCasePattern | null;
  snapshot: ReturnType<typeof useCasePatterns>['snapshot'];
  onOpenEntry: (entryId: string) => void;
  activeCount: number;
  dismissedCount: number;
  acknowledgedCount: number;
  totalCount: number;
  sourceLabel: string;
}) {
  if (selectedPattern) {
    return (
      <SoftCard p={14} style={styles.railCard}>
        <Text style={styles.sectionLabel}>PATTERN EVIDENCE</Text>
        <Text style={styles.railValue}>{selectedPattern.entryCount} entries</Text>
        <Text style={styles.railText}>{selectedPattern.title}</Text>
        <Rule />
        <Text style={styles.railText}>{selectedPattern.explanation}</Text>
        <Rule />
        <View style={styles.railSection}>
          <Text style={styles.railSectionTitle}>Supporting entries</Text>
          {selectedPattern.sourceEntries.slice(0, 5).map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`Open source entry ${entry.title || getEntryTypeOption(entry.entry_type).defaultTitle}`}
              onPress={() => onOpenEntry(entry.id)}
              style={({ pressed }) => [styles.railEntryRow, pressed && styles.pressed]}
            >
              <Text style={styles.railEntryTitle} numberOfLines={1}>
                {entry.title || getEntryTypeOption(entry.entry_type).defaultTitle}
              </Text>
              <Text style={styles.railEntryMeta}>
                {formatDateLabel(entry.event_date, entry.event_time)} · {attachmentCountForEntry(snapshot, entry.id)} attachments
              </Text>
            </Pressable>
          ))}
        </View>
        <Rule />
        <Text style={styles.railText}>
          Related filing: {selectedPattern.relatedFilingPackages.map((pkg) => pkg.title).join(', ') || 'none'}.
        </Text>
        <PillButton tone="ghost" size="sm" icon="folder" disabled>
          Add/link to filing coming later
        </PillButton>
      </SoftCard>
    );
  }

  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>PATTERN CONTEXT</Text>
      <Text style={styles.railValue}>{activeCount} active</Text>
      <Text style={styles.railText}>
        {totalCount} possible patterns · {acknowledgedCount} acknowledged · {dismissedCount} dismissed.
      </Text>
      <Rule />
      <Text style={styles.railText}>
        Local rule-based grouping only. Source: {sourceLabel}.
      </Text>
    </SoftCard>
  );
}

function DesktopPatternRow({
  pattern,
  selected,
  onSelect,
}: {
  pattern: DetectedCasePattern;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select ${pattern.title}`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.desktopPatternRow,
        selected && styles.desktopPatternRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.desktopPatternMain}>
        <Text style={styles.desktopPatternTitle}>{pattern.title}</Text>
        <Text style={styles.desktopPatternBody} numberOfLines={2}>{pattern.explanation}</Text>
      </View>
      <View style={styles.desktopPatternMeta}>
        <Text style={styles.desktopPatternCount}>{pattern.entryCount}</Text>
        <Text style={styles.desktopPatternMetaText}>{dateRangeLabel(pattern)}</Text>
      </View>
      <Chip tone={statusTone(pattern)} outline={false}>
        {statusLabel(pattern)}
      </Chip>
    </Pressable>
  );
}

export default function Patterns() {
  const {
    snapshot,
    activeCase,
    patterns,
    activePatterns,
    dismissedPatterns,
    acknowledgePattern,
    dismissPattern,
    restorePattern,
    loading,
    source,
    persistence,
  } = useCasePatterns();
  const { isMobile, width } = useResponsive();
  const [expandedPatternIds, setExpandedPatternIds] = useState<string[]>([]);
  const [hasInitializedExpansion, setHasInitializedExpansion] = useState(false);
  const [kindFilter, setKindFilter] = useState<PatternKindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<PatternStatusFilter>('active');
  const [filingFilter, setFilingFilter] = useState<PatternFilingFilter>('all');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const acknowledgedCount = patterns.filter((pattern) => pattern.status === 'acknowledged').length;
  const sourceLabel =
    source === 'local' ? 'Local data' : source === 'supabase' ? 'Supabase read data' : 'Demo data';
  const filteredPatterns = useMemo(
    () =>
      patterns.filter((pattern) => {
        if (kindFilter !== 'all' && pattern.kind !== kindFilter) return false;
        if (statusFilter === 'active' && pattern.status === 'dismissed') return false;
        if (statusFilter === 'acknowledged' && pattern.status !== 'acknowledged') return false;
        if (statusFilter === 'dismissed' && pattern.status !== 'dismissed') return false;
        if (filingFilter === 'related' && !pattern.relatedFilingPackages.length) return false;
        return true;
      }),
    [filingFilter, kindFilter, patterns, statusFilter],
  );
  const selectedPattern =
    filteredPatterns.find((pattern) => pattern.id === selectedPatternId) ?? filteredPatterns[0] ?? null;
  const showDesktopRail = !isMobile && width >= 1280;

  useEffect(() => {
    if (!hasInitializedExpansion && activePatterns[0]) {
      setExpandedPatternIds([activePatterns[0].id]);
      setHasInitializedExpansion(true);
    }
  }, [activePatterns, hasInitializedExpansion]);

  const patternCountsByKind = useMemo(
    () =>
      patterns.reduce<Record<string, number>>((counts, pattern) => {
        counts[pattern.kind] = (counts[pattern.kind] ?? 0) + 1;
        return counts;
      }, {}),
    [patterns],
  );

  function toggleExpanded(patternId: string) {
    setExpandedPatternIds((current) =>
      current.includes(patternId)
        ? current.filter((id) => id !== patternId)
        : [...current, patternId],
    );
  }

  const statsPanel = (
    <PatternStats
      activeCount={activePatterns.length}
      dismissedCount={dismissedPatterns.length}
      acknowledgedCount={acknowledgedCount}
      compact={!isMobile}
    />
  );

  const contextPanel = (
    <SoftCard p={14} style={styles.contextCard}>
      <View style={styles.contextTitleRow}>
        <Icon name="shield" size={15} color={fbColors.ink} />
        <Text style={styles.contextTitle}>Local pattern detection</Text>
      </View>
      <Text style={styles.contextBody}>
        Detection uses only saved local entries, local filing links, and simple text rules. No AI,
        remote sync, legal conclusions, or predictive claims are used.
      </Text>
      <View style={styles.contextChips}>
        <Chip tone={persistence.active ? 'forest' : 'amber'} outline={false}>
          Persistence {persistence.active ? 'active' : 'inactive'}
        </Chip>
        <Chip tone="sand" outline={false}>
          {sourceLabel}
        </Chip>
      </View>
    </SoftCard>
  );

  const desktopFilterPanel = (
    <SoftCard p={14} style={styles.desktopFilterCard}>
      <Text style={styles.sectionLabel}>PATTERN FILTERS</Text>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderTitle}>Date range</Text>
        <Text style={styles.placeholderBody}>Date range selector coming later. Current list uses all local pattern dates.</Text>
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Status</Text>
        {(['active', 'acknowledged', 'dismissed', 'all'] as PatternStatusFilter[]).map((status) => (
          <PillButton
            key={status}
            tone={statusFilter === status ? 'primary' : 'ghost'}
            size="sm"
            icon={statusFilter === status ? 'check' : 'filter'}
            onPress={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : statusLabel({ status } as DetectedCasePattern)}
          </PillButton>
        ))}
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Pattern type</Text>
        <PillButton tone={kindFilter === 'all' ? 'primary' : 'ghost'} size="sm" icon="filter" onPress={() => setKindFilter('all')}>
          All types
        </PillButton>
        {(Object.keys(PATTERN_KIND_LABELS) as DetectedPatternKind[]).map((kind) => (
          <PillButton
            key={kind}
            tone={kindFilter === kind ? 'primary' : 'ghost'}
            size="sm"
            icon={kindFilter === kind ? 'check' : 'filter'}
            onPress={() => setKindFilter(kind)}
          >
            {PATTERN_KIND_LABELS[kind]}
          </PillButton>
        ))}
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Related filing</Text>
        <PillButton tone={filingFilter === 'all' ? 'primary' : 'ghost'} size="sm" icon="folder" onPress={() => setFilingFilter('all')}>
          All possible patterns
        </PillButton>
        <PillButton tone={filingFilter === 'related' ? 'primary' : 'ghost'} size="sm" icon="link" onPress={() => setFilingFilter('related')}>
          Related filing only
        </PillButton>
      </View>
    </SoftCard>
  );

  const activePanel = (
    <>
      <View style={[styles.resultsHeader, !isMobile && styles.desktopResultsHeader]}>
        <Text style={styles.sectionLabel}>ACTIVE POSSIBLE PATTERNS</Text>
        <Text style={styles.resultCount}>{loading ? 'Loading' : `${activePatterns.length} shown`}</Text>
      </View>

      {activePatterns.length ? (
        <View style={styles.patternStack}>
          {activePatterns.map((pattern) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              expanded={expandedPatternIds.includes(pattern.id)}
              onToggleExpanded={() => toggleExpanded(pattern.id)}
              onAcknowledge={() => acknowledgePattern(pattern.id)}
              onDismiss={() => dismissPattern(pattern.id)}
              onRestore={() => restorePattern(pattern.id)}
            />
          ))}
        </View>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No active possible patterns yet</Text>
          <Text style={styles.emptyBody}>
            Pattern cards appear after local entries meet simple grouping rules, such as flagged
            entries, missed parenting time, medical records, or filing-linked entries.
          </Text>
          <PillButton
            tone="primary"
            size="md"
            icon="plus"
            onPress={() => router.push('/capture' as never)}
            style={styles.emptyAction}
          >
            Capture entry
          </PillButton>
        </SoftCard>
      )}
    </>
  );

  const dismissedPanel = dismissedPatterns.length ? (
    <View style={styles.dismissedSection}>
      <View style={styles.resultsHeader}>
        <Text style={styles.sectionLabel}>DISMISSED POSSIBLE PATTERNS</Text>
        <Text style={styles.resultCount}>{dismissedPatterns.length} saved locally</Text>
      </View>
      <View style={styles.patternStack}>
        {dismissedPatterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            expanded={expandedPatternIds.includes(pattern.id)}
            onToggleExpanded={() => toggleExpanded(pattern.id)}
            onAcknowledge={() => acknowledgePattern(pattern.id)}
            onDismiss={() => dismissPattern(pattern.id)}
            onRestore={() => restorePattern(pattern.id)}
          />
        ))}
      </View>
    </View>
  ) : null;

  const desktopPatternList = (
    <>
      <View style={[styles.resultsHeader, styles.desktopResultsHeader]}>
        <Text style={styles.sectionLabel}>POSSIBLE PATTERNS</Text>
        <Text style={styles.resultCount}>{loading ? 'Loading' : `${filteredPatterns.length} shown`}</Text>
      </View>
      {filteredPatterns.length ? (
        <SoftCard p={0} style={styles.desktopPatternTable}>
          {filteredPatterns.map((pattern) => (
            <DesktopPatternRow
              key={pattern.id}
              pattern={pattern}
              selected={selectedPattern?.id === pattern.id}
              onSelect={() => setSelectedPatternId(pattern.id)}
            />
          ))}
        </SoftCard>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No possible patterns match these filters</Text>
          <Text style={styles.emptyBody}>Adjust the filters or capture additional local entries.</Text>
        </SoftCard>
      )}
    </>
  );

  return (
    <CaseScreen
      desktopMaxWidth={1120}
      contentStyle={!isMobile ? styles.patternsDesktopContent : undefined}
      rightRail={
        showDesktopRail ? (
          <PatternsContextRail
            selectedPattern={selectedPattern}
            snapshot={snapshot}
            onOpenEntry={openEntry}
            activeCount={activePatterns.length}
            dismissedCount={dismissedPatterns.length}
            acknowledgedCount={acknowledgedCount}
            totalCount={patterns.length}
            sourceLabel={sourceLabel}
          />
        ) : (
          false
        )
      }
    >
      <View style={styles.header}>
        <Display size={32} style={styles.title}>
          Patterns
        </Display>
        <Text style={styles.subtitle}>
          Local rule-based grouping for {activeCase?.title || 'the current case'}.{' '}
          {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      {isMobile ? (
        <>
          {statsPanel}
          {contextPanel}
          {activePanel}
          {dismissedPanel}
        </>
      ) : (
        <View style={styles.desktopPatternsGrid}>
          <View style={styles.desktopContextColumn}>
            {statsPanel}
            {contextPanel}
            {desktopFilterPanel}
          </View>
          <View style={styles.desktopPatternsColumn}>
            {desktopPatternList}
          </View>
        </View>
      )}

      <Rule style={styles.bottomRule} />
      <Text style={styles.footerNote}>
        Rule coverage: late exchanges {patternCountsByKind.late_exchanges ?? 0}, denied visits{' '}
        {patternCountsByKind.denied_visits ?? 0}, flagged entries{' '}
        {patternCountsByKind.flagged_incidents ?? 0}, medical records{' '}
        {patternCountsByKind.medical_entries ?? 0}, communication placeholders{' '}
        {patternCountsByKind.communication_non_response ?? 0}, filing links{' '}
        {patternCountsByKind.filing_linked_entries ?? 0}.
      </Text>
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
  patternsDesktopContent: {
    paddingHorizontal: fbSpacing.x4,
  },
  statsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    gap: fbSpacing.x2,
  },
  desktopStatsGrid: {
    marginTop: 0,
    flexDirection: 'column',
  },
  statCard: {
    flex: 1,
    gap: fbSpacing.x1,
  },
  desktopStatCard: {
    flex: 0,
  },
  desktopPatternsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x3,
  },
  desktopContextColumn: {
    width: 250,
  },
  desktopPatternsColumn: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  statLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  contextCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x3,
  },
  contextTitleRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  contextTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  contextBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  contextChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  desktopFilterCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x3,
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
  filterGroup: {
    gap: fbSpacing.x2,
  },
  filterLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
  },
  resultsHeader: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  desktopResultsHeader: {
    marginTop: 0,
  },
  sectionLabel: {
    color: fbColors.ox,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  resultCount: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  patternStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  desktopPatternTable: {
    marginTop: fbSpacing.x3,
    overflow: 'hidden',
  },
  desktopPatternRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x3,
    paddingVertical: fbSpacing.x3,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
  },
  desktopPatternRowSelected: {
    backgroundColor: fbColors.oxWash,
    borderLeftWidth: fbBorder.focus,
    borderLeftColor: fbColors.ox,
  },
  desktopPatternMain: {
    flex: 1,
    minWidth: 0,
    gap: fbSpacing.x1,
  },
  desktopPatternTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 20,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  desktopPatternBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  desktopPatternMeta: {
    width: 116,
    gap: fbSpacing.x1,
  },
  desktopPatternCount: {
    color: fbColors.ink,
    fontSize: fbType.h2,
    lineHeight: 22,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  desktopPatternMetaText: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    lineHeight: 14,
    fontFamily: fbFonts.sansRegular,
  },
  patternCard: {
    gap: fbSpacing.x3,
  },
  patternHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  patternTitleCopy: {
    flex: 1,
    gap: fbSpacing.x2,
  },
  patternTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  patternTitle: {
    flex: 1,
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  patternBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  statusWrap: {
    alignItems: 'flex-end',
    gap: fbSpacing.x2,
  },
  patternMetaGrid: {
    flexDirection: 'row',
    gap: fbSpacing.x2,
  },
  metaItem: {
    minWidth: 72,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  metaItemWide: {
    flex: 1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  metaValue: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  metaLabel: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansRegular,
    textTransform: 'uppercase',
  },
  relatedLine: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  relatedText: {
    flex: 1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  detailBlock: {
    gap: fbSpacing.x2,
  },
  sourceRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
    borderTopWidth: fbBorder.hairline,
    borderTopColor: fbColors.ruleSoft,
  },
  sourceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  sourceMeta: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
    paddingTop: fbSpacing.x2,
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
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  emptyAction: {
    marginTop: fbSpacing.x4,
  },
  dismissedSection: {
    marginTop: fbSpacing.x2,
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
  railEntryRow: {
    gap: fbSpacing.x1,
    paddingVertical: fbSpacing.x2,
    borderTopWidth: fbBorder.hairline,
    borderTopColor: fbColors.ruleSoft,
  },
  railEntryTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  railEntryMeta: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    lineHeight: 14,
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
