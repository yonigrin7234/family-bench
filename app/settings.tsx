import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
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
} from '@/components/ui/fb';
import { useSettingsMemoryIndex } from '@/lib/case-intelligence';
import { supabaseEnvironmentStatus } from '@/lib/supabase/client';

const CONFIRM_TEXT = 'CLEAR LOCAL DATA';

function MemoryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.memoryRow}>
      <Text style={styles.memoryLabel}>{label}</Text>
      <Text style={styles.memoryValue}>{value}</Text>
    </View>
  );
}

export default function Settings() {
  const {
    snapshot,
    activeCase,
    entries,
    attachments,
    audioMemos,
    savedReportVersions,
    advisorState,
    filingBuilderState,
    activePatterns,
    clearLocalCaseData,
    persistence,
  } = useSettingsMemoryIndex();
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canClear = confirmText.trim() === CONFIRM_TEXT;
  const caseId = activeCase?.id;
  const caseScopedChildren = snapshot.children.filter((child) => !child.deleted_at && child.case_id === caseId);
  const caseScopedFilings = snapshot.filingPackages.filter(
    (filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === caseId,
  );
  const advisorThreadCount = advisorState.threadId ? 1 : 0;

  async function clearLocalData() {
    if (!canClear || clearing) return;
    setClearing(true);
    setNotice(null);

    try {
      await clearLocalCaseData();
      setConfirmText('');
      setNotice('Local case data was cleared. Demo fallback data is available again.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to clear local data.');
    } finally {
      setClearing(false);
    }
  }

  return (
    <CaseScreen desktopMaxWidth={980}>
      <View style={styles.header}>
        <PillButton tone="ghost" size="sm" icon="caret" onPress={() => router.back()}>
          Back
        </PillButton>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Local-first
          </Chip>
          <Chip tone="mute" outline={false}>
            Settings
          </Chip>
        </View>
        <Display italic size={32} style={styles.title}>
          Settings
        </Display>
        <Text style={styles.subtitle}>
          Local data status, memory index, and privacy placeholders. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <View style={styles.grid}>
        <SoftCard p={16} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="shield" size={16} color={fbColors.ink} />
              <Text style={styles.sectionTitle}>Local data status</Text>
            </View>
          </View>
          <MemoryRow label="Persistence active" value={persistence.active ? 'Yes' : 'No'} />
          <MemoryRow label="Adapter" value={persistence.adapter} />
          <MemoryRow label="Hydration" value={persistence.hydrationCompleted ? 'Complete' : 'Pending'} />
          <MemoryRow label="Sync mode" value={persistence.syncMode} />
          <MemoryRow label="Last persisted" value={persistence.lastPersistedAt ?? 'Not recorded'} />
          {persistence.error ? <Text style={styles.warningText}>{persistence.error}</Text> : null}
        </SoftCard>

        <SoftCard p={16} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="link" size={16} color={fbColors.ink} />
              <Text style={styles.sectionTitle}>Supabase environment</Text>
            </View>
          </View>
          <MemoryRow label="Status" value={supabaseEnvironmentStatus} />
          <MemoryRow
            label="Remote writes"
            value={persistence.syncMode === 'remote_write_enabled' ? 'Enabled by environment' : 'Disabled'}
          />
          <Text style={styles.bodyText}>
            This build remains local-first. No remote sync or remote writes are added by Settings.
          </Text>
        </SoftCard>
      </View>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="folder" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>Memory index</Text>
          </View>
          <Chip tone="ink" outline={false}>
            {activeCase?.title || 'Current case'}
          </Chip>
        </View>
        <View style={styles.memoryGrid}>
          <MemoryRow label="Cases" value={snapshot.cases.filter((item) => !item.deleted_at).length} />
          <MemoryRow label="Children" value={caseScopedChildren.length} />
          <MemoryRow label="Entries" value={entries.length} />
          <MemoryRow label="Attachments" value={attachments.length} />
          <MemoryRow label="Audio memos" value={audioMemos.length} />
          <MemoryRow label="Filings" value={caseScopedFilings.length} />
          <MemoryRow label="Reports" value={savedReportVersions.length} />
          <MemoryRow label="Advisor threads" value={advisorThreadCount} />
          <MemoryRow label="Advisor messages" value={advisorState.messages.length} />
          <MemoryRow label="Patterns" value={activePatterns.length} />
          <MemoryRow label="Filing local states" value={Object.keys(filingBuilderState.packageStates).length} />
        </View>
      </SoftCard>

      <SoftCard p={16} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="doc" size={16} color={fbColors.ink} />
            <Text style={styles.sectionTitle}>Export and privacy placeholders</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          Export preview is available locally. Full data download, privacy controls, retention rules, and account deletion workflows come later.
        </Text>
        <PillButton
          tone="soft"
          size="md"
          icon="doc"
          full
          onPress={() => router.push({ pathname: '/export-prep', params: { mode: 'case' } } as never)}
        >
          Open export preparation
        </PillButton>
      </SoftCard>

      <SoftCard p={16} style={styles.dangerSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="x" size={16} color={fbColors.oxDeep} />
            <Text style={styles.sectionTitle}>Clear local data</Text>
          </View>
          <Chip tone="ox" outline={false}>
            Local reset
          </Chip>
        </View>
        <InfoCallout title="Confirmation required" tone="ox">
          Clearing local data removes the persisted local case-intelligence document on this device and returns the app to demo fallback data. It does not change remote databases.
        </InfoCallout>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={CONFIRM_TEXT}
          placeholderTextColor={fbColors.inkFaint}
          autoCapitalize="characters"
          style={styles.input}
        />
        <PillButton
          tone="primary"
          size="md"
          icon="x"
          full
          disabled={!canClear || clearing}
          onPress={clearLocalData}
        >
          {clearing ? 'Clearing local data' : 'Clear local data'}
        </PillButton>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </SoftCard>
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
  grid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x4,
  },
  section: {
    flex: 1,
    minWidth: 280,
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  dangerSection: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
    borderColor: fbColors.ox,
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
  memoryGrid: {
    gap: fbSpacing.x2,
  },
  memoryRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x1,
  },
  memoryLabel: {
    flex: 1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  memoryValue: {
    flexShrink: 1,
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    textAlign: 'right',
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  bodyText: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  warningText: {
    color: fbColors.oxDeep,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
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
  notice: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
