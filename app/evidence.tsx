import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EntryCard } from '@/components/case-intelligence/EntryCard';
import {
  Chip,
  Display,
  Icon,
  PillButton,
  Rule,
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
  type IconName,
} from '@/components/ui/fb';
import {
  ENTRY_TYPE_OPTIONS,
  formatDateLabel,
  getEntryTypeOption,
  useCaseEvidence,
  type AttachmentKind,
  type Child,
  type Entry,
  type EntryTypeFilterValue,
  type EvidenceAttachment,
} from '@/lib/case-intelligence';

type FlagFilter = 'all' | 'flagged';
type AttachmentFilter = 'all' | AttachmentKind;
type SortMode = 'newest' | 'oldest' | 'flagged';
type EvidenceRow = {
  entry: Entry;
  attachments: EvidenceAttachment[];
  attachmentCount: number;
};

const ATTACHMENT_FILTERS: Array<{
  value: AttachmentFilter;
  label: string;
  tone: ChipTone;
  icon: IconName;
}> = [
  { value: 'all', label: 'All evidence', tone: 'ink', icon: 'paperclip' },
  { value: 'photo', label: 'Photos', tone: 'forest', icon: 'camera' },
  { value: 'document', label: 'Documents', tone: 'sand', icon: 'doc' },
  { value: 'voice_memo', label: 'Voice memos', tone: 'amber', icon: 'mic' },
  { value: 'screenshot', label: 'Screenshots', tone: 'mute', icon: 'camera' },
];

function openEntry(entryId: string) {
  router.push({ pathname: '/entry/[id]', params: { id: entryId } } as never);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(value: string | null | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query));
}

function attachmentMeta(attachment: EvidenceAttachment): Record<string, unknown> {
  const exif = attachment.exif;
  if (!exif || typeof exif !== 'object' || Array.isArray(exif)) return {};
  return exif as Record<string, unknown>;
}

function stringMeta(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function numberMeta(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isAttachmentKind(value: string | null | undefined): value is AttachmentKind {
  return value === 'photo' || value === 'document' || value === 'voice_memo' || value === 'screenshot';
}

function getAttachmentKind(attachment: EvidenceAttachment): AttachmentKind {
  const metaKind = stringMeta(attachmentMeta(attachment).attachment_kind);
  if (isAttachmentKind(metaKind)) return metaKind;
  if (isAttachmentKind(attachment.file_type)) return attachment.file_type;
  if (attachment.mime_type?.startsWith('audio/')) return 'voice_memo';
  if (attachment.mime_type?.startsWith('image/')) return 'photo';
  return 'document';
}

function attachmentKindLabel(kind: AttachmentKind) {
  if (kind === 'voice_memo') return 'Voice memo';
  if (kind === 'photo') return 'Photo';
  if (kind === 'document') return 'Document';
  return 'Screenshot';
}

function attachmentIcon(kind: AttachmentKind): IconName {
  if (kind === 'voice_memo') return 'mic';
  if (kind === 'document') return 'doc';
  return 'camera';
}

function entryTimestamp(entry: Entry) {
  return `${entry.event_date}T${entry.event_time ?? '00:00:00'}`;
}

function attachmentTimestamp(attachment: EvidenceAttachment) {
  return attachment.captured_at ?? attachment.created_at;
}

function byAttachmentNewest(a: EvidenceAttachment, b: EvidenceAttachment) {
  return attachmentTimestamp(b).localeCompare(attachmentTimestamp(a));
}

function buildAttachmentsByEntryId(attachments: EvidenceAttachment[]) {
  return attachments.reduce<Record<string, EvidenceAttachment[]>>((acc, attachment) => {
    if (!attachment.entry_id) return acc;
    acc[attachment.entry_id] = [...(acc[attachment.entry_id] ?? []), attachment];
    return acc;
  }, {});
}

function entryMatchesQuery(entry: Entry, attachments: EvidenceAttachment[], query: string) {
  if (!query) return true;

  const entryMatch =
    includesQuery(entry.body, query) ||
    includesQuery(entry.private_notes, query) ||
    includesQuery(entry.court_ready_summary, query) ||
    includesQuery(entry.title, query);
  const filenameMatch = attachments.some((attachment) => includesQuery(attachment.file_name, query));

  return entryMatch || filenameMatch;
}

function attachmentMatchesQuery(attachment: EvidenceAttachment, query: string) {
  if (!query) return true;
  return includesQuery(attachment.file_name, query);
}

function sortRows(rows: EvidenceRow[], sortMode: SortMode) {
  const sorted = [...rows];

  if (sortMode === 'oldest') {
    return sorted.sort((a, b) => entryTimestamp(a.entry).localeCompare(entryTimestamp(b.entry)));
  }

  if (sortMode === 'flagged') {
    return sorted.sort((a, b) => {
      if (a.entry.is_flagged !== b.entry.is_flagged) return a.entry.is_flagged ? -1 : 1;
      return entryTimestamp(b.entry).localeCompare(entryTimestamp(a.entry));
    });
  }

  return sorted.sort((a, b) => entryTimestamp(b.entry).localeCompare(entryTimestamp(a.entry)));
}

function formatFileSize(bytes?: number | null) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return 'Size not recorded';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms?: number | null) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return null;
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
  const label = option?.shortLabel ?? 'All types';
  const tone = (option?.tone ?? 'ink') as ChipTone;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Entry type filter: ${label}`}
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

function AttachmentFilterChip({
  value,
  label,
  tone,
  icon,
  active,
  onPress,
}: {
  value: AttachmentFilter;
  label: string;
  tone: ChipTone;
  icon: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Attachment filter: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconChip}>
        <Icon name={icon} size={14} color={active ? fbColors.ink : fbColors.inkMute} />
        <Chip tone={tone} outline={!active}>
          {label}
        </Chip>
      </View>
    </Pressable>
  );
}

function ChildFilterChip({
  child,
  active,
  onPress,
}: {
  child: Child | null;
  active: boolean;
  onPress: () => void;
}) {
  const label = child?.name ?? 'All children';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Child filter: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        active && styles.filterChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Chip tone={child ? 'forest' : 'ink'} outline={!active}>
        {label}
      </Chip>
    </Pressable>
  );
}

function EvidenceStats({
  entriesCount,
  attachmentsCount,
  voiceMemoCount,
  flaggedCount,
}: {
  entriesCount: number;
  attachmentsCount: number;
  voiceMemoCount: number;
  flaggedCount: number;
}) {
  return (
    <View style={styles.statsGrid}>
      <SoftCard p={12} style={styles.statCard}>
        <Text style={styles.statValue}>{entriesCount}</Text>
        <Text style={styles.statLabel}>Entries</Text>
      </SoftCard>
      <SoftCard p={12} style={styles.statCard}>
        <Text style={styles.statValue}>{attachmentsCount}</Text>
        <Text style={styles.statLabel}>Attachments</Text>
      </SoftCard>
      <SoftCard p={12} style={styles.statCard}>
        <Text style={styles.statValue}>{voiceMemoCount}</Text>
        <Text style={styles.statLabel}>Voice memos</Text>
      </SoftCard>
      <SoftCard p={12} style={styles.statCard}>
        <Text style={styles.statValue}>{flaggedCount}</Text>
        <Text style={styles.statLabel}>Flagged</Text>
      </SoftCard>
    </View>
  );
}

function AttachmentEvidenceCard({ attachment }: { attachment: EvidenceAttachment }) {
  const meta = attachmentMeta(attachment);
  const kind = getAttachmentKind(attachment);
  const syncStatus = stringMeta(meta.sync_status) ?? 'pending';
  const durationMs = numberMeta(meta.duration_ms);
  const sourceLabel = stringMeta(meta.source_label) ?? attachment.source_device ?? 'Local evidence';
  const durationLabel = formatDuration(durationMs);

  return (
    <SoftCard p={14} style={styles.attachmentCard}>
      <View style={styles.attachmentHeader}>
        <View style={styles.attachmentTitleRow}>
          <View style={styles.attachmentIcon}>
            <Icon name={attachmentIcon(kind)} size={15} color={fbColors.ink} />
          </View>
          <View style={styles.attachmentCopy}>
            <Text style={styles.attachmentTitle}>{attachmentKindLabel(kind)}</Text>
            <Text style={styles.attachmentFilename}>{attachment.file_name}</Text>
          </View>
        </View>
        <Chip
          tone={syncStatus === 'error' ? 'ox' : syncStatus === 'synced' ? 'forest' : 'amber'}
          outline={false}
        >
          {syncStatus}
        </Chip>
      </View>

      <Text style={styles.attachmentBody}>
        Original evidence reference is preserved locally. Uploads, OCR, and AI extraction are not enabled here.
      </Text>

      <View style={styles.attachmentMetaGrid}>
        <Text style={styles.attachmentMetaText}>{attachment.mime_type || 'MIME type not recorded'}</Text>
        <Text style={styles.attachmentMetaText}>{formatFileSize(attachment.file_size_bytes)}</Text>
        {durationLabel ? <Text style={styles.attachmentMetaText}>Duration {durationLabel}</Text> : null}
        <Text style={styles.attachmentMetaText}>{formatDateLabel((attachment.captured_at ?? attachment.created_at).slice(0, 10))}</Text>
      </View>

      <Text style={styles.sourceText}>Source: {sourceLabel}</Text>
    </SoftCard>
  );
}

function EvidenceResult({ row }: { row: EvidenceRow }) {
  const option = getEntryTypeOption(row.entry.entry_type);

  return (
    <View style={styles.resultBlock}>
      <EntryCard
        entry={row.entry}
        attachmentCount={row.attachmentCount}
        onPress={() => openEntry(row.entry.id)}
      />
      {row.attachments.length ? (
        <View style={styles.attachmentStack}>
          <View style={styles.entryEvidenceHeader}>
            <Text style={styles.entryEvidenceLabel}>SOURCE REFERENCES</Text>
            <Chip tone={option.tone as ChipTone} outline={false}>
              {option.shortLabel}
            </Chip>
          </View>
          {row.attachments.map((attachment) => (
            <AttachmentEvidenceCard key={attachment.id} attachment={attachment} />
          ))}
        </View>
      ) : (
        <View style={styles.noAttachmentRow}>
          <Icon name="paperclip" size={14} color={fbColors.inkMute} />
          <Text style={styles.noAttachmentText}>No attachment metadata linked to this entry.</Text>
        </View>
      )}
    </View>
  );
}

export default function Evidence() {
  const { activeCase, entries, attachments, children, source, loading } = useCaseEvidence();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntryTypeFilterValue>('all');
  const [flagFilter, setFlagFilter] = useState<FlagFilter>('all');
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>('all');
  const [childFilter, setChildFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const attachmentsByEntryId = useMemo(() => buildAttachmentsByEntryId(attachments), [attachments]);
  const query = normalizeSearch(search);

  const rows = useMemo(() => {
    const nextRows = entries
      .map((entry) => {
        const entryAttachments = (attachmentsByEntryId[entry.id] ?? []).sort(byAttachmentNewest);
        const typedAttachments =
          attachmentFilter === 'all'
            ? entryAttachments
            : entryAttachments.filter((attachment) => getAttachmentKind(attachment) === attachmentFilter);
        const visibleAttachments =
          query && !entryMatchesQuery(entry, [], query)
            ? typedAttachments.filter((attachment) => attachmentMatchesQuery(attachment, query))
            : typedAttachments;

        return {
          entry,
          attachments: visibleAttachments,
          allAttachments: entryAttachments,
          typedAttachments,
        };
      })
      .filter((row) => {
        if (typeFilter !== 'all' && row.entry.entry_type !== typeFilter) return false;
        if (flagFilter === 'flagged' && !row.entry.is_flagged) return false;
        if (childFilter !== 'all' && row.entry.child_id !== childFilter) return false;
        if (attachmentFilter !== 'all' && !row.typedAttachments.length) return false;
        if (query && !entryMatchesQuery(row.entry, row.typedAttachments, query)) return false;
        return true;
      })
      .map(({ entry, attachments: visibleAttachments }) => ({
        entry,
        attachments: visibleAttachments,
        attachmentCount: attachmentsByEntryId[entry.id]?.length ?? 0,
      }));

    return sortRows(nextRows, sortMode);
  }, [attachmentFilter, attachmentsByEntryId, childFilter, entries, flagFilter, query, sortMode, typeFilter]);

  const visibleAttachmentCount = rows.reduce((sum, row) => sum + row.attachments.length, 0);
  const voiceMemoCount = rows.reduce(
    (sum, row) =>
      sum + row.attachments.filter((attachment) => getAttachmentKind(attachment) === 'voice_memo').length,
    0,
  );
  const flaggedCount = rows.filter((row) => row.entry.is_flagged).length;
  const filtersActive =
    query ||
    typeFilter !== 'all' ||
    flagFilter !== 'all' ||
    attachmentFilter !== 'all' ||
    childFilter !== 'all' ||
    sortMode !== 'newest';

  function clearFilters() {
    setSearch('');
    setTypeFilter('all');
    setFlagFilter('all');
    setAttachmentFilter('all');
    setChildFilter('all');
    setSortMode('newest');
  }

  return (
    <CaseScreen>
      <View style={styles.header}>
        <Display italic size={32} style={styles.title}>
          Evidence
        </Display>
        <Text style={styles.subtitle}>
          {activeCase?.title || 'Current case'} - {entries.length} entries -{' '}
          {source === 'supabase' ? 'Supabase data' : source === 'local' ? 'Local persisted data' : 'Local demo data'}
        </Text>
      </View>

      <EvidenceStats
        entriesCount={rows.length}
        attachmentsCount={visibleAttachmentCount}
        voiceMemoCount={voiceMemoCount}
        flaggedCount={flaggedCount}
      />

      <SoftCard p={16} style={styles.searchCard}>
        <View style={styles.filterHeader}>
          <View style={styles.filterTitleRow}>
            <Icon name="search" size={16} color={fbColors.ink} />
            <Text style={styles.filterTitle}>Search and filter</Text>
          </View>
          {filtersActive ? (
            <PillButton tone="ghost" size="sm" icon="x" onPress={clearFilters}>
              Clear
            </PillButton>
          ) : null}
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search body, notes, summaries, or filenames"
          placeholderTextColor={fbColors.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.searchInput}
        />

        <View style={styles.segmentBlock}>
          <Text style={styles.label}>Sort</Text>
          <Segment<SortMode>
            items={[
              { v: 'newest', label: 'Newest' },
              { v: 'oldest', label: 'Oldest' },
              { v: 'flagged', label: 'Flagged first' },
            ]}
            value={sortMode}
            onChange={setSortMode}
          />
        </View>

        <View style={styles.segmentBlock}>
          <Text style={styles.label}>Flags</Text>
          <Segment<FlagFilter>
            items={[
              { v: 'all', label: 'All' },
              { v: 'flagged', label: 'Flagged' },
            ]}
            value={flagFilter}
            onChange={setFlagFilter}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.label}>Entry type</Text>
          <View style={styles.filterWrap}>
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

        <View style={styles.filterGroup}>
          <Text style={styles.label}>Attachment type</Text>
          <View style={styles.filterWrap}>
            {ATTACHMENT_FILTERS.map((option) => (
              <AttachmentFilterChip
                key={option.value}
                value={option.value}
                label={option.label}
                tone={option.tone}
                icon={option.icon}
                active={attachmentFilter === option.value}
                onPress={() => setAttachmentFilter(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.label}>Child</Text>
          <View style={styles.filterWrap}>
            <ChildFilterChip child={null} active={childFilter === 'all'} onPress={() => setChildFilter('all')} />
            {children.map((child) => (
              <ChildFilterChip
                key={child.id}
                child={child}
                active={childFilter === child.id}
                onPress={() => setChildFilter(child.id)}
              />
            ))}
          </View>
        </View>
      </SoftCard>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionLabel}>EVIDENCE RECORDS</Text>
        <Text style={styles.resultCount}>{loading ? 'Loading' : `${rows.length} shown`}</Text>
      </View>

      {entries.length === 0 ? (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No evidence records yet</Text>
          <Text style={styles.emptyBody}>
            Capture entries first. Local attachments and voice memos will appear here after they are linked to an entry.
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
      ) : rows.length ? (
        <View style={styles.resultsStack}>
          {rows.map((row) => (
            <EvidenceResult key={row.entry.id} row={row} />
          ))}
        </View>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No evidence matches</Text>
          <Text style={styles.emptyBody}>
            Adjust the search term or filters. This search only uses local entry text, private notes, court-ready summaries, and filenames.
          </Text>
          <PillButton tone="soft" size="md" icon="x" onPress={clearFilters} style={styles.emptyAction}>
            Clear filters
          </PillButton>
        </SoftCard>
      )}

      <Rule style={styles.bottomRule} />
      <Text style={styles.footerNote}>
        Evidence search is local to this device. OCR, AI search, remote storage sync, and cloud uploads are not enabled in this PR.
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
  statsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: fbSpacing.x1,
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
  searchCard: {
    marginTop: fbSpacing.x4,
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
    flex: 1,
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
  searchInput: {
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
  segmentBlock: {
    gap: fbSpacing.x2,
  },
  filterGroup: {
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
  filterWrap: {
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
  iconChip: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x1,
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
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  resultsStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x4,
  },
  resultBlock: {
    gap: fbSpacing.x2,
  },
  attachmentStack: {
    marginLeft: fbSpacing.x4,
    gap: fbSpacing.x2,
  },
  entryEvidenceHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  entryEvidenceLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  attachmentCard: {
    gap: fbSpacing.x3,
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  attachmentTitleRow: {
    flex: 1,
    flexDirection: 'row',
    gap: fbSpacing.x3,
  },
  attachmentIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  attachmentCopy: {
    flex: 1,
    gap: fbSpacing.x1,
  },
  attachmentTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  attachmentFilename: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentMetaGrid: {
    gap: fbSpacing.x1,
  },
  attachmentMetaText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  sourceText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  noAttachmentRow: {
    minHeight: fbTouch.min,
    marginLeft: fbSpacing.x4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  noAttachmentText: {
    flex: 1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
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
  bottomRule: {
    marginTop: fbSpacing.x5,
  },
  footerNote: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
