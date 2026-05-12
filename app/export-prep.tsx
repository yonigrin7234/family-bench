import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
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
  type IconName,
} from '@/components/ui/fb';
import {
  formatDateLabel,
  getEntryTypeOption,
  useCaseIntelligenceHome,
  useReportPreviewState,
  type Entry,
} from '@/lib/case-intelligence';

type ExportMode = 'entry' | 'case' | 'report';

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function titleForEntry(entry: Entry) {
  return entry.title || getEntryTypeOption(entry.entry_type).defaultTitle;
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <View style={styles.jsonBox}>
      <Text selectable style={styles.jsonText}>
        {JSON.stringify(value, null, 2)}
      </Text>
    </View>
  );
}

function EntrySelector({
  entries,
  selectedEntryId,
  onSelect,
}: {
  entries: Entry[];
  selectedEntryId: string | null;
  onSelect: (entryId: string) => void;
}) {
  return (
    <SoftCard p={16} style={styles.selectorCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Icon name="doc" size={16} color={fbColors.ink} />
          <Text style={styles.sectionTitle}>Entry JSON preview</Text>
        </View>
        <Chip tone={entries.length ? 'ink' : 'mute'} outline={false}>
          {entries.length}
        </Chip>
      </View>
      {entries.length ? (
        <View style={styles.entryStack}>
          {entries.slice(0, 8).map((entry) => {
            const option = getEntryTypeOption(entry.entry_type);
            const selected = selectedEntryId === entry.id;
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select export entry ${titleForEntry(entry)}`}
                onPress={() => onSelect(entry.id)}
                style={({ pressed }) => [
                  styles.entryRow,
                  selected && styles.entryRowSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Icon name={option.icon as IconName} size={14} color={fbColors.ink} />
                <View style={styles.entryCopy}>
                  <Text style={styles.entryTitle}>{titleForEntry(entry)}</Text>
                  <Text style={styles.entryMeta}>
                    {formatDateLabel(entry.event_date, entry.event_time)} · {option.shortLabel}
                  </Text>
                </View>
                {selected ? (
                  <Chip tone="forest" outline={false}>
                    Selected
                  </Chip>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={styles.bodyText}>No entries are available for export preview yet.</Text>
      )}
    </SoftCard>
  );
}

export default function ExportPrepRoute() {
  const params = useLocalSearchParams();
  const routeEntryId = getParam(params.entryId);
  const initialMode = getParam(params.mode);
  const { snapshot, home, persistence } = useCaseIntelligenceHome();
  const { reportPreviewState, savedReportVersions } = useReportPreviewState();
  const entries = home.activeCase
    ? snapshot.entries
        .filter((entry) => !entry.deleted_at && entry.case_id === home.activeCase?.id)
        .sort((a, b) =>
          `${b.event_date}T${b.event_time ?? '00:00:00'}`.localeCompare(
            `${a.event_date}T${a.event_time ?? '00:00:00'}`,
          ),
        )
    : [];
  const [mode, setMode] = useState<ExportMode>(
    initialMode === 'case' || initialMode === 'report' ? initialMode : 'entry',
  );
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(
    routeEntryId ?? entries[0]?.id ?? null,
  );
  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) ?? null;

  useEffect(() => {
    if (routeEntryId) {
      setSelectedEntryId(routeEntryId);
      setMode('entry');
    }
  }, [routeEntryId]);

  const entryExportPreview = useMemo(() => {
    if (!selectedEntry) return null;

    return {
      export_type: 'single_entry_json_preview',
      export_status: 'preview_only_no_file_created',
      provenance_warning:
        'Review source text, attachments, and local metadata before using any export in a formal setting.',
      entry: selectedEntry,
      attachments: snapshot.evidenceAttachments.filter(
        (attachment) => !attachment.deleted_at && attachment.entry_id === selectedEntry.id,
      ),
      linked_case: home.activeCase,
    };
  }, [home.activeCase, selectedEntry, snapshot.evidenceAttachments]);

  const caseArchivePreview = useMemo(() => {
    const caseId = home.activeCase?.id;
    return {
      export_type: 'case_archive_json_preview',
      export_status: 'preview_only_no_archive_created',
      source: home.source,
      persistence,
      case: home.activeCase,
      children: snapshot.children.filter((child) => !child.deleted_at && child.case_id === caseId),
      people: snapshot.people.filter((person) => !person.deleted_at && person.case_id === caseId),
      entries,
      attachments: snapshot.evidenceAttachments.filter(
        (attachment) => !attachment.deleted_at && (!caseId || attachment.case_id === caseId),
      ),
      court_orders: snapshot.courtOrders.filter((order) => !order.deleted_at && order.case_id === caseId),
      court_order_provisions: snapshot.courtOrderProvisions.filter(
        (provision) => !provision.deleted_at && provision.case_id === caseId,
      ),
      key_dates: snapshot.keyDates.filter((keyDate) => !keyDate.deleted_at && keyDate.case_id === caseId),
      filing_packages: snapshot.filingPackages.filter(
        (filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === caseId,
      ),
    };
  }, [entries, home.activeCase, home.source, persistence, snapshot]);

  const reportExportPreview = {
    export_type: 'report_export_placeholder',
    export_status: 'pdf_print_generation_coming_later',
    active_report_filters: reportPreviewState,
    saved_report_versions: savedReportVersions,
    provenance_warning:
      'Report exports should preserve source entry references and attachment counts. Final PDFs are not generated yet.',
  };

  return (
    <CaseScreen desktopMaxWidth={1060}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Local preview
          </Chip>
          <Chip tone="mute" outline={false}>
            No file generated
          </Chip>
        </View>
        <Display size={32} style={styles.title}>
          Export preparation
        </Display>
        <Text style={styles.subtitle}>
          Preview local JSON structures before export features are added. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <InfoCallout title="Export limits" tone="ink">
        This page does not create PDFs, print output, downloads, cloud uploads, or remote writes. It shows the local data shape that future export tools can use.
      </InfoCallout>

      <SoftCard p={16} style={styles.controlsCard}>
        <Segment<ExportMode>
          items={[
            { v: 'entry', label: 'Entry JSON' },
            { v: 'case', label: 'Case archive' },
            { v: 'report', label: 'Report export' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </SoftCard>

      {mode === 'entry' ? (
        <>
          <EntrySelector
            entries={entries}
            selectedEntryId={selectedEntryId}
            onSelect={setSelectedEntryId}
          />
          <SoftCard p={16} style={styles.previewCard}>
            <Text style={styles.sectionLabel}>SINGLE ENTRY JSON PREVIEW</Text>
            {entryExportPreview ? (
              <JsonPreview value={entryExportPreview} />
            ) : (
              <Text style={styles.bodyText}>Select an entry to preview JSON export data.</Text>
            )}
          </SoftCard>
        </>
      ) : null}

      {mode === 'case' ? (
        <SoftCard p={16} style={styles.previewCard}>
          <Text style={styles.sectionLabel}>CASE ARCHIVE JSON PREVIEW</Text>
          <JsonPreview value={caseArchivePreview} />
        </SoftCard>
      ) : null}

      {mode === 'report' ? (
        <SoftCard p={16} style={styles.previewCard}>
          <Text style={styles.sectionLabel}>REPORT EXPORT PLACEHOLDER</Text>
          <Text style={styles.bodyText}>
            Report PDF and print generation come later. Saved report versions remain local until a future export workflow is added.
          </Text>
          <Rule />
          <JsonPreview value={reportExportPreview} />
        </SoftCard>
      ) : null}
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
  controlsCard: {
    marginTop: fbSpacing.x4,
  },
  selectorCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  previewCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  sectionHeader: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  sectionTitleRow: {
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
  sectionLabel: {
    color: fbColors.ox,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  bodyText: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  entryStack: {
    gap: fbSpacing.x2,
  },
  entryRow: {
    minHeight: fbTouch.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.surface,
  },
  entryRowSelected: {
    borderColor: fbColors.inkFaint,
    backgroundColor: fbColors.paperDeep,
  },
  entryCopy: {
    flex: 1,
  },
  entryTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  entryMeta: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  jsonBox: {
    maxHeight: 520,
    padding: fbSpacing.x3,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
    backgroundColor: fbColors.paperDeep,
  },
  jsonText: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.monoRegular,
  },
  pressed: {
    opacity: fbAlpha.pressedSubtle,
  },
});
