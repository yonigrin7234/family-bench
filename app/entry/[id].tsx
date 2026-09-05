import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  LocalAudioRecorder,
  type RecordedAudioMemo,
} from '@/components/case-intelligence/LocalAudioRecorder';
import {
  Chip,
  Display,
  EntryMark,
  Icon,
  InfoCallout,
  Mono,
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
import { useResponsive } from '@/lib/hooks/useResponsive';
import { resolveEvidenceUri } from '@/lib/evidence';
import { pickEvidenceFile, discardPickedEvidence } from '@/lib/evidence/picker';
import { getWorkspaceGeneration, useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { getActiveCase } from '@/lib/case-intelligence/selectors';
import {
  formatDateLabel,
  getCapturedBody,
  getCourtOrderProvisionStatus,
  getEntryMetadata,
  getEntryTypeOption,
  isEntryReviewed,
  useCreateLocalAttachment,
  useEntryDetail,
  useUpdateEntryReview,
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

function provisionCategoryLabel(category?: string | null) {
  if (category === 'custody') return 'Custody';
  if (category === 'support') return 'Support';
  if (category === 'medical') return 'Medical';
  if (category === 'communication') return 'Communication';
  if (category === 'exchange') return 'Exchange';
  return 'Other';
}

function AttachmentRecord({ attachment }: { attachment: EvidenceAttachment }) {
  const exif = attachmentMeta(attachment);
  const storageStatus = stringMeta(exif.storage_status);
  const syncStatus = stringMeta(exif.sync_status) ?? 'pending';
  const sourceLabel = stringMeta(exif.source_label) ?? attachment.source_device;
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [originalError, setOriginalError] = useState<string | null>(null);
  const selectedAt = stringMeta(exif.selected_at);
  const durationMs = numberMeta(exif.duration_ms);
  const canPreviewImage = Boolean(localUri && attachment.mime_type?.startsWith('image/'));

  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | undefined;
    setLocalUri(null);
    setOriginalError(null);
    resolveEvidenceUri(attachment).then((resolved) => {
      if (cancelled) { resolved.release(); return; }
      release = resolved.release;
      setLocalUri(resolved.uri);
    }).catch((error) => {
      if (!cancelled) setOriginalError(error instanceof Error ? error.message : 'The original is unavailable.');
    });
    return () => { cancelled = true; release?.(); };
  }, [attachment.id, attachment.file_hash, attachment.storage_path, attachment.user_id, attachment.deleted_at]);

  return (
    <View style={styles.attachmentRecord}>
      {canPreviewImage && localUri ? (
        <Image source={{ uri: localUri }} resizeMode="cover" style={styles.attachmentPreview} />
      ) : (
        <View style={styles.attachmentFilePreview}>
          <Icon name={attachmentIconName(attachment)} size={20} color={fbColors.ink} />
          <Text style={styles.attachmentFilePreviewText}>
            {originalError ? 'Original unavailable' : localUri ? 'Original verified' : 'Checking original'}
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
          tone={originalError || syncStatus === 'error' ? 'ox' : storageStatus === 'remote_verified' ? 'forest' : 'amber'}
          outline={false}
        >
          {originalError ? 'Needs attention' : storageStatus === 'remote_verified' ? 'Cloud verified' : 'Saved on device'}
        </Chip>
      </View>
      <Text style={styles.attachmentBody}>
        {originalError || (storageStatus === 'remote_verified'
          ? 'The cloud copy was downloaded and matched the original SHA-256 hash.'
          : 'The original bytes are saved on this device. Cloud backup is pending until sync succeeds.')}
      </Text>
      <View style={styles.attachmentDetails}>
        <DetailRow label="MIME type" value={attachment.mime_type} />
        <DetailRow
          label="File size"
          value={formatFileSize(attachment.file_size_bytes)}
        />
        <DetailRow label="Duration" value={durationMs === null ? null : formatDuration(durationMs)} />
        <DetailRow label="SHA-256" value={attachment.file_hash} />
        <DetailRow label="Captured" value={attachment.captured_at} />
        <DetailRow label="Added" value={selectedAt || attachment.created_at} />
        <DetailRow label="Source label" value={sourceLabel} />
      </View>
    </View>
  );
}

export default function EntryDetail() {
  const params = useLocalSearchParams();
  const entryId = getParam(params.id);
  const { entry } = useEntryDetail(entryId);
  return <EntryDetailContent key={entry ? `${entry.user_id}:${entry.case_id}:${entry.id}` : 'unavailable'} entryId={entryId} />;
}

function EntryDetailContent({ entryId }: { entryId?: string }) {
  const { isMobile } = useResponsive();
  const updateEntryReview = useUpdateEntryReview();
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
  const [pickingAttachment, setPickingAttachment] = useState<'photo' | 'document' | 'camera' | null>(null);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<LocalAttachmentPick | null>(null);
  const pendingAttachmentRef = useRef<LocalAttachmentPick | null>(null);
  const voiceIds = useRef(new Map<string, string>());
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const option = getEntryTypeOption(entry?.entry_type);
  const metadata = entry ? getEntryMetadata(entry) : {};
  const importProvenance = metadata.import_provenance && typeof metadata.import_provenance === 'object' && !Array.isArray(metadata.import_provenance) ? metadata.import_provenance as Record<string, unknown> : null;
  const isCsvSource = importProvenance?.kind === 'csv_source';
  const csvSourceEntryId = importProvenance?.kind === 'csv_row' && typeof importProvenance.sourceEntryId === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(importProvenance.sourceEntryId) ? importProvenance.sourceEntryId : null;
  const capturedBody = entry ? getCapturedBody(entry) : null;
  const reviewed = entry ? isEntryReviewed(entry) : false;
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    if (pendingAttachmentRef.current) void discardPickedEvidence(pendingAttachmentRef.current).catch(() => { /* Retained by global cleanup notice. */ });
  }; }, []);

  function pinEntryContext() {
    const generation = getWorkspaceGeneration(); const owner = entry?.user_id; const caseId = entry?.case_id;
    return () => mounted.current && generation === getWorkspaceGeneration() && useAuthStore.getState().session?.user.id === owner
      && useCaseIntelligenceStore.getState().ownerId === owner && getActiveCase(useCaseIntelligenceStore.getState().snapshot)?.id === caseId;
  }

  useEffect(() => {
    if (!entry) return;
    setBodyDraft(entry.body ?? '');
    setVisibility(isCsvSource || metadata.review_visibility === 'private' ? 'private' : 'court_ready');
  }, [entry?.id, entry?.body, isCsvSource, metadata.review_visibility]);

  const changed = entry ? bodyDraft.trim() !== (entry.body ?? '').trim() : false;
  const statusLabel = useMemo(() => {
    if (!entry) return 'Not available';
    if (entry.is_flagged) return entry.flag_severity ? `Flagged · ${entry.flag_severity}` : 'Flagged';
    return 'Not flagged';
  }, [entry]);

  async function saveBody() {
    if (!entry || reviewSaving) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await updateEntryReview(entry.id, { body: bodyDraft });
      setMode('read');
    } catch (error) { setReviewError(error instanceof Error ? error.message : 'Your edits could not be saved.'); }
    finally { setReviewSaving(false); }
  }

  async function markReviewed() {
    if (!entry || reviewSaving) return;
    setReviewSaving(true);
    setReviewError(null);
    try { await updateEntryReview(entry.id, { reviewed: true }); }
    catch (error) { setReviewError(error instanceof Error ? error.message : 'The review could not be saved.'); }
    finally { setReviewSaving(false); }
  }

  async function changeVisibility(next: ReviewVisibility) {
    if (!entry || reviewSaving || isCsvSource) return;
    setReviewSaving(true);
    setReviewError(null);
    try {
      await updateEntryReview(entry.id, { reviewVisibility: next });
      setVisibility(next);
    } catch (error) { setReviewError(error instanceof Error ? error.message : 'Visibility could not be saved.'); }
    finally { setReviewSaving(false); }
  }

  async function saveProvisionLink(provisionId: string | null) {
    if (!entry || reviewSaving) return;
    setReviewSaving(true);
    setReviewError(null);
    try { await linkEntryToCourtOrderProvision(entry.id, provisionId); }
    catch (error) { setReviewError(error instanceof Error ? error.message : 'The provision link could not be saved.'); }
    finally { setReviewSaving(false); }
  }

  async function addSelectedAttachment(source: 'photo' | 'document' | 'camera') {
    if (!entry || pickingAttachment || pendingAttachment) return;
    setPickingAttachment(source);
    setAttachmentNotice(null);
    const current = pinEntryContext();
    try {
      const picked = await pickEvidenceFile(source);
      if (!current()) { if (picked) await discardPickedEvidence(picked); return; }
      const selected = picked ? { ...picked, attachmentId: Crypto.randomUUID() } : null;
      if (!selected) {
        setAttachmentNotice('No attachment was selected.');
        return;
      }

      pendingAttachmentRef.current = selected;
      setPendingAttachment(selected);
      await persistSelectedAttachment(selected);
    } catch (err) {
      if (!mounted.current) return;
      setAttachmentNotice(
        err instanceof Error ? err.message : 'Unable to preserve the selected original file.',
      );
    } finally {
      if (mounted.current) setPickingAttachment(null);
    }
  }

  async function persistSelectedAttachment(selected: LocalAttachmentPick) {
    if (!entry) throw new Error('Reopen the entry before attaching its original.');
    const current = pinEntryContext();
    if (!current()) throw new Error('The account or entry changed before saving.');
    const result = await createLocalAttachment({ entryId: entry.id, ...selected });
    await discardPickedEvidence(selected);
    if (!current()) return;
    pendingAttachmentRef.current = null;
    setPendingAttachment(null);
    setAttachmentNotice(result.warning);
  }

  async function retrySelectedAttachment() {
    if (!pendingAttachment || pickingAttachment) return;
    setPickingAttachment('document');
    setAttachmentNotice(null);
    try { await persistSelectedAttachment(pendingAttachment); }
    catch (error) { setAttachmentNotice(error instanceof Error ? error.message : 'The original could not be saved. Retry this attachment.'); }
    finally { setPickingAttachment(null); }
  }

  async function discardSelectedAttachment() {
    if (!pendingAttachment || pickingAttachment) return;
    setPickingAttachment('document');
    try {
      await discardPickedEvidence(pendingAttachment);
      pendingAttachmentRef.current = null;
      setPendingAttachment(null);
      setAttachmentNotice('The pending selection was discarded.');
    } catch (error) { setAttachmentNotice(error instanceof Error ? error.message : 'The temporary copy could not be removed.'); }
    finally { setPickingAttachment(null); }
  }

  async function saveEntryVoiceMemo(memo: RecordedAudioMemo) {
    if (!entry) throw new Error('Reopen the entry before attaching the voice memo.');
    const attachmentId = voiceIds.current.get(memo.uri) ?? Crypto.randomUUID();
    voiceIds.current.set(memo.uri, attachmentId);

    const result = await createLocalAttachment({
      entryId: entry.id,
      attachmentId,
      kind: 'voice_memo',
      filename: memo.filename,
      mimeType: memo.mimeType,
      fileSizeBytes: memo.fileSizeBytes,
      durationMs: memo.durationMs,
      localUri: memo.uri,
      localReference: memo.localReference,
      sourceLabel: 'Local voice memo recording',
      capturedAt: memo.capturedAt,
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

  const rightRail = !isMobile ? (
    <View style={styles.rightRail}>
      <Text style={styles.railKicker}>CHAIN OF CUSTODY</Text>
      <View style={styles.railDivider} />
      <View style={styles.railRow}>
        <Text style={styles.railLabel}>Captured</Text>
        <Mono size={11} dim>{entry.created_at?.slice(0, 16) || '—'}</Mono>
      </View>
      <View style={styles.railRow}>
        <Text style={styles.railLabel}>Method</Text>
        <Text style={styles.railValue}>{entry.capture_method || 'Manual'}</Text>
      </View>
      <View style={styles.railRow}>
        <Text style={styles.railLabel}>Content hash</Text>
        <Mono size={10} dim numberOfLines={1}>
          {entry.content_hash ? `${entry.content_hash.slice(0, 12)}…` : '—'}
        </Mono>
      </View>
      <View style={styles.railRow}>
        <Text style={styles.railLabel}>Updated</Text>
        <Mono size={11} dim>{entry.updated_at?.slice(0, 16) || '—'}</Mono>
      </View>

      <View style={styles.railSection}>
        <Text style={styles.railKicker}>QUICK ACTIONS</Text>
        <PillButton
          tone={reviewed ? 'soft' : 'primary'}
          size="md"
          full
          icon="check"
          onPress={markReviewed}
          disabled={reviewed || reviewSaving}
        >
          {reviewed ? 'Reviewed' : 'Mark reviewed'}
        </PillButton>
        <View style={styles.railGap} />
        <PillButton
          tone="ghost"
          size="md"
          full
          icon="scales"
          onPress={() => router.push('/case-map' as never)}
        >
          Open Case Map
        </PillButton>
        <View style={styles.railGap} />
        <PillButton
          tone="ghost"
          size="md"
          full
          icon="doc"
          onPress={() => router.push({ pathname: '/export-prep', params: { entryId: entry.id } } as never)}
        >
          Prepare PDF or evidence ZIP
        </PillButton>
      </View>

      <View style={styles.railSection}>
        <Text style={styles.railKicker}>ENTRY ID</Text>
        <Mono size={11} dim numberOfLines={2}>{entry.id}</Mono>
      </View>
    </View>
  ) : undefined;

  return (
    <CaseScreen
      desktopMaxWidth={920}
      rightRail={rightRail}
      footer={
        mode === 'edit' ? (
          <View style={styles.footer}>
            <PillButton tone="primary" size="lg" full icon="check" disabled={!changed || reviewSaving} onPress={saveBody}>
              {reviewSaving ? 'Saving review edits' : 'Save review edits'}
            </PillButton>
          </View>
        ) : null
      }
    >
      {reviewError ? <InfoCallout title="Changes not saved" tone="ink">{reviewError}</InfoCallout> : null}
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.titleHeader}>
          <EntryMark type={entry.entry_type} size={36} />
          <View style={styles.titleHeaderCopy}>
            <Text style={styles.headerKicker}>{option.label.toUpperCase()}</Text>
            <Display size={isMobile ? 26 : 30} style={styles.title}>
              {entry.title || option.defaultTitle}
            </Display>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {formatDateLabel(entry.event_date, entry.event_time)} · {fbLegalCopy.legalInformationNotAdvice}
        </Text>
        <View style={styles.kickerRow}>
          {reviewed ? (
            <Chip tone="forest" outline={false}>
              Reviewed
            </Chip>
          ) : (
            <Chip tone="amber" outline={false}>
              Needs review
            </Chip>
          )}
          {entry.is_flagged ? (
            <Chip tone="ox" outline={false}>
              {entry.flag_severity ? `Flagged · ${entry.flag_severity}` : 'Flagged'}
            </Chip>
          ) : null}
          {filingLinkCount > 0 ? (
            <Chip tone="forest" outline={false}>
              {filingLinkCount === 1 ? 'Linked to 1 filing' : `Linked to ${filingLinkCount} filings`}
            </Chip>
          ) : null}
        </View>
      </View>

      {linkedCourtOrderProvision ? (
        <View style={styles.linkedBanner}>
          <Icon name="link" size={14} color={fbColors.ox} />
          <View style={styles.linkedBannerCopy}>
            <Text style={styles.linkedBannerTitle}>
              Linked to {linkedCourtOrder?.order_title || 'court order'} · {linkedCourtOrderProvision.label}
            </Text>
            <Text style={styles.linkedBannerSub}>
              {provisionCategoryLabel(linkedCourtOrderProvision.category)} ·{' '}
              {getCourtOrderProvisionStatus(linkedCourtOrderProvision)}
            </Text>
          </View>
        </View>
      ) : null}

      <SoftCard p={0} style={styles.section}>
        <View style={styles.factsHeader}>
          <Icon name={option.icon as IconName} size={15} color={fbColors.ink} />
          <Text style={styles.factsHeaderTitle}>The facts</Text>
        </View>
        <View style={styles.factsGrid}>
          {[
            ['Date', formatDateLabel(entry.event_date, entry.event_time)],
            ['Type', option.label],
            ['Child', child?.name || 'Not recorded'],
            ['Custody period', entry.custody_period || 'Not recorded'],
            ['Status', statusLabel],
            ['Review', reviewed ? 'Reviewed' : 'Needs review'],
          ].map(([key, value], i) => (
            <View key={i} style={styles.factsCell}>
              <Text style={styles.factsCellLabel}>{key.toUpperCase()}</Text>
              <Text style={styles.factsCellValue}>{value || 'Not recorded'}</Text>
            </View>
          ))}
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
        {isCsvSource ? <Text style={styles.sourceBody}>Private CSV source — contains the complete original, including any private fields. Only the separately reviewed imported entries may be shared.</Text> : <Segment<ReviewVisibility>
          items={[
            { v: 'court_ready', label: 'Court-ready' },
            { v: 'private', label: 'Private' },
          ]}
          value={visibility}
          disabled={reviewSaving}
          onChange={changeVisibility}
        />}
        {csvSourceEntryId ? <View style={{ gap: 8, marginTop: 12 }}>
          <Text style={styles.sourceBody}>Imported from CSV{typeof importProvenance?.rowIndex === 'number' ? `, data row ${importProvenance.rowIndex}` : ''}. Review this entry against the preserved original before sharing it.</Text>
          <PillButton tone="ghost" onPress={() => router.push({ pathname: '/entry/[id]', params: { id: csvSourceEntryId } } as never)}>Open private CSV source</PillButton>
        </View> : null}
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
              disabled={reviewSaving}
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
            editable={!reviewSaving}
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
            ? `${attachments.length} attachments are linked to this entry.`
            : 'Attach an original photo, document, or voice memo to this entry.'}
        </Text>
        <Text style={styles.sectionBody}>
          Originals are preserved without modification and checked with SHA-256. Maximum 25 MiB per file.
          Keep your source files until cloud backup is verified.
        </Text>
        <LocalAudioRecorder
          title="Record voice memo"
          body="Record a voice memo and attach the original audio to this entry. Maximum 25 MiB; no automatic transcription."
          saveLabel="Attach voice memo to entry"
          savedLabel="Original voice memo saved and verified on this device."
          onSave={saveEntryVoiceMemo}
          clearAfterSave
          disabled={Boolean(pickingAttachment || pendingAttachment)}
        />
        <View style={styles.attachmentActionGrid}>
          <PillButton
            tone="primary"
            size="md"
            icon="camera"
            full
            disabled={Boolean(pickingAttachment || pendingAttachment)}
            onPress={() => addSelectedAttachment('photo')}
          >
            {pickingAttachment === 'photo' ? 'Opening picker' : 'Select photo or image'}
          </PillButton>
          <PillButton
            tone="soft"
            size="md"
            icon="doc"
            full
            disabled={Boolean(pickingAttachment || pendingAttachment)}
            onPress={() => addSelectedAttachment('document')}
          >
            {pickingAttachment === 'document'
              ? 'Opening picker'
              : 'Select file or document'}
          </PillButton>
        </View>
        {attachmentNotice ? <Text style={styles.attachmentNotice}>{attachmentNotice}</Text> : null}
        {pendingAttachment ? <View style={styles.attachmentStack}>
          <Text style={styles.sectionBody}>{pendingAttachment.filename} is pending. Retry to preserve the same attachment.</Text>
          <PillButton tone="primary" disabled={Boolean(pickingAttachment)} onPress={retrySelectedAttachment}>Retry attachment</PillButton>
          <PillButton tone="ghost" disabled={Boolean(pickingAttachment)} onPress={discardSelectedAttachment}>Discard pending selection</PillButton>
        </View> : null}
        {attachments.length ? (
          <View style={styles.attachmentStack}>
            {attachments.map((attachment) => (
              <AttachmentRecord key={attachment.id} attachment={attachment} />
            ))}
          </View>
        ) : null}
        <Rule />
        <View style={styles.attachmentActionGrid}>
          <PillButton tone="soft" icon="camera" disabled={Boolean(pickingAttachment || pendingAttachment)} onPress={() => addSelectedAttachment('camera')}>
            {pickingAttachment === 'camera' ? 'Opening camera' : 'Capture photo'}
          </PillButton>
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
              disabled={reviewSaving}
              onPress={() => saveProvisionLink(null)}
            >
              Remove local provision link
            </PillButton>
          </View>
        ) : (
          <Text style={styles.sectionBody}>
            No court-order provision is linked yet. Select a provision below to connect this entry to specific order language.
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
                    disabled={selected || reviewSaving}
                    onPress={() => saveProvisionLink(provision.id)}
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

      <InfoCallout title="Your recorded facts" tone="ink">
        This entry contains your recorded and reviewed text. AI summaries and pattern analysis are not available.
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
          Prepare PDF or evidence ZIP
        </PillButton>
      </SoftCard>

      {isMobile ? (
        <View style={styles.reviewActions}>
          <PillButton
            tone={reviewed ? 'soft' : 'primary'}
            size="lg"
            full
            icon="check"
            onPress={markReviewed}
            disabled={reviewed || reviewSaving}
          >
            {reviewed ? 'Reviewed' : 'Mark reviewed'}
          </PillButton>
        </View>
      ) : null}
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: fbSpacing.x3,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    marginTop: fbSpacing.x2,
  },
  titleHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerKicker: {
    color: fbColors.ox,
    fontSize: 11,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 4,
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
  linkedBanner: {
    marginTop: fbSpacing.x4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: fbRadii.md,
    backgroundColor: '#F4E3DE',
    borderWidth: fbBorder.hairline,
    borderColor: 'rgba(180,64,40,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkedBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  linkedBannerTitle: {
    color: fbColors.ink,
    fontSize: 12.5,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  linkedBannerSub: {
    marginTop: 1,
    color: fbColors.inkSoft,
    fontSize: 11,
    fontFamily: fbFonts.sansRegular,
  },
  factsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: fbSpacing.x3,
    paddingHorizontal: fbSpacing.x4,
    borderBottomWidth: fbBorder.hairline,
    borderBottomColor: fbColors.ruleSoft,
  },
  factsHeaderTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: fbSpacing.x4,
    paddingVertical: fbSpacing.x4,
    rowGap: fbSpacing.x3,
  },
  factsCell: {
    width: '50%',
  },
  factsCellLabel: {
    color: fbColors.inkMute,
    fontSize: 10,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  factsCellValue: {
    marginTop: 3,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  rightRail: {
    paddingHorizontal: fbSpacing.x4,
    paddingTop: fbSpacing.x4,
    gap: fbSpacing.x2,
  },
  railKicker: {
    color: fbColors.inkMute,
    fontSize: 10.5,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    marginBottom: fbSpacing.x2,
  },
  railDivider: {
    height: fbBorder.hairline,
    backgroundColor: fbColors.ruleSoft,
    marginBottom: fbSpacing.x2,
  },
  railRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  railLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansRegular,
  },
  railValue: {
    color: fbColors.ink,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
  },
  railSection: {
    marginTop: fbSpacing.x5,
  },
  railGap: {
    height: fbSpacing.x2,
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
