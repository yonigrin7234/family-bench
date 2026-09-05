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
  formatDateLabel,
  getEntryTypeOption,
  isEntryReviewed,
  useCaseIntelligenceTimeline,
  type Child,
  type Entry,
  type EntryTypeFilterValue,
  type EvidenceAttachment,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type FlagFilter = 'all' | 'flagged';
type FilingFilter = 'all' | 'linked';
type AttachmentFilter = 'all' | 'with_attachments' | 'voice_memos';
type TimelineRow = {
  entry: Entry;
  attachments: EvidenceAttachment[];
  attachmentCount: number;
  voiceMemoCount: number;
  filingLinkCount: number;
};

function openEntry(entryId: string) {
  router.push({ pathname: '/entry/[id]', params: { id: entryId } } as never);
}

function compactText(value: string | null | undefined, fallback = 'No body text recorded') {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  return normalized || fallback;
}

function entryTimestamp(entry: Entry) {
  return `${entry.event_date}T${entry.event_time ?? '00:00:00'}`;
}

function isVoiceMemoAttachment(attachment: EvidenceAttachment) {
  if (attachment.mime_type?.startsWith('audio/')) return true;
  if (attachment.file_type === 'voice_memo') return true;
  if (attachment.exif && typeof attachment.exif === 'object' && !Array.isArray(attachment.exif)) {
    return attachment.exif.attachment_kind === 'voice_memo';
  }
  return false;
}

function buildAttachmentsByEntryId(attachments: EvidenceAttachment[]) {
  return attachments.reduce<Record<string, EvidenceAttachment[]>>((acc, attachment) => {
    if (!attachment.entry_id || attachment.deleted_at) return acc;
    acc[attachment.entry_id] = [...(acc[attachment.entry_id] ?? []), attachment];
    return acc;
  }, {});
}

function groupRowsByDate(rows: TimelineRow[]) {
  return rows.reduce<Array<{ date: string; label: string; rows: TimelineRow[] }>>((groups, row) => {
    const last = groups[groups.length - 1];
    if (last?.date === row.entry.event_date) {
      last.rows.push(row);
      return groups;
    }
    groups.push({
      date: row.entry.event_date,
      label: formatDateLabel(row.entry.event_date),
      rows: [row],
    });
    return groups;
  }, []);
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

function TimelineInspector({
  selectedRow,
  visibleCount,
  entriesCount,
  attachmentCount,
  flaggedCount,
  activeFiltersCount,
  sourceLabel,
  childrenById,
}: {
  selectedRow: TimelineRow | null;
  visibleCount: number;
  entriesCount: number;
  attachmentCount: number;
  flaggedCount: number;
  activeFiltersCount: number;
  sourceLabel: string;
  childrenById: Record<string, Child>;
}) {
  if (!selectedRow) {
    return (
      <SoftCard p={14} style={styles.railCard}>
        <Text style={styles.sectionLabel}>EVENT INSPECTOR</Text>
        <Text style={styles.railValue}>No event selected</Text>
        <Text style={styles.railText}>
          Select a timeline row to inspect local source details without leaving this screen.
        </Text>
        <Text style={styles.railText}>
          {visibleCount} shown · {activeFiltersCount ? `${activeFiltersCount} filters active` : 'No filters active'}.
        </Text>
      </SoftCard>
    );
  }

  const { entry, attachments, filingLinkCount, voiceMemoCount } = selectedRow;
  const option = getEntryTypeOption(entry.entry_type);
  const childName = entry.child_id ? childrenById[entry.child_id]?.name : null;
  const reviewed = isEntryReviewed(entry);
  const hasCourtReadySummary = Boolean(entry.court_ready_summary?.trim());
  const hasPrivateNotes = Boolean(entry.private_notes?.trim());

  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>EVENT INSPECTOR</Text>
      <View style={styles.inspectorChipRow}>
        <Chip tone={option.tone as ChipTone} outline={false}>
          {option.shortLabel}
        </Chip>
        {entry.is_flagged ? (
          <Chip tone="ox" outline={false}>
            {entry.flag_severity || 'Flagged'}
          </Chip>
        ) : null}
      </View>
      <Text style={styles.railValue} numberOfLines={3}>
        {entry.title || compactText(entry.body)}
      </Text>
      <Text style={styles.railText}>
        {formatDateLabel(entry.event_date, entry.event_time)}
        {childName ? ` · ${childName}` : ''}
      </Text>
      <View style={styles.railRule} />

      <View style={styles.inspectorMetaStack}>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Review</Text>
          <Text style={styles.inspectorMetaValue}>{reviewed ? 'Reviewed' : 'Needs review'}</Text>
        </View>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Attachments</Text>
          <Text style={styles.inspectorMetaValue}>{attachments.length}</Text>
        </View>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Voice memos</Text>
          <Text style={styles.inspectorMetaValue}>{voiceMemoCount}</Text>
        </View>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Filing links</Text>
          <Text style={styles.inspectorMetaValue}>{filingLinkCount || 'None'}</Text>
        </View>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Court-ready</Text>
          <Text style={styles.inspectorMetaValue}>{hasCourtReadySummary ? 'Summary saved' : 'No summary'}</Text>
        </View>
        <View style={styles.inspectorMetaRow}>
          <Text style={styles.inspectorMetaLabel}>Private notes</Text>
          <Text style={styles.inspectorMetaValue}>{hasPrivateNotes ? 'Notes saved' : 'No notes'}</Text>
        </View>
      </View>

      <View style={styles.railRule} />
      <View style={styles.inspectorSection}>
        <Text style={styles.inspectorSectionTitle}>Event detail</Text>
        <Text style={styles.inspectorBody} numberOfLines={6}>
          {compactText(entry.body)}
        </Text>
      </View>

      <View style={styles.inspectorSection}>
        <Text style={styles.inspectorSectionTitle}>Linked attachments</Text>
        {attachments.length ? (
          <View style={styles.inspectorAttachmentStack}>
            {attachments.slice(0, 4).map((attachment) => (
              <Text key={attachment.id} style={styles.inspectorAttachmentText} numberOfLines={1}>
                {attachment.file_name}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.railText}>No local attachment metadata linked to this event.</Text>
        )}
      </View>

      <View style={styles.inspectorSection}>
        <Text style={styles.inspectorSectionTitle}>Related pattern</Text>
        <Text style={styles.railText}>
          Possible pattern references are local placeholders. Pattern review is available on the Patterns route.
        </Text>
      </View>

      <PillButton tone="primary" size="sm" icon="eye" onPress={() => openEntry(entry.id)}>
        Open full entry
      </PillButton>

      <View style={styles.railRule} />
      <Text style={styles.railText}>
        {entriesCount} total entries · {attachmentCount} local source attachments · {flaggedCount} flagged. Source: {sourceLabel}.
      </Text>
    </SoftCard>
  );
}

function CountLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.countLine}>
      <Text style={styles.countLabel}>{label}</Text>
      <Text style={styles.countValue}>{value}</Text>
    </View>
  );
}

function DesktopTimelineRow({
  row,
  childName,
  selected,
  onSelect,
}: {
  row: TimelineRow;
  childName?: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const option = getEntryTypeOption(row.entry.entry_type);
  const reviewed = isEntryReviewed(row.entry);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select timeline event ${option.shortLabel} from ${formatDateLabel(row.entry.event_date, row.entry.event_time)}`}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.desktopRow,
        selected && styles.desktopRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.desktopCell, styles.desktopTimeCell]}>
        <Text style={styles.desktopTimeText}>{row.entry.event_time?.slice(0, 5) || 'All day'}</Text>
        <Text style={styles.desktopCellSubtext}>{childName || 'Case'}</Text>
      </View>
      <View style={[styles.desktopCell, styles.desktopTypeCell]}>
        <Chip tone={option.tone as ChipTone} outline={!selected}>
          {option.shortLabel}
        </Chip>
      </View>
      <View style={[styles.desktopCell, styles.desktopSummaryCell]}>
        <Text style={styles.desktopSummaryText} numberOfLines={2}>
          {row.entry.title || compactText(row.entry.body)}
        </Text>
        <Text style={styles.desktopCellSubtext} numberOfLines={1}>
          {reviewed ? 'Reviewed' : 'Needs review'}
        </Text>
      </View>
      <View style={[styles.desktopCell, styles.desktopFlagCell]}>
        {row.entry.is_flagged ? (
          <Chip tone="ox" outline={false}>
            {row.entry.flag_severity || 'Flag'}
          </Chip>
        ) : (
          <Text style={styles.desktopMutedText}>No flag</Text>
        )}
      </View>
      <View style={[styles.desktopCell, styles.desktopCountCell]}>
        <Text style={styles.desktopCountText}>{row.attachmentCount}</Text>
        <Text style={styles.desktopCellSubtext}>files</Text>
      </View>
      <View style={[styles.desktopCell, styles.desktopCountCell]}>
        <Text style={styles.desktopCountText}>{row.filingLinkCount}</Text>
        <Text style={styles.desktopCellSubtext}>links</Text>
      </View>
      <View style={[styles.desktopCell, styles.desktopStatusCell]}>
        <Text style={styles.desktopSourceText}>{row.voiceMemoCount ? 'Voice memo' : 'Text source'}</Text>
      </View>
    </Pressable>
  );
}

export default function Timeline() {
  const { snapshot, entries, activeCase, source, loading, filingEntryLinkCounts } =
    useCaseIntelligenceTimeline();
  const { isMobile, width } = useResponsive();
  const [typeFilter, setTypeFilter] = useState<EntryTypeFilterValue>('all');
  const [flagFilter, setFlagFilter] = useState<FlagFilter>('all');
  const [filingFilter, setFilingFilter] = useState<FilingFilter>('all');
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const attachmentsByEntryId = useMemo(
    () => buildAttachmentsByEntryId(snapshot.evidenceAttachments),
    [snapshot.evidenceAttachments],
  );
  const childrenById = useMemo(
    () =>
      snapshot.children.reduce<Record<string, Child>>((acc, child) => {
        if (!child.deleted_at) acc[child.id] = child;
        return acc;
      }, {}),
    [snapshot.children],
  );

  const rows = useMemo(() => {
    return entries
      .map((entry) => {
        const attachments = attachmentsByEntryId[entry.id] ?? [];
        const voiceMemoCount = attachments.filter(isVoiceMemoAttachment).length;
        return {
          entry,
          attachments,
          attachmentCount: attachments.length,
          voiceMemoCount,
          filingLinkCount: filingEntryLinkCounts[entry.id] ?? 0,
        };
      })
      .filter((row) => {
        if (typeFilter !== 'all' && row.entry.entry_type !== typeFilter) return false;
        if (flagFilter === 'flagged' && !row.entry.is_flagged) return false;
        if (filingFilter === 'linked' && !row.filingLinkCount) return false;
        if (attachmentFilter === 'with_attachments' && !row.attachmentCount) return false;
        if (attachmentFilter === 'voice_memos' && !row.voiceMemoCount) return false;
        return true;
      });
  }, [
    attachmentFilter,
    attachmentsByEntryId,
    entries,
    filingEntryLinkCounts,
    filingFilter,
    flagFilter,
    typeFilter,
  ]);
  const filteredEntries = rows.map((row) => row.entry);
  const groupedRows = useMemo(() => groupRowsByDate(rows), [rows]);

  const sourceLabel =
    source === 'supabase' ? 'Account records' : source === 'local' ? 'Saved on this device' : 'Demo records';
  const attachmentCount = snapshot.evidenceAttachments.filter((attachment) => !attachment.deleted_at).length;
  const voiceMemoCount = snapshot.evidenceAttachments.filter(
    (attachment) => !attachment.deleted_at && isVoiceMemoAttachment(attachment),
  ).length;
  const flaggedCount = entries.filter((entry) => entry.is_flagged).length;
  const linkedCount = entries.filter((entry) => (filingEntryLinkCounts[entry.id] ?? 0) > 0).length;
  const activeFiltersCount = [
    typeFilter !== 'all',
    flagFilter !== 'all',
    filingFilter !== 'all',
    attachmentFilter !== 'all',
  ].filter(Boolean).length;
  const selectedRow = rows.find((row) => row.entry.id === selectedEntryId) ?? rows[0] ?? null;
  const showDesktopInspector = !isMobile && width >= 1280;

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

  const desktopFilterPanel = (
    <SoftCard p={16} style={[styles.filterCard, styles.desktopPanelCard]}>
      <View style={styles.filterHeader}>
        <View style={styles.filterTitleRow}>
          <Icon name="filter" size={16} color={fbColors.ink} />
          <Text style={styles.filterTitle}>Timeline filters</Text>
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

      <View style={styles.placeholderBlock}>
        <Text style={styles.placeholderLabel}>Date range</Text>
        <Text style={styles.placeholderText}>Range selector coming later</Text>
      </View>

      <View style={styles.segmentBlock}>
        <Text style={styles.filterLabel}>Flags</Text>
        <Segment<FlagFilter>
          items={[
            { v: 'all', label: 'All' },
            { v: 'flagged', label: 'Flagged' },
          ]}
          value={flagFilter}
          onChange={setFlagFilter}
        />
      </View>

      <View style={styles.segmentBlock}>
        <Text style={styles.filterLabel}>Filing links</Text>
        <Segment<FilingFilter>
          items={[
            { v: 'all', label: 'All' },
            { v: 'linked', label: 'Linked' },
          ]}
          value={filingFilter}
          onChange={setFilingFilter}
        />
      </View>

      <View style={styles.segmentBlock}>
        <Text style={styles.filterLabel}>Attachments</Text>
        <Segment<AttachmentFilter>
          items={[
            { v: 'all', label: 'All' },
            { v: 'with_attachments', label: 'With files' },
            { v: 'voice_memos', label: 'Voice' },
          ]}
          value={attachmentFilter}
          onChange={setAttachmentFilter}
        />
      </View>

      <View style={styles.typeFilters}>
        <Text style={styles.filterLabel}>Entry type</Text>
        <View style={styles.typeFilterWrap}>
          <TypeFilterChip value="all" active={typeFilter === 'all'} onPress={() => setTypeFilter('all')} />
          {ENTRY_TYPE_OPTIONS.map((option) => (
            <TypeFilterChip
              key={option.value}
              value={option.value}
              active={typeFilter === option.value}
              onPress={() => setTypeFilter(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.countsCard}>
        <CountLine label="Entries" value={entries.length} />
        <CountLine label="Flagged" value={flaggedCount} />
        <CountLine label="Attachments" value={attachmentCount} />
        <CountLine label="Voice memos" value={voiceMemoCount} />
        <CountLine label="Filing-linked" value={linkedCount} />
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

  const desktopResultsPanel = (
    <>
      <View style={[styles.resultsHeader, styles.desktopResultsHeader]}>
        <View>
          <Text style={styles.sectionLabel}>CHRONOLOGY</Text>
          <Text style={styles.desktopHeaderHint}>Rows are grouped by event date for fast case review.</Text>
        </View>
        <Text style={styles.resultCount}>
          {loading ? 'Loading' : `${rows.length} shown`}
        </Text>
      </View>

      {rows.length ? (
        <View style={styles.desktopGroupStack}>
          {groupedRows.map((group) => (
            <SoftCard key={group.date} p={0} style={styles.desktopGroupCard}>
              <View style={styles.desktopGroupHeader}>
                <Text style={styles.desktopGroupDate}>{group.label}</Text>
                <Text style={styles.desktopGroupCount}>{group.rows.length} events</Text>
              </View>
              {group.rows.map((row) => (
                <DesktopTimelineRow
                  key={row.entry.id}
                  row={row}
                  childName={row.entry.child_id ? childrenById[row.entry.child_id]?.name : null}
                  selected={selectedRow?.entry.id === row.entry.id}
                  onSelect={() => setSelectedEntryId(row.entry.id)}
                />
              ))}
            </SoftCard>
          ))}
        </View>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No timeline events match these filters</Text>
          <Text style={styles.emptyBody}>
            Adjust filters or capture a new entry for this case.
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
      contentStyle={!isMobile ? styles.timelineDesktopContent : undefined}
      rightRail={
        showDesktopInspector ? (
          <TimelineInspector
            selectedRow={selectedRow}
            visibleCount={filteredEntries.length}
            entriesCount={entries.length}
            attachmentCount={attachmentCount}
            flaggedCount={flaggedCount}
            activeFiltersCount={activeFiltersCount}
            sourceLabel={sourceLabel}
            childrenById={childrenById}
          />
        ) : (
          false
        )
      }
    >
      <View style={styles.header}>
        <Display size={32} style={styles.title}>
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
          <View style={styles.desktopFilterColumn}>{desktopFilterPanel}</View>
          <View style={styles.desktopResultsColumn}>{desktopResultsPanel}</View>
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
  timelineDesktopContent: {
    paddingHorizontal: fbSpacing.x4,
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
    gap: fbSpacing.x3,
  },
  desktopFilterColumn: {
    width: 230,
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
    gap: fbSpacing.x2,
  },
  typeFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  segmentBlock: {
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
  placeholderBlock: {
    gap: fbSpacing.x1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  placeholderLabel: {
    color: fbColors.ink,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  placeholderText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  countsCard: {
    gap: fbSpacing.x2,
    paddingTop: fbSpacing.x2,
    borderTopWidth: fbBorder.hairline,
    borderTopColor: fbColors.rule,
  },
  countLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  countLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  countValue: {
    color: fbColors.ink,
    fontSize: fbType.small,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
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
  desktopHeaderHint: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
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
  desktopGroupStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  desktopGroupCard: {
    overflow: 'hidden',
  },
  desktopGroupHeader: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x3,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
  },
  desktopGroupDate: {
    color: fbColors.ink,
    fontSize: fbType.small,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  desktopGroupCount: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  desktopRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x1,
    paddingHorizontal: fbSpacing.x2,
    paddingVertical: fbSpacing.x3,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
  },
  desktopRowSelected: {
    backgroundColor: fbColors.oxWash,
    borderLeftWidth: fbBorder.focus,
    borderLeftColor: fbColors.ox,
  },
  desktopCell: {
    minWidth: 0,
    gap: fbSpacing.x1,
  },
  desktopTimeCell: {
    width: 68,
  },
  desktopTypeCell: {
    width: 72,
  },
  desktopSummaryCell: {
    flex: 1,
    minWidth: 0,
  },
  desktopFlagCell: {
    width: 54,
  },
  desktopCountCell: {
    width: 36,
    alignItems: 'flex-start',
  },
  desktopStatusCell: {
    width: 66,
  },
  desktopTimeText: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  desktopSummaryText: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 19,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  desktopCellSubtext: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    lineHeight: 14,
    fontFamily: fbFonts.sansRegular,
  },
  desktopMutedText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  desktopCountText: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 18,
    fontFamily: fbFonts.monoMedium,
    fontWeight: fbWeights.medium,
  },
  desktopSourceText: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansRegular,
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
  inspectorChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
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
  railRule: {
    height: fbBorder.hairline,
    backgroundColor: fbColors.rule,
  },
  inspectorMetaStack: {
    gap: fbSpacing.x2,
  },
  inspectorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  inspectorMetaLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  inspectorMetaValue: {
    flexShrink: 1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  inspectorSection: {
    gap: fbSpacing.x2,
  },
  inspectorSectionTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  inspectorBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  inspectorAttachmentStack: {
    gap: fbSpacing.x1,
  },
  inspectorAttachmentText: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
