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
  useEntryDetail,
  useUpdateEntryReview,
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

export default function EntryDetail() {
  const params = useLocalSearchParams();
  const entryId = getParam(params.id);
  const updateEntryReview = useUpdateEntryReview();
  const { entry, child, attachments, loading } = useEntryDetail(entryId);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [bodyDraft, setBodyDraft] = useState('');
  const [visibility, setVisibility] = useState<ReviewVisibility>('court_ready');
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
        <SectionTitle icon="paperclip" title="Evidence and attachments" />
        <Text style={styles.sectionBody}>
          {attachments.length
            ? `${attachments.length} attachment records are linked to this entry.`
            : 'No evidence is attached yet. File uploads will be added after storage policy review.'}
        </Text>
        <ComingLaterButton icon="paperclip">Add evidence</ComingLaterButton>
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
