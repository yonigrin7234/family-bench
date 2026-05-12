import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EntryCard } from '@/components/case-intelligence/EntryCard';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  ProgressBar,
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
  formatDateLabel,
  getEntryTypeOption,
  getRelativeDueLabel,
  useFilingBuilder,
  type EvidenceAttachment,
  type FilingChecklistKey,
  type FilingPackage,
  type FilingPackageLocalState,
  type FilingPackageStatus,
  type KeyDate,
  type ReportPreviewType,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

type FilingTypeOption = {
  value: string;
  label: string;
  tone: ChipTone;
};

const FILING_TYPES: FilingTypeOption[] = [
  { value: 'request_for_order', label: 'Request for order', tone: 'ink' },
  { value: 'response', label: 'Response', tone: 'sand' },
  { value: 'custody_visitation', label: 'Custody / visitation', tone: 'forest' },
  { value: 'compliance_packet', label: 'Compliance packet', tone: 'amber' },
  { value: 'expense_support', label: 'Expense support', tone: 'ox' },
];

const REPORT_OPTIONS: Array<{ value: ReportPreviewType; label: string; icon: IconName }> = [
  { value: 'timeline', label: 'Timeline summary', icon: 'clock' },
  { value: 'flagged', label: 'Flagged entries report', icon: 'flag' },
  { value: 'communication', label: 'Communication summary', icon: 'chat' },
  { value: 'medical', label: 'Medical summary', icon: 'shield' },
  { value: 'custodyExchange', label: 'Custody/exchange summary placeholder', icon: 'home' },
];

const CHECKLIST_ITEMS: Array<{ value: FilingChecklistKey; label: string; body: string }> = [
  {
    value: 'forms',
    label: 'Forms',
    body: 'Placeholder for required court forms and local form rules.',
  },
  {
    value: 'exhibits',
    label: 'Exhibits',
    body: 'Placeholder for source entries, attachments, and exhibit labels.',
  },
  {
    value: 'declarations',
    label: 'Declarations',
    body: 'Placeholder for declaration drafting. AI drafting is not enabled.',
  },
  {
    value: 'service',
    label: 'Service',
    body: 'Placeholder for service tracking and proof of service.',
  },
];

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusLabel(status: string) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'ready_for_review') return 'Ready for review';
  return 'Draft';
}

function statusTone(status: string): ChipTone {
  if (status === 'ready_for_review') return 'forest';
  if (status === 'in_progress') return 'amber';
  return 'mute';
}

function filingTypeLabel(value: string) {
  return FILING_TYPES.find((option) => option.value === value)?.label ?? value.replace(/_/g, ' ');
}

function titleForEntry(entry: { title: string | null; entry_type: string }) {
  return entry.title || getEntryTypeOption(entry.entry_type).defaultTitle;
}

function attachmentKind(attachment: EvidenceAttachment) {
  if (attachment.file_type === 'voice_memo' || attachment.mime_type?.startsWith('audio/')) return 'Voice memo';
  if (attachment.file_type === 'document') return 'Document';
  if (attachment.file_type === 'screenshot') return 'Screenshot';
  if (attachment.mime_type?.startsWith('image/')) return 'Photo';
  return attachment.file_type || 'Attachment';
}

function attachmentIcon(attachment: EvidenceAttachment): IconName {
  if (attachment.file_type === 'voice_memo' || attachment.mime_type?.startsWith('audio/')) return 'mic';
  if (attachment.file_type === 'document') return 'doc';
  return 'paperclip';
}

function attachmentCountForEntry(attachments: EvidenceAttachment[], entryId: string) {
  return attachments.filter((attachment) => attachment.entry_id === entryId).length;
}

function linkedCount(state: FilingPackageLocalState | null) {
  if (!state) return 0;
  return state.linkedEntryIds.length + state.linkedAttachmentIds.length + state.linkedReportTypes.length;
}

function checklistProgress(state: FilingPackageLocalState | null) {
  if (!state) return 0;
  const completed = CHECKLIST_ITEMS.filter((item) => state.checklist[item.value]).length;
  return Math.round((completed / CHECKLIST_ITEMS.length) * 100);
}

function PackageCard({
  filingPackage,
  packageState,
  active,
  onPress,
}: {
  filingPackage: FilingPackage;
  packageState: FilingPackageLocalState | null;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Open filing package: ${filingPackage.title}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <SoftCard p={14} style={[styles.packageCard, active && styles.packageCardActive]}>
        <View style={styles.packageHeader}>
          <View style={styles.packageTitleCopy}>
            <Text style={styles.packageTitle}>{filingPackage.title}</Text>
            <Text style={styles.packageMeta}>
              {filingTypeLabel(filingPackage.filing_type)} · Due date placeholder:{' '}
              {filingPackage.due_date || 'not set'}
            </Text>
          </View>
          <Chip tone={statusTone(filingPackage.status)} outline={false}>
            {statusLabel(filingPackage.status)}
          </Chip>
        </View>
        <ProgressBar pct={filingPackage.completion_percent} label="Checklist progress" />
        <View style={styles.packageMetricRow}>
          <Text style={styles.packageMeta}>{packageState?.linkedEntryIds.length ?? 0} entries</Text>
          <Text style={styles.packageMeta}>{packageState?.linkedReportTypes.length ?? 0} reports</Text>
          <Text style={styles.packageMeta}>{linkedCount(packageState)} total links</Text>
        </View>
      </SoftCard>
    </Pressable>
  );
}

function ChecklistRow({
  item,
  completed,
  onToggle,
}: {
  item: (typeof CHECKLIST_ITEMS)[number];
  completed: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed }}
      accessibilityLabel={`${item.label} checklist item`}
      onPress={onToggle}
      style={({ pressed }) => [styles.checklistRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, completed && styles.checkboxActive]}>
        {completed ? <Icon name="check" size={14} color={fbColors.paper} /> : null}
      </View>
      <View style={styles.checklistCopy}>
        <Text style={styles.rowTitle}>{item.label}</Text>
        <Text style={styles.rowBody}>{item.body}</Text>
      </View>
    </Pressable>
  );
}

function ReportLinkRow({
  report,
  linked,
  onToggle,
}: {
  report: (typeof REPORT_OPTIONS)[number];
  linked: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.linkRow}>
      <View style={styles.rowIcon}>
        <Icon name={report.icon} size={15} color={fbColors.ink} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{report.label}</Text>
        <Text style={styles.rowBody}>Report preview source. Final court PDF generation comes later.</Text>
      </View>
      <PillButton tone={linked ? 'soft' : 'primary'} size="sm" icon={linked ? 'check' : 'plus'} onPress={onToggle}>
        {linked ? 'Linked' : 'Link'}
      </PillButton>
    </View>
  );
}

function AttachmentLinkRow({
  attachment,
  linked,
  onToggle,
}: {
  attachment: EvidenceAttachment;
  linked: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.linkRow}>
      <View style={styles.rowIcon}>
        <Icon name={attachmentIcon(attachment)} size={15} color={fbColors.ink} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{attachment.file_name}</Text>
        <Text style={styles.rowBody}>{attachmentKind(attachment)} · Local metadata only</Text>
      </View>
      <PillButton tone={linked ? 'soft' : 'primary'} size="sm" icon={linked ? 'check' : 'plus'} onPress={onToggle}>
        {linked ? 'Linked' : 'Link'}
      </PillButton>
    </View>
  );
}

function ExhibitPlaceholders({ packageState }: { packageState: FilingPackageLocalState }) {
  return (
    <View style={styles.exhibitStack}>
      {packageState.exhibitGroups.map((group) => (
        <View key={group.id} style={styles.exhibitGroup}>
          <View style={styles.exhibitHeader}>
            <Text style={styles.rowTitle}>{group.label}</Text>
            <Chip tone="sand" outline={false}>
              Placeholder
            </Chip>
          </View>
          <Text style={styles.rowBody}>
            {group.entryIds.length} entries · {group.attachmentIds.length} attachments. Ordering controls are
            reserved for a later filing-package pass.
          </Text>
          <View style={styles.actionRow}>
            <PillButton tone="ghost" size="sm" icon="caret" disabled>
              Move up coming later
            </PillButton>
            <PillButton tone="ghost" size="sm" icon="caret" disabled>
              Move down coming later
            </PillButton>
          </View>
        </View>
      ))}
    </View>
  );
}

function FilingWorkstationRail({
  packageCount,
  selectedTitle,
  selectedPackage,
  selectedPackageState,
  selectedLinkedCount,
  linkedEntriesCount,
  linkedAttachmentsCount,
  linkedReportsCount,
  nextKeyDate,
  checklistPercent,
  persistenceActive,
  onToggleChecklist,
}: {
  packageCount: number;
  selectedTitle?: string;
  selectedPackage: FilingPackage | null;
  selectedPackageState: FilingPackageLocalState | null;
  selectedLinkedCount: number;
  linkedEntriesCount: number;
  linkedAttachmentsCount: number;
  linkedReportsCount: number;
  nextKeyDate: KeyDate | null;
  checklistPercent?: number;
  persistenceActive: boolean;
  onToggleChecklist: (item: FilingChecklistKey) => void;
}) {
  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>WORKSTATION RAIL</Text>
      <Text style={styles.railValue}>{packageCount} packages</Text>
      <Text style={styles.railText}>{selectedTitle || 'No package selected'}</Text>
      <Rule />
      {selectedPackage && selectedPackageState ? (
        <View style={styles.railSection}>
          <Text style={styles.railSectionTitle}>Checklist</Text>
          {CHECKLIST_ITEMS.map((item) => (
            <Pressable
              key={item.value}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedPackageState.checklist[item.value] }}
              accessibilityLabel={`${item.label} checklist item`}
              onPress={() => onToggleChecklist(item.value)}
              style={({ pressed }) => [styles.railChecklistRow, pressed && styles.pressed]}
            >
              <View style={[styles.railCheckbox, selectedPackageState.checklist[item.value] && styles.checkboxActive]}>
                {selectedPackageState.checklist[item.value] ? (
                  <Icon name="check" size={12} color={fbColors.paper} />
                ) : null}
              </View>
              <Text style={styles.railChecklistText}>{item.label}</Text>
            </Pressable>
          ))}
          <View style={styles.railChecklistRow}>
            <View style={styles.railCheckbox} />
            <Text style={styles.railChecklistText}>Review placeholder</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.railText}>Select a package to review checklist and exhibit context.</Text>
      )}
      <Rule />
      <View style={styles.railSection}>
        <Text style={styles.railSectionTitle}>Exhibit context</Text>
        <Text style={styles.railText}>
          Exhibit groups are local placeholders. Drag ordering, final labels, court PDFs, and e-filing come later.
        </Text>
      </View>
      <Rule />
      <View style={styles.railSection}>
        <Text style={styles.railSectionTitle}>Date context</Text>
        <Text style={styles.railText}>
          {nextKeyDate
            ? `${nextKeyDate.title} · ${formatDateLabel(nextKeyDate.event_date, nextKeyDate.event_time)} · ${getRelativeDueLabel(nextKeyDate.event_date)}`
            : 'No upcoming key date is recorded for this case.'}
        </Text>
      </View>
      <Rule />
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Organization aid</Text>
        <Text style={styles.warningText}>This is an organization aid, not a filed document.</Text>
      </View>
      <Rule />
      <Text style={styles.railText}>
        {selectedLinkedCount} linked source items: {linkedEntriesCount} entries, {linkedAttachmentsCount} attachments, {linkedReportsCount} report previews.
      </Text>
      <Text style={styles.railText}>
        Checklist {typeof checklistPercent === 'number' ? `${checklistPercent}%` : 'not started'}. Local persistence {persistenceActive ? 'active' : 'inactive'}.
      </Text>
    </SoftCard>
  );
}

export default function Filings() {
  const params = useLocalSearchParams();
  const packageIdParam = getParam(params.packageId);
  const {
    activeCase,
    filingPackages,
    selectedPackage,
    selectedPackageState,
    filingBuilderState,
    entries,
    attachments,
    keyDates,
    filingEntryLinkCounts,
    createFilingPackage,
    selectFilingPackage,
    updateFilingPackageStatus,
    toggleFilingPackageEntry,
    toggleFilingPackageAttachment,
    toggleFilingPackageReport,
    toggleFilingPackageChecklist,
    loading,
    persistence,
  } = useFilingBuilder();
  const { isMobile, width } = useResponsive();
  const [title, setTitle] = useState('');
  const [filingType, setFilingType] = useState(FILING_TYPES[0].value);
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (packageIdParam && filingPackages.some((filingPackage) => filingPackage.id === packageIdParam)) {
      selectFilingPackage(packageIdParam);
    }
  }, [filingPackages, packageIdParam, selectFilingPackage]);

  const linkedEntries = useMemo(() => {
    if (!selectedPackageState) return [];
    const linkedIds = new Set(selectedPackageState.linkedEntryIds);
    return entries.filter((entry) => linkedIds.has(entry.id));
  }, [entries, selectedPackageState]);

  async function createPackage() {
    if (creating) return;
    setCreating(true);
    setNotice(null);

    try {
      const result = await createFilingPackage({
        title: title.trim() || `${filingTypeLabel(filingType)} package`,
        filingType,
        dueDate,
        status: 'draft',
      });
      setTitle('');
      setDueDate('');
      setNotice(`${result.filingPackage.title} was saved locally. No remote write was made.`);
      router.setParams({ packageId: result.filingPackage.id });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to create the filing package locally.');
    } finally {
      setCreating(false);
    }
  }

  const selectedLinkedCount = linkedCount(selectedPackageState);
  const selectedEntryCount = selectedPackageState?.linkedEntryIds.length ?? 0;
  const selectedAttachmentCount = selectedPackageState?.linkedAttachmentIds.length ?? 0;
  const selectedReportCount = selectedPackageState?.linkedReportTypes.length ?? 0;
  const nextKeyDate = keyDates.find((keyDate) => !keyDate.is_completed) ?? null;
  const showDesktopRail = !isMobile && width >= 1280;

  return (
    <CaseScreen
      desktopMaxWidth={1180}
      contentStyle={!isMobile ? styles.filingDesktopContent : undefined}
      rightRail={
        showDesktopRail ? (
          <FilingWorkstationRail
            packageCount={filingPackages.length}
            selectedTitle={selectedPackage?.title}
            selectedPackage={selectedPackage}
            selectedPackageState={selectedPackageState}
            selectedLinkedCount={selectedLinkedCount}
            linkedEntriesCount={selectedEntryCount}
            linkedAttachmentsCount={selectedAttachmentCount}
            linkedReportsCount={selectedReportCount}
            nextKeyDate={nextKeyDate}
            checklistPercent={checklistProgress(selectedPackageState)}
            persistenceActive={persistence.active}
            onToggleChecklist={(item) => {
              if (selectedPackage) toggleFilingPackageChecklist(selectedPackage.id, item);
            }}
          />
        ) : (
          false
        )
      }
    >
      <View style={styles.header}>
        <Display size={32} style={styles.title}>
          Filing Builder
        </Display>
        <Text style={styles.subtitle}>
          Group entries, attachments, and report previews into local filing-package structures.{' '}
          {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <View style={!isMobile ? styles.desktopFilingsGrid : undefined}>
        <View style={!isMobile ? styles.desktopListColumn : undefined}>
      <SoftCard p={16} style={[styles.createCard, !isMobile && styles.desktopPanelCard]}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionTitleLeft}>
            <Icon name="folder" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>New filing package</Text>
          </View>
          <Chip tone={persistence.active ? 'forest' : 'amber'} outline={false}>
            Local persistence {persistence.active ? 'active' : 'inactive'}
          </Chip>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: May hearing evidence packet"
            placeholderTextColor={fbColors.inkFaint}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Filing type</Text>
          <View style={styles.chipWrap}>
            {FILING_TYPES.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: filingType === option.value }}
                accessibilityLabel={`Filing type: ${option.label}`}
                onPress={() => setFilingType(option.value)}
                style={({ pressed }) => [
                  styles.filterChip,
                  filingType === option.value && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Chip tone={option.tone} outline={filingType !== option.value}>
                  {option.label}
                </Chip>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Due date placeholder</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD optional"
            placeholderTextColor={fbColors.inkFaint}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <PillButton tone="primary" size="lg" icon="plus" full disabled={creating} onPress={createPackage}>
          {creating ? 'Saving locally' : 'Create filing package'}
        </PillButton>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </SoftCard>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionLabel}>FILING PACKAGES</Text>
        <Text style={styles.resultCount}>
          {loading ? 'Loading' : `${filingPackages.length} packages`} · {activeCase?.title || 'Current case'}
        </Text>
      </View>

      {filingPackages.length ? (
        <View style={styles.packageStack}>
          {filingPackages.map((filingPackage) => (
            <PackageCard
              key={filingPackage.id}
              filingPackage={filingPackage}
              packageState={filingBuilderState.packageStates[filingPackage.id] ?? null}
              active={selectedPackage?.id === filingPackage.id}
              onPress={() => {
                selectFilingPackage(filingPackage.id);
                router.setParams({ packageId: filingPackage.id });
              }}
            />
          ))}
        </View>
      ) : (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No filing packages yet</Text>
          <Text style={styles.emptyBody}>
            Create a draft package to group local entries, evidence metadata, and report previews. No PDF or e-filing is generated.
          </Text>
        </SoftCard>
      )}
        </View>

        <View style={!isMobile ? styles.desktopDetailColumn : undefined}>
      {selectedPackage && selectedPackageState ? (
        <View style={[styles.detailStack, !isMobile && styles.desktopDetailStack]}>
          <SoftCard p={16} style={styles.detailCard}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleLeft}>
                <Icon name="scales" size={16} color={fbColors.ink} />
                <Text style={styles.sectionTitle}>{selectedPackage.title}</Text>
              </View>
              <Chip tone={statusTone(selectedPackage.status)} outline={false}>
                {statusLabel(selectedPackage.status)}
              </Chip>
            </View>
            <Text style={styles.sectionBody}>
              {filingTypeLabel(selectedPackage.filing_type)} · Due date placeholder:{' '}
              {selectedPackage.due_date || 'not set'}
            </Text>
            <Segment<FilingPackageStatus>
              items={[
                { v: 'draft', label: 'Draft' },
                { v: 'in_progress', label: 'In progress' },
                { v: 'ready_for_review', label: 'Ready for review' },
              ]}
              value={selectedPackage.status as FilingPackageStatus}
              onChange={(status) => updateFilingPackageStatus(selectedPackage.id, status)}
            />
            <ProgressBar pct={selectedPackage.completion_percent} label="Checklist progress" />
          </SoftCard>

          {isMobile ? (
            <SoftCard p={16} style={styles.detailCard}>
              <Text style={styles.sectionLabel}>CHECKLIST PLACEHOLDER</Text>
              {CHECKLIST_ITEMS.map((item) => (
                <ChecklistRow
                  key={item.value}
                  item={item}
                  completed={selectedPackageState.checklist[item.value]}
                  onToggle={() => toggleFilingPackageChecklist(selectedPackage.id, item.value)}
                />
              ))}
            </SoftCard>
          ) : null}

          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK ENTRIES</Text>
            <Text style={styles.sectionBody}>
              Select factual source entries for this package. Private notes stay separate from court-ready material.
            </Text>
            <View style={styles.entryStack}>
              {entries.map((entry) => {
                const linked = selectedPackageState.linkedEntryIds.includes(entry.id);
                return (
                  <View key={entry.id} style={styles.entryLinkBlock}>
                    <EntryCard
                      entry={entry}
                      attachmentCount={attachmentCountForEntry(attachments, entry.id)}
                      filingLinkCount={filingEntryLinkCounts[entry.id] ?? 0}
                      compact
                      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } } as never)}
                    />
                    <PillButton
                      tone={linked ? 'soft' : 'primary'}
                      size="sm"
                      icon={linked ? 'check' : 'plus'}
                      onPress={() => toggleFilingPackageEntry(selectedPackage.id, entry.id)}
                    >
                      {linked ? 'Linked to filing' : 'Link entry'}
                    </PillButton>
                  </View>
                );
              })}
            </View>
          </SoftCard>

          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK REPORT PREVIEWS</Text>
            {REPORT_OPTIONS.map((report) => (
              <ReportLinkRow
                key={report.value}
                report={report}
                linked={selectedPackageState.linkedReportTypes.includes(report.value)}
                onToggle={() => toggleFilingPackageReport(selectedPackage.id, report.value)}
              />
            ))}
          </SoftCard>

          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>LINK ATTACHMENTS</Text>
            <Text style={styles.sectionBody}>
              Attachment links use local metadata only. Uploads and storage sync are not enabled.
            </Text>
            {attachments.length ? (
              attachments.map((attachment) => (
                <AttachmentLinkRow
                  key={attachment.id}
                  attachment={attachment}
                  linked={selectedPackageState.linkedAttachmentIds.includes(attachment.id)}
                  onToggle={() => toggleFilingPackageAttachment(selectedPackage.id, attachment.id)}
                />
              ))
            ) : (
              <Text style={styles.emptyBody}>No local attachment metadata is available yet.</Text>
            )}
          </SoftCard>

          <SoftCard p={16} style={styles.detailCard}>
            <Text style={styles.sectionLabel}>EXHIBIT GROUPING PLACEHOLDERS</Text>
            <ExhibitPlaceholders packageState={selectedPackageState} />
            {linkedEntries.length ? (
              <Text style={styles.sectionBody}>
                Current linked entries begin with {titleForEntry(linkedEntries[0])}. Exhibit labels and reordering are placeholders.
              </Text>
            ) : null}
          </SoftCard>

          <InfoCallout title="Filing limits" tone="ink">
            This builder groups local records only. It does not draft declarations with AI, generate final court PDFs, e-file, upload evidence, or write to Supabase.
          </InfoCallout>

          <View style={styles.actionRow}>
            <PillButton tone="ghost" size="md" icon="doc" disabled>
              Final court PDF coming later
            </PillButton>
            <PillButton tone="ghost" size="md" icon="upload" disabled>
              E-filing coming later
            </PillButton>
          </View>
        </View>
      ) : !isMobile ? (
        <SoftCard p={18} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Select a filing package</Text>
          <Text style={styles.emptyBody}>
            Choose a local filing package from the list, or create a draft package to start grouping source records.
          </Text>
        </SoftCard>
      ) : null}
        </View>
      </View>

      <Rule style={styles.bottomRule} />
      <Text style={styles.footerNote}>
        Filing Builder is local-first and factual. It does not provide legal advice or determine which filing is appropriate.
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
  filingDesktopContent: {
    paddingHorizontal: fbSpacing.x4,
  },
  createCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopPanelCard: {
    marginTop: 0,
  },
  desktopFilingsGrid: {
    marginTop: fbSpacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x5,
  },
  desktopListColumn: {
    width: 340,
  },
  desktopDetailColumn: {
    flex: 1,
    minWidth: 0,
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
  },
  field: {
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
  input: {
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
  chipWrap: {
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
  notice: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
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
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: fbFonts.sansRegular,
  },
  packageStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  packageCard: {
    gap: fbSpacing.x3,
  },
  packageCardActive: {
    borderColor: fbColors.ox,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  packageTitleCopy: {
    flex: 1,
  },
  packageTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  packageMeta: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  packageMetricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
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
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  detailStack: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  desktopDetailStack: {
    marginTop: 0,
  },
  detailCard: {
    gap: fbSpacing.x4,
  },
  sectionBody: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  checklistRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: fbRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: fbBorder.selected,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  checkboxActive: {
    backgroundColor: fbColors.ink,
    borderColor: fbColors.ink,
  },
  checklistCopy: {
    flex: 1,
  },
  rowTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  rowBody: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  linkRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.paperDeep,
  },
  rowCopy: {
    flex: 1,
  },
  entryStack: {
    gap: fbSpacing.x3,
  },
  entryLinkBlock: {
    gap: fbSpacing.x2,
  },
  exhibitStack: {
    gap: fbSpacing.x3,
  },
  exhibitGroup: {
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.paperDeep,
    gap: fbSpacing.x2,
  },
  exhibitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
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
  railChecklistRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  railCheckbox: {
    width: 22,
    height: 22,
    borderRadius: fbRadii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: fbBorder.selected,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  railChecklistText: {
    flex: 1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  warningBox: {
    gap: fbSpacing.x1,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.sandDeep,
    backgroundColor: fbColors.sandWash,
  },
  warningTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  warningText: {
    color: fbColors.inkSoft,
    fontSize: fbType.small,
    lineHeight: 18,
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
