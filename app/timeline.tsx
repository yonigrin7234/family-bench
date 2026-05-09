import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EntryCard } from '@/components/case-intelligence/EntryCard';
import {
  Chip,
  Display,
  Icon,
  PillButton,
  Segment,
  SoftCard,
  fbAlpha,
  fbBorder,
  fbColors,
  fbFonts,
  fbRadii,
  fbSpacing,
  fbTouch,
  fbType,
  fbWeights,
  type ChipTone,
} from '@/components/ui/fb';
import {
  ENTRY_TYPE_OPTIONS,
  getEntryTypeOption,
  useCaseIntelligenceTimeline,
  type EntryTypeFilterValue,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type FlagFilter = 'all' | 'flagged';

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
      accessibilityLabel={`Filter: ${label}`}
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

function TimelineContextRail({
  visibleCount,
  entriesCount,
  attachmentCount,
  flaggedCount,
  activeFiltersCount,
  sourceLabel,
}: {
  visibleCount: number;
  entriesCount: number;
  attachmentCount: number;
  flaggedCount: number;
  activeFiltersCount: number;
  sourceLabel: string;
}) {
  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>TIMELINE CONTEXT</Text>
      <Text style={styles.railValue}>{visibleCount} shown</Text>
      <Text style={styles.railText}>
        {entriesCount} total entries · {attachmentCount} local source attachments · {flaggedCount} flagged entries.
      </Text>
      <Text style={styles.railText}>
        {activeFiltersCount ? `${activeFiltersCount} filters active` : 'No filters active'}. Source: {sourceLabel}.
      </Text>
    </SoftCard>
  );
}

export default function Timeline() {
  const { snapshot, entries, activeCase, source, loading, filingEntryLinkCounts } =
    useCaseIntelligenceTimeline();
  const { isMobile } = useResponsive();
  const [typeFilter, setTypeFilter] = useState<EntryTypeFilterValue>('all');
  const [flagFilter, setFlagFilter] = useState<FlagFilter>('all');

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (typeFilter !== 'all' && entry.entry_type !== typeFilter) return false;
      if (flagFilter === 'flagged' && !entry.is_flagged) return false;
      return true;
    });
  }, [entries, flagFilter, typeFilter]);

  const sourceLabel =
    source === 'supabase' ? 'Supabase data' : source === 'local' ? 'Local persisted data' : 'Local demo data';
  const attachmentCount = snapshot.evidenceAttachments.filter((attachment) => !attachment.deleted_at).length;
  const flaggedCount = entries.filter((entry) => entry.is_flagged).length;
  const activeFiltersCount = [typeFilter !== 'all', flagFilter !== 'all'].filter(Boolean).length;

  const filterPanel = (
    <SoftCard p={16} style={[styles.filterCard, !isMobile && styles.desktopPanelCard]}>
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleRow}>
          <Icon name="filter" size={16} color={fbColors.ink} />
          <Text style={styles.filterTitle}>Filters</Text>
        </View>
        <PillButton
          tone="accentSoft"
          size="sm"
          icon="plus"
          onPress={() => router.push('/capture' as never)}
        >
          New
        </PillButton>
      </View>

      <Segment<FlagFilter>
        items={[
          { v: 'all', label: 'All' },
          { v: 'flagged', label: 'Flagged' },
        ]}
        value={flagFilter}
        onChange={setFlagFilter}
      />

      <View style={styles.typeFilters}>
        <TypeFilterChip
          value="all"
          active={typeFilter === 'all'}
          onPress={() => setTypeFilter('all')}
        />
        {ENTRY_TYPE_OPTIONS.map((option) => (
          <TypeFilterChip
            key={option.value}
            value={option.value}
            active={typeFilter === option.value}
            onPress={() => setTypeFilter(option.value)}
          />
        ))}
      </View>
    </SoftCard>
  );

  const resultsPanel = (
    <>
      <View style={[styles.resultsHeader, !isMobile && styles.desktopResultsHeader]}>
        <Text style={styles.sectionLabel}>ENTRIES</Text>
        <Text style={styles.resultCount}>
          {loading ? 'Loading' : `${filteredEntries.length} shown`}
        </Text>
      </View>

      {filteredEntries.length ? (
        <View style={styles.entryStack}>
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              attachmentCount={
                snapshot.evidenceAttachments.filter(
                  (attachment) => attachment.entry_id === entry.id && !attachment.deleted_at,
                ).length
              }
              filingLinkCount={filingEntryLinkCounts[entry.id] ?? 0}
              onPress={() => openEntry(entry.id)}
            />
          ))}
        </View>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No entries match these filters</Text>
          <Text style={styles.emptyBody}>
            Clear a filter or capture a new entry for this case.
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

  return (
    <CaseScreen
      desktopMaxWidth={1040}
      rightRail={
        <TimelineContextRail
          visibleCount={filteredEntries.length}
          entriesCount={entries.length}
          attachmentCount={attachmentCount}
          flaggedCount={flaggedCount}
          activeFiltersCount={activeFiltersCount}
          sourceLabel={sourceLabel}
        />
      }
    >
      <View style={styles.header}>
        <Display italic size={32} style={styles.title}>
          Timeline
        </Display>
        <Text style={styles.subtitle}>
          {activeCase?.title || 'Current case'} · {entries.length} entries · {sourceLabel}
        </Text>
      </View>

      {isMobile ? (
        <>
          {filterPanel}
          {resultsPanel}
        </>
      ) : (
        <View style={styles.desktopTimelineGrid}>
          <View style={styles.desktopFilterColumn}>{filterPanel}</View>
          <View style={styles.desktopResultsColumn}>{resultsPanel}</View>
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
  filterCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopPanelCard: {
    marginTop: 0,
  },
  desktopTimelineGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x5,
  },
  desktopFilterColumn: {
    width: 300,
  },
  desktopResultsColumn: {
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
  entryStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
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
  railCard: {
    gap: fbSpacing.x3,
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
