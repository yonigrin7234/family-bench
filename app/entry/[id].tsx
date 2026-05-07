import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
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
  getCapturedBody,
  getEntryMetadata,
  getEntryTypeOption,
  isEntryReviewed,
  useCreatePlaceholderAttachment,
  useEntryDetail,
  useUpdateEntryReview,
  type AttachmentKind,
  type EvidenceAttachment,
} from '@/lib/case-intelligence';

type ReviewVisibility = 'court_ready' | 'private';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not recorded'}</Text>
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  right,
}: {
  icon: IconName;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleLeft}>
        <Icon name={icon} size={16} color={fbColors.ink} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function ComingLaterButton({
  icon,
  children,
}: {
  icon: IconName;
  children: string;
}) {
  return (
    <PillButton tone="ghost" size="md" icon={icon} disabled full>
      {children} · coming later
    </PillButton>
  );
}

const ATTACHMENT_OPTIONS: Array<{
  kind: AttachmentKind;
  label: string;
  icon: IconName;
}> = [
  { kind: 'photo', label: 'Add photo placeholder', icon: 'camera' },
  { kind: 'document', label: 'Add document placeholder', icon: 'doc' },
  { kind: 'voice_memo', label: 'Add voice memo placeholder', icon: 'mic' },
  { kind: 'screenshot', label: 'Add screenshot placeholder', icon: 'camera' },
];

function attachmentMeta(attachment: EvidenceAttachment): Record<string, unknown> {
  const exif = attachment.exif;
  if (!exif || typeof exif !== 'object' || Array.isArray(exif)) return {};
  return exif as Record<string, unknown>;
}

function stringMeta(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function attachmentKindLabel(attachment: EvidenceAttachment) {
  const kind = stringMeta(attachmentMeta(attachment).attachment_kind) ?? attachment.file_type;
  if (kind === 'voice_memo') return 'Voice memo';
  if (kind === 'photo') return 'Photo';
  if (kind === 'document') return 'Document';
  if (kind === 'screenshot') return 'Screenshot';
  return attachment.file_type || 'Attachment';
}

function attachmentIconName(attachment: EvidenceAttachment): IconName {
  if (attachment.file_type === 'voice_memo') return 'mic';
  if (attachment.file_type === 'document') return 'doc';
  return 'paperclip';
}

function AttachmentRecord({ attachment }: { attachment: EvidenceAttachment }) {
  const exif = attachmentMeta(attachment);
  const syncStatus = stringMeta(exif.sync_status) ?? 'pending';
  const sourceLabel = stringMeta(exif.source_label) ?? attachment.source_device;

  return (
    <View style={styles.attachmentRecord}>
      <View style={styles.attachmentHeader}>
        <View style={styles.attachmentTitleRow}>
          <View style={styles.attachmentIcon}>
            <Icon
              name={attachmentIconName(attachment)}
              size={14}
              color={fbColors.ink}
            />
          </View>
          <View style={styles.attachmentCopy}>
            <Text style={styles.attachmentTitle}>{attachmentKindLabel(attachment)}</Text>
            <Text style={styles.attachmentMeta}>{attachment.file_name}</Text>
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
        Original evidence is preserved. Uploads, previews, and derived files come later.
      </Text>
      <View style={styles.attachmentDetails}>
        <DetailRow label="MIME type" value={attachment.mime_type} />
        <DetailRow label="File size" value={`${attachment.file_size_bytes ?? 0} bytes placeholder`} />
        <DetailRow label="Storage bucket" value={attachment.storage_bucket || 'Not assigned'} />
        <DetailRow label="Storage path" value={attachment.storage_path} />
        <DetailRow label="Hash" value={attachment.file_hash} />
        <DetailRow label="Captured" value={attachment.captured_at} />
        <DetailRow label="Source label" value={sourceLabel} />
      </View>
    </View>
  );
}

export default function EntryDetail() {
  const params = useLocalSearchParams();
  const entryId = getParam(params.id);
  const updateEntryReview = useUpdateEntryReview();
  const createPlaceholderAttachment = useCreatePlaceholderAttachment();
  const { entry, child, attachments, loading } = useEntryDetail(entryId);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [bodyDraft, setBodyDraft] = useState('');
  const [visibility, setVisibility] = useState<ReviewVisibility>('court_ready');
  const [addingAttachmentKind, setAddingAttachmentKind] = useState<AttachmentKind | null>(null);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const option = getEntryTypeOption(entry?.entry_type);
  const metadata = entry ? getEntryMetadata(entry) : {};
  const capturedBody = entry ? getCapturedBody(entry) : null;
  const reviewed = entry ? isEntryReviewed(entry) : false;

  useEffect(() => {
    if (!entry) return;
    setBodyDraft(entry.body ?? '');
    setVisibility(metadata.review_visibility === 'private' ? 'private' : 'court_ready');
  }, [entry?.id, entry?.body, metadata.review_visibility]);

  const changed = entry ? bodyDraft.trim() !== (entry.body ?? '').trim() : false;
  const statusLabel = useMemo(() => {
    if (!entry) return 'Not available';
    if (entry.is_flagged) return entry.flag_severity ? `Flagged · ${entry.flag_severity}` : 'Flagged';
    return 'Not flagged';
  }, [entry]);

  function saveBody() {
    if (!entry) return;
    updateEntryReview(entry.id, { body: bodyDraft });
    setMode('read');
  }

  function markReviewed() {
    if (!entry) return;
    updateEntryReview(entry.id, { reviewed: true });
  }

  function changeVisibility(next: ReviewVisibility) {
    setVisibility(next);
    if (entry) {
      updateEntryReview(entry.id, { reviewVisibility: next });
    }
  }

  async function addAttachmentPlaceholder(kind: AttachmentKind) {
    if (!entry || addingAttachmentKind) return;
    setAddingAttachmentKind(kind);
    setAttachmentNotice(null);

    try {
      const result = await createPlaceholderAttachment({
        entryId: entry.id,
        kind,
        sourceLabel: 'Family Bench local placeholder',
      });
      setAttachmentNotice(result.warning);
    } catch (err) {
      setAttachmentNotice(
        err instanceof Error ? err.message : 'Unable to create attachment metadata locally.',
      );
    } finally {
      setAddingAttachmentKind(null);
    }
  }

  if (!entry) {
    return (
      <CaseScreen>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <SoftCard p={18} style={styles.missingCard}>
          <Text style={styles.emptyTitle}>{loading ? 'Loading entry' : 'Entry not found'}</Text>
          <Text style={styles.emptyBody}>
            This review layer can open entries after local hydration completes.
          </Text>
          <PillButton
            tone="primary"
            size="md"
            icon="clock"
            onPress={() => router.replace('/timeline' as never)}
            style={styles.emptyAction}
          >
            Return to timeline
          </PillButton>
        </SoftCard>
      </CaseScreen>
    );
  }

  return (
    <CaseScreen
      footer={
        mode === 'edit' ? (
          <View style={styles.footer}>
            <PillButton tone="primary" size="lg" full icon="check" disabled={!changed} onPress={saveBody}>
              Save review edits
            </PillButton>
          </View>
        ) : null
      }
    >
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone={option.tone as ChipTone} outline={false}>
            {option.shortLabel}
          </Chip>
          {reviewed ? (
            <Chip tone="forest" outline={false}>
              Reviewed
            </Chip>
          ) : null}
          {entry.is_flagged ? (
            <Chip tone="ox" outline={false}>
              Flagged
            </Chip>
          ) : null}
        </View>
        <Display italic size={31} style={styles.title}>
          {entry.title || option.defaultTitle}
        </Display>
        <Text style={styles.subtitle}>
          {formatDateLabel(entry.event_date, entry.event_time)} · {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle icon={option.icon as IconName} title="Record details" />
        <View style={styles.detailGrid}>
          <DetailRow label="Entry type" value={option.label} />
          <DetailRow label="Date and time" value={formatDateLabel(entry.event_date, entry.event_time)} />
          <DetailRow label="Child" value={child?.name} />
          <DetailRow label="Custody period" value={entry.custody_period} />
          <DetailRow label="People present" value="Not recorded in MVP" />
          <DetailRow label="Review status" value={reviewed ? 'Reviewed' : 'Needs review'} />
          <DetailRow label="Severity / flag" value={statusLabel} />
        </View>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle
          icon="eye"
          title="Review visibility"
          right={
            <Chip tone={visibility === 'private' ? 'ox' : 'forest'} outline={false}>
              {visibility === 'private' ? 'Private' : 'Court-ready'}
            </Chip>
          }
        />
        <Segment<ReviewVisibility>
          items={[
            { v: 'court_ready', label: 'Court-ready' },
            { v: 'private', label: 'Private' },
          ]}
          value={visibility}
          onChange={changeVisibility}
        />
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle
          icon="doc"
          title="Source and reviewed text"
          right={
            <PillButton
              tone={mode === 'edit' ? 'accentSoft' : 'ghost'}
              size="sm"
              icon={mode === 'edit' ? 'x' : 'doc'}
              onPress={() => setMode(mode === 'edit' ? 'read' : 'edit')}
            >
              {mode === 'edit' ? 'Cancel' : 'Edit'}
            </PillButton>
          }
        />
        <Text style={styles.sourceLabel}>SOURCE CAPTURED TEXT</Text>
        <Text style={styles.sourceBody}>{capturedBody || 'No source body text was captured.'}</Text>
        <Rule />
        <Text style={styles.sourceLabel}>REVIEWED BODY TEXT</Text>
        {mode === 'edit' ? (
          <TextInput
            value={bodyDraft}
            onChangeText={setBodyDraft}
            multiline
            textAlignVertical="top"
            placeholder="Add reviewed body text"
            placeholderTextColor={fbColors.inkFaint}
            style={styles.bodyInput}
          />
        ) : (
          <Text style={styles.reviewBody}>{entry.body || 'No reviewed body text yet.'}</Text>
        )}
      </SoftCard>

      {visibility === 'private' ? (
        <SoftCard p={16} style={styles.section}>
          <SectionTitle icon="shield" title="Private notes" />
          <Text style={styles.sectionBody}>
            {entry.private_notes || 'No private note has been added to this entry.'}
          </Text>
        </SoftCard>
      ) : (
        <SoftCard p={16} style={styles.section}>
          <SectionTitle icon="scales" title="Court-ready summary" />
          <Text style={styles.sectionBody}>
            {entry.court_ready_summary ||
              'No court-ready summary has been generated. Keep this separate from private notes and future AI interpretation.'}
          </Text>
          <ComingLaterButton icon="sparkle">Generate court-ready summary</ComingLaterButton>
        </SoftCard>
      )}

      <SoftCard p={16} style={styles.section}>
        <SectionTitle
          icon="paperclip"
          title="Evidence and attachments"
          right={
            <Chip tone={attachments.length ? 'amber' : 'mute'} outline={false}>
              {attachments.length}
            </Chip>
          }
        />
        <Text style={styles.sectionBody}>
          {attachments.length
            ? `${attachments.length} local attachment metadata records are linked to this entry.`
            : 'No evidence metadata is attached yet. Add a local placeholder record now; file uploads will be added after storage policy review.'}
        </Text>
        <Text style={styles.sectionBody}>
          Placeholder records describe original evidence. The original file, previews, OCR, and
          derived files are not created in this PR.
        </Text>
        <View style={styles.attachmentActionGrid}>
          {ATTACHMENT_OPTIONS.map((option) => (
            <PillButton
              key={option.kind}
              tone="soft"
              size="md"
              icon={option.icon}
              full
              disabled={Boolean(addingAttachmentKind)}
              onPress={() => addAttachmentPlaceholder(option.kind)}
            >
              {addingAttachmentKind === option.kind ? 'Saving metadata' : option.label}
            </PillButton>
          ))}
        </View>
        {attachmentNotice ? <Text style={styles.attachmentNotice}>{attachmentNotice}</Text> : null}
        {attachments.length ? (
          <View style={styles.attachmentStack}>
            {attachments.map((attachment) => (
              <AttachmentRecord key={attachment.id} attachment={attachment} />
            ))}
          </View>
        ) : null}
        <Rule />
        <View style={styles.attachmentActionGrid}>
          <ComingLaterButton icon="upload">Upload file</ComingLaterButton>
          <ComingLaterButton icon="camera">Capture photo</ComingLaterButton>
          <ComingLaterButton icon="mic">Record voice memo</ComingLaterButton>
        </View>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle icon="link" title="Court order link" />
        <Text style={styles.sectionBody}>
          No court-order provision is linked yet. This will connect entries to specific order language later.
        </Text>
        <PillButton
          tone="primary"
          size="md"
          icon="scales"
          full
          onPress={() => router.push('/case-map' as never)}
        >
          Open Case Map
        </PillButton>
        <ComingLaterButton icon="link">Link to court order</ComingLaterButton>
      </SoftCard>

      <InfoCallout title="Future AI interpretation" tone="ink">
        AI summaries and pattern notes are not generated in this PR. Future AI output must cite source entries and evidence separately.
      </InfoCallout>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle icon="shield" title="Metadata and provenance" />
        <DetailRow label="Entry ID" value={entry.id} />
        <DetailRow label="Capture method" value={entry.capture_method} />
        <DetailRow label="Content hash" value={entry.content_hash} />
        <DetailRow label="Created" value={entry.created_at} />
        <DetailRow label="Updated" value={entry.updated_at} />
      </SoftCard>

      <View style={styles.reviewActions}>
        <PillButton
          tone={reviewed ? 'soft' : 'primary'}
          size="lg"
          full
          icon="check"
          onPress={markReviewed}
          disabled={reviewed}
        >
          {reviewed ? 'Reviewed' : 'Mark reviewed'}
        </PillButton>
      </View>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
  },
  kickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
    marginTop: fbSpacing.x2,
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
  section: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
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
    letterSpacing: -0.14,
  },
  detailGrid: {
    gap: fbSpacing.x3,
  },
  detailRow: {
    gap: fbSpacing.x1,
  },
  detailLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  sourceLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
  },
  sourceBody: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  reviewBody: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  bodyInput: {
    minHeight: 136,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    padding: fbSpacing.x3,
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  sectionBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentActionGrid: {
    gap: fbSpacing.x2,
  },
  attachmentNotice: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentStack: {
    gap: fbSpacing.x3,
  },
  attachmentRecord: {
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
  },
  attachmentHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  attachmentTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
  },
  attachmentIcon: {
    width: 28,
    height: 28,
    borderRadius: fbRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.surface,
  },
  attachmentCopy: {
    flex: 1,
  },
  attachmentTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  attachmentMeta: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 17,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentBody: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  attachmentDetails: {
    gap: fbSpacing.x2,
  },
  reviewActions: {
    marginTop: fbSpacing.x4,
  },
  footer: {
    paddingTop: fbSpacing.x2,
    backgroundColor: fbColors.paper,
  },
  missingCard: {
    marginTop: fbSpacing.x6,
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
});
