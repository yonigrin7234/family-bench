import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  LocalAudioRecorder,
  type RecordedAudioMemo,
} from '@/components/case-intelligence/LocalAudioRecorder';
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
  getCourtOrderProvisionStatus,
  getEntryMetadata,
  getEntryTypeOption,
  isEntryReviewed,
  useCreateLocalAttachment,
  useCreatePlaceholderAttachment,
  useEntryDetail,
  useUpdateEntryReview,
  type AttachmentKind,
  type CreateLocalAttachmentInput,
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

type LocalAttachmentPick = Omit<CreateLocalAttachmentInput, 'entryId'>;

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
  if (attachment.file_type === 'photo' || attachment.file_type === 'screenshot') return 'camera';
  return 'paperclip';
}

function formatFileSize(bytes?: number | null) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return 'Not available';
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms?: number | null) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return 'Not available';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function filenameFromUri(uri: string, fallback: string) {
  const cleaned = uri.split('?')[0]?.split('#')[0] ?? '';
  const name = cleaned.split('/').filter(Boolean).pop();
  return name || fallback;
}

function kindFromMime(mimeType?: string | null): AttachmentKind {
  if (mimeType?.startsWith('image/')) return 'photo';
  return 'document';
}

function provisionCategoryLabel(category?: string | null) {
  if (category === 'custody') return 'Custody';
  if (category === 'support') return 'Support';
  if (category === 'medical') return 'Medical';
  if (category === 'communication') return 'Communication';
  if (category === 'exchange') return 'Exchange';
  return 'Other';
}

async function pickImageAttachment(): Promise<LocalAttachmentPick | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library permission is required to select an image.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? (asset.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const filename = asset.fileName ?? filenameFromUri(asset.uri, `photo-${Date.now()}.jpg`);

  return {
    kind: filename.toLowerCase().includes('screenshot') ? 'screenshot' : 'photo',
    filename,
    mimeType,
    fileSizeBytes: asset.fileSize ?? asset.file?.size ?? null,
    localUri: asset.uri,
    localReference:
      asset.assetId ??
      (asset.file ? `web-image:${asset.file.name}:${asset.file.size}:${asset.file.lastModified}` : asset.uri),
    sourceLabel: 'Photo library selection',
  };
}

async function pickWebDocumentAttachment(): Promise<LocalAttachmentPick | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    throw new Error('Document selection is available in the web preview for this PR.');
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    let settled = false;
    const settle = (value: LocalAttachmentPick | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };
    input.type = 'file';
    input.accept = [
      'application/pdf',
      'image/*',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].join(',');
    input.style.display = 'none';
    input.addEventListener('cancel', () => settle(null), { once: true });
    input.onchange = () => {
      const file = input.files?.[0] ?? null;

      if (!file) {
        settle(null);
        return;
      }

      const localUri = URL.createObjectURL(file);

      settle({
        kind: kindFromMime(file.type),
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
        localUri,
        localReference: `web-file:${file.name}:${file.size}:${file.lastModified}`,
        sourceLabel: 'Local file selection',
      });
    };
    document.body.appendChild(input);
    input.click();
  });
}

function AttachmentRecord({ attachment }: { attachment: EvidenceAttachment }) {
  const exif = attachmentMeta(attachment);
  const syncStatus = stringMeta(exif.sync_status) ?? 'pending';
  const sourceLabel = stringMeta(exif.source_label) ?? attachment.source_device;
  const localUri = stringMeta(exif.local_uri);
  const localReference = stringMeta(exif.local_reference);
  const selectedAt = stringMeta(exif.selected_at);
  const durationMs = numberMeta(exif.duration_ms);
  const isLocalSelection = stringMeta(exif.selection_source) === 'local_picker';
  const canPreviewImage = Boolean(localUri && attachment.mime_type?.startsWith('image/'));

  return (
    <View style={styles.attachmentRecord}>
      {canPreviewImage && localUri ? (
        <Image source={{ uri: localUri }} resizeMode="cover" style={styles.attachmentPreview} />
      ) : (
        <View style={styles.attachmentFilePreview}>
          <Icon name={attachmentIconName(attachment)} size={20} color={fbColors.ink} />
          <Text style={styles.attachmentFilePreviewText}>
            {attachment.mime_type?.startsWith('image/') ? 'Image metadata' : 'File metadata'}
          </Text>
        </View>
      )}
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
        {isLocalSelection
          ? 'Original evidence reference is preserved locally. Cloud uploads, OCR, AI extraction, and derived files come later.'
          : 'Original evidence is preserved. Uploads, previews, and derived files come later.'}
      </Text>
      <View style={styles.attachmentDetails}>
        <DetailRow label="MIME type" value={attachment.mime_type} />
        <DetailRow
          label="File size"
          value={
            numberMeta(attachment.file_size_bytes) === null && !isLocalSelection
              ? '0 bytes placeholder'
              : formatFileSize(attachment.file_size_bytes)
          }
        />
        <DetailRow label="Duration" value={durationMs === null ? null : formatDuration(durationMs)} />
        <DetailRow label="Local reference" value={localReference || localUri} />
        <DetailRow label="Storage bucket" value={attachment.storage_bucket || 'Not assigned'} />
        <DetailRow label="Storage path" value={attachment.storage_path} />
        <DetailRow label="Hash" value={attachment.file_hash} />
        <DetailRow label="Captured" value={attachment.captured_at ?? selectedAt} />
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
  const createLocalAttachment = useCreateLocalAttachment();
  const {
    entry,
    child,
    attachments,
    filingLinkCount,
    courtOrderProvisionOptions,
    linkedCourtOrderProvision,
    linkedCourtOrder,
    linkEntryToCourtOrderProvision,
    loading,
  } = useEntryDetail(entryId);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [bodyDraft, setBodyDraft] = useState('');
  const [visibility, setVisibility] = useState<ReviewVisibility>('court_ready');
  const [addingAttachmentKind, setAddingAttachmentKind] = useState<AttachmentKind | null>(null);
  const [pickingAttachment, setPickingAttachment] = useState<'photo' | 'document' | null>(null);
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
    if (!entry || addingAttachmentKind || pickingAttachment) return;
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

  async function addSelectedAttachment(source: 'photo' | 'document') {
    if (!entry || addingAttachmentKind || pickingAttachment) return;
    setPickingAttachment(source);
    setAttachmentNotice(null);

    try {
      const selected =
        source === 'photo' ? await pickImageAttachment() : await pickWebDocumentAttachment();
      if (!selected) {
        setAttachmentNotice('No attachment was selected.');
        return;
      }

      const result = await createLocalAttachment({
        entryId: entry.id,
        ...selected,
      });
      setAttachmentNotice(result.warning);
    } catch (err) {
      setAttachmentNotice(
        err instanceof Error ? err.message : 'Unable to save selected attachment metadata locally.',
      );
    } finally {
      setPickingAttachment(null);
    }
  }

  async function saveEntryVoiceMemo(memo: RecordedAudioMemo) {
    if (!entry) return;

    const result = await createLocalAttachment({
      entryId: entry.id,
      kind: 'voice_memo',
      filename: memo.filename,
      mimeType: memo.mimeType,
      fileSizeBytes: memo.fileSizeBytes,
      durationMs: memo.durationMs,
      localUri: memo.uri,
      localReference: memo.localReference,
      sourceLabel: 'Local voice memo recording',
    });
    setAttachmentNotice(result.warning);
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
          {filingLinkCount > 0 ? (
            <Chip tone="forest" outline={false}>
              Linked to filing
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
            : 'No evidence metadata is attached yet. Select a local file or image to save metadata on this device.'}
        </Text>
        <Text style={styles.sectionBody}>
          Original evidence stays local. Cloud uploads, OCR, AI extraction, and derived files are
          not created in this PR.
        </Text>
        <LocalAudioRecorder
          title="Record voice memo"
          body="Record a local audio source for this entry. It is saved as attachment metadata only; transcription and upload come later."
          saveLabel="Attach voice memo to entry"
          savedLabel="Voice memo metadata attached to this entry."
          onSave={saveEntryVoiceMemo}
        />
        <View style={styles.attachmentActionGrid}>
          <PillButton
            tone="primary"
            size="md"
            icon="camera"
            full
            disabled={Boolean(addingAttachmentKind || pickingAttachment)}
            onPress={() => addSelectedAttachment('photo')}
          >
            {pickingAttachment === 'photo' ? 'Opening picker' : 'Select photo or image'}
          </PillButton>
          <PillButton
            tone="soft"
            size="md"
            icon="doc"
            full
            disabled={Platform.OS !== 'web' || Boolean(addingAttachmentKind || pickingAttachment)}
            onPress={() => addSelectedAttachment('document')}
          >
            {pickingAttachment === 'document'
              ? 'Opening picker'
              : Platform.OS === 'web'
                ? 'Select file or document'
                : 'Document picker coming later'}
          </PillButton>
        </View>
        <View style={styles.placeholderBlock}>
          <Text style={styles.sourceLabel}>PLACEHOLDER METADATA</Text>
          <Text style={styles.sectionBody}>
            Use placeholders only when the original evidence is not ready to select yet.
          </Text>
          {ATTACHMENT_OPTIONS.map((option) => (
            <PillButton
              key={option.kind}
              tone="soft"
              size="md"
              icon={option.icon}
              full
              disabled={Boolean(addingAttachmentKind || pickingAttachment)}
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
          <ComingLaterButton icon="upload">Upload to storage</ComingLaterButton>
          <ComingLaterButton icon="camera">Capture photo</ComingLaterButton>
        </View>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <SectionTitle icon="link" title="Court order link" />
        {linkedCourtOrderProvision ? (
          <View style={styles.linkedProvisionCard}>
            <View style={styles.attachmentHeader}>
              <View style={styles.attachmentCopy}>
                <Text style={styles.attachmentTitle}>{linkedCourtOrderProvision.label}</Text>
                <Text style={styles.attachmentMeta}>
                  {linkedCourtOrder?.order_title ?? 'Court order'} ·{' '}
                  {provisionCategoryLabel(linkedCourtOrderProvision.category)} ·{' '}
                  {getCourtOrderProvisionStatus(linkedCourtOrderProvision)}
                </Text>
              </View>
              <Chip tone="forest" outline={false}>
                Linked locally
              </Chip>
            </View>
            <Text style={styles.sectionBody}>{linkedCourtOrderProvision.body}</Text>
            <InfoCallout title="Provision compliance placeholder" tone="ink">
              This entry is linked to an order provision for organization only. Compliance review is not assessed in this MVP.
            </InfoCallout>
            <PillButton
              tone="ghost"
              size="md"
              icon="x"
              full
              onPress={() => linkEntryToCourtOrderProvision(entry.id, null)}
            >
              Remove local provision link
            </PillButton>
          </View>
        ) : (
          <Text style={styles.sectionBody}>
            No court-order provision is linked yet. Select a local provision below to connect this entry to specific order language.
          </Text>
        )}
        {courtOrderProvisionOptions.length ? (
          <View style={styles.provisionOptionStack}>
            {courtOrderProvisionOptions.map((provision) => {
              const selected = linkedCourtOrderProvision?.id === provision.id;
              return (
                <View key={provision.id} style={styles.provisionOption}>
                  <View style={styles.attachmentCopy}>
                    <Text style={styles.attachmentTitle}>{provision.label}</Text>
                    <Text style={styles.attachmentMeta}>
                      {provisionCategoryLabel(provision.category)} · {getCourtOrderProvisionStatus(provision)}
                    </Text>
                  </View>
                  <PillButton
                    tone={selected ? 'soft' : 'primary'}
                    size="sm"
                    icon="link"
                    disabled={selected}
                    onPress={() => linkEntryToCourtOrderProvision(entry.id, provision.id)}
                  >
                    {selected ? 'Linked' : 'Link'}
                  </PillButton>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.sectionBody}>
            No local provisions are available yet. Add a court order and provision from Case Map first.
          </Text>
        )}
        <PillButton
          tone="primary"
          size="md"
          icon="scales"
          full
          onPress={() => router.push('/case-map' as never)}
        >
          Open Case Map
        </PillButton>
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
        <PillButton
          tone="ghost"
          size="md"
          icon="doc"
          full
          onPress={() => router.push({ pathname: '/export-prep', params: { entryId: entry.id } } as never)}
        >
          Preview entry JSON export
        </PillButton>
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
  placeholderBlock: {
    gap: fbSpacing.x2,
    paddingTop: fbSpacing.x2,
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
  attachmentPreview: {
    width: '100%',
    height: 156,
    borderRadius: fbRadii.md - 2,
    backgroundColor: fbColors.surface,
  },
  attachmentFilePreview: {
    minHeight: 72,
    borderRadius: fbRadii.md - 2,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: fbSpacing.x2,
  },
  attachmentFilePreviewText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
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
  linkedProvisionCard: {
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
  },
  provisionOptionStack: {
    gap: fbSpacing.x2,
  },
  provisionOption: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
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
