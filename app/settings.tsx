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
import { AccountDetails, AccountSignOutButton } from '@/components/case-intelligence/AccountMenu';
import { useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
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
  const workspace = useCaseIntelligenceStore();
  const [accountBusy, setAccountBusy] = useState(false);
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
  const [archiving, setArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState<string | null>(null);
  const canClear = confirmText.trim() === CONFIRM_TEXT;
  const caseId = activeCase?.id;
  const caseScopedChildren = snapshot.children.filter((child) => !child.deleted_at && child.case_id === caseId);
  const caseScopedFilings = snapshot.filingPackages.filter(
    (filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === caseId,
  );
  const advisorThreadCount = advisorState.threadId ? 1 : 0;

  async function downloadPrivateArchive() {
    if (archiving) return;
    const start = useCaseIntelligenceStore.getState();
    if (!start.ownerId || !start.hasLoaded || start.loading || start.saving || start.storageBlocked || start.persistence.error) {
      setNotice('Wait for your workspace to load and finish saving before downloading an archive.');
      return;
    }
    const owner = start.ownerId;
    const generation = useAuthStore.getState().sessionGeneration;
    function assertCurrentAccount() {
      const current = useCaseIntelligenceStore.getState();
      if (useAuthStore.getState().session?.user.id !== owner || useAuthStore.getState().sessionGeneration !== generation || current.ownerId !== owner || current.snapshot !== start.snapshot || current.workspaceJSON !== start.workspaceJSON || current.advisorState !== start.advisorState || current.caseWorkspaceStates !== start.caseWorkspaceStates || current.savedReportVersions !== start.savedReportVersions || current.filingBuilderState !== start.filingBuilderState || current.reportPreviewState !== start.reportPreviewState || current.patternReviewState !== start.patternReviewState || current.conflictHistory !== start.conflictHistory || current.courtFormDrafts !== start.courtFormDrafts || current.contextRecovery !== start.contextRecovery) {
        throw new Error('The account or its records changed during export. Start the archive again.');
      }
    }
    setArchiving(true); setNotice(null); setArchiveProgress('Preparing your private workspace…');
    try {
      const [{ createPrivateWorkspaceArchive }, { getEvidenceBytes }, { sha256Bytes, downloadArtifact }] = await Promise.all([
        import('@/lib/export/privateArchive'), import('@/lib/evidence'), import('@/lib/export/download'),
      ]);
      const artifact = await createPrivateWorkspaceArchive({ ownerId: owner, snapshot: start.snapshot, workspace: { ownerId: owner, selectedCaseId: start.snapshot.selectedCaseId ?? null, caseWorkspaceStates: start.caseWorkspaceStates, savedReportVersions: start.savedReportVersions, reportPreviewState: start.reportPreviewState, advisorState: start.advisorState, filingBuilderState: start.filingBuilderState, patternReviewState: start.patternReviewState, conflictHistory: start.conflictHistory, courtFormDrafts: start.courtFormDrafts, contextRecovery: start.contextRecovery } }, {
        getAttachmentBytes: (attachment) => getEvidenceBytes(attachment, owner), sha256: sha256Bytes,
        assertCurrentAccount,
        onProgress: (completed, total) => setArchiveProgress(`Verified ${completed} of ${total} original files`),
      });
      assertCurrentAccount();
      await downloadArtifact(artifact, assertCurrentAccount);
      setNotice('Your private workspace ZIP is ready. Keep it secure: it includes private notes and original files.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Unable to create the private archive. No partial archive was downloaded.');
    } finally { setArchiving(false); setArchiveProgress(null); }
  }

  async function clearLocalData() {
    if (!canClear || clearing) return;
    setClearing(true);
    setNotice(null);

    try {
      await clearLocalCaseData();
      setConfirmText('');
      setNotice('This device’s case cache was cleared and refreshed from your account.');
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
        <Display size={32} style={styles.title}>
          Settings
        </Display>
        <Text style={styles.subtitle}>
          Account, saved data, and sync status. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={16} style={styles.section}>
        <Text style={styles.sectionTitle}>Your account</Text>
        <AccountDetails />
        <Text style={styles.bodyText}>Signing out clears the open case from memory. Encrypted records saved on this device remain available when you sign in again.</Text>
        <AccountSignOutButton disabled={accountBusy || clearing || archiving} />
      </SoftCard>
      {workspace.contextError ? <SoftCard p={16} style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Saved working context needs review</Text>
        <Text style={styles.bodyText}>{workspace.contextError}</Text>
        <Text style={styles.bodyText}>Your case records remain available. {workspace.contextRecovery.length} original context {workspace.contextRecovery.length === 1 ? 'copy is' : 'copies are'} preserved in encrypted storage on this device and included in the private workspace archive. Recovery copies are not sent to cloud sync.</Text>
        <Text style={styles.bodyText}>Continue with the safe working context to resume syncing view selections. Hidden imported content remains in the recovery copies.</Text>
        <PillButton tone="soft" disabled={accountBusy || Boolean(workspace.saving || workspace.syncing)} onPress={async () => {
          setAccountBusy(true); setNotice(null);
          try { await workspace.resetAffectedViewSelections(); setNotice('Safe working context saved. Original recovery copies remain on this device.'); }
          catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to save recovered view selections.'); }
          finally { setAccountBusy(false); }
        }}>Continue with safe working context</PillButton>
      </SoftCard> : null}
      {workspace.conflicts.map((conflict) => <SoftCard key={conflict.key} p={16} style={styles.section}>
        <Text style={styles.sectionTitle}>Review changes: {conflict.table.replaceAll('_', ' ')}</Text>
        <Text style={styles.bodyText}>This device: {String(conflict.local.title ?? conflict.local.body ?? conflict.local.id)}</Text>
        <Text style={styles.bodyText}>Cloud: {String(conflict.remote?.title ?? conflict.remote?.body ?? conflict.remote?.id ?? 'Unavailable')}</Text>
        <Text selectable style={styles.bodyText}>{JSON.stringify({ thisDevice: conflict.local, cloud: conflict.remote }, null, 2)}</Text>
        <PillButton tone="primary" disabled={accountBusy} onPress={async () => {
          setAccountBusy(true); try { await workspace.resolveConflict(conflict.key, true); } catch (err) { setNotice(err instanceof Error ? err.message : 'Unable to resolve.'); } finally { setAccountBusy(false); }
        }}>Keep this device’s changes</PillButton>
        <PillButton tone="ghost" disabled={accountBusy || !conflict.remote} onPress={async () => {
          setAccountBusy(true); try { await workspace.resolveConflict(conflict.key, false); } catch (err) { setNotice(err instanceof Error ? err.message : 'Unable to resolve.'); } finally { setAccountBusy(false); }
        }}>Use the cloud version</PillButton>
      </SoftCard>)}
      {notice && <Text accessibilityLiveRegion="polite" style={styles.bodyText}>{notice}</Text>}
      <View style={styles.grid}>
        <SoftCard p={16} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="shield" size={16} color={fbColors.ink} />
              <Text style={styles.sectionTitle}>Local data status</Text>
            </View>
          </View>
          <MemoryRow label="Persistence active" value={persistence.active ? 'Yes' : 'No'} />
          <MemoryRow label="Saved records loaded" value={persistence.hydrationCompleted ? 'Yes' : 'Loading'} />
          <MemoryRow label="Last persisted" value={persistence.lastPersistedAt ?? 'Not recorded'} />
          {persistence.error ? <Text style={styles.warningText}>{persistence.error}</Text> : null}
        </SoftCard>

        <SoftCard p={16} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="link" size={16} color={fbColors.ink} />
              <Text style={styles.sectionTitle}>Cloud connection</Text>
            </View>
          </View>
          <MemoryRow label="Connection configured" value={supabaseEnvironmentStatus === 'configured' ? 'Yes' : 'Unavailable'} />
          <MemoryRow
            label="Account sync"
            value={persistence.syncMode === 'remote_write_enabled' ? 'Available' : 'Unavailable'}
          />
          <Text style={styles.bodyText}>
            Verified local changes are queued for your account. Sync retries when the app is open and connectivity returns.
          </Text>
          <PillButton tone="soft" icon="shield" onPress={() => router.push('/trust-center' as never)}>Open Trust Center</PillButton>
          <PillButton tone="ghost" icon="scales" onPress={() => router.push('/cases' as never)}>Manage cases</PillButton>
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
            <Text style={styles.sectionTitle}>Reports and downloads</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          Download a factual timeline and selected original evidence. Shared reports exclude private notes. Use the private workspace archive below when you need a copy that includes those notes.
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
        <Text style={styles.sectionTitle}>Private workspace archive</Text>
        <Text style={styles.bodyText}>
          Download all case records currently loaded for your account, including private entries, private notes, captured text, saved conversations, per-case working context, saved report selections, official-form drafts, imported context recovery copies, conflict resolutions and verified original files. This ZIP is not encrypted. Keep it secure and use the factual export above for records you intend to share.
        </Text>
        <Text style={styles.bodyText}>
          The archive includes up to 128 MiB of records and originals. It excludes deleted-attachment bytes, server-only audit history, account credentials, device keys and billing/provider data. It cannot be automatically restored into Family Bench.
        </Text>
        <PillButton tone="soft" icon="folder" full disabled={archiving || workspace.loading || !workspace.hasLoaded || workspace.saving > 0 || workspace.storageBlocked || Boolean(workspace.persistence.error)} onPress={downloadPrivateArchive}>
          {archiving ? 'Preparing private archive…' : 'Download private workspace ZIP'}
        </PillButton>
        {archiveProgress && <Text accessibilityLiveRegion="polite" style={styles.bodyText}>{archiveProgress}</Text>}
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
          Remove saved case records and cached original files from this device, then reload your account. Sync pending changes and resolve conflicts first. Your cloud records remain. You will need a connection to download original files again.
        </InfoCallout>
        <TextInput
          value={confirmText}
          accessibilityLabel={`Type ${CONFIRM_TEXT} to confirm refreshing saved records`}
          onChangeText={setConfirmText}
          placeholder={CONFIRM_TEXT}
          placeholderTextColor={fbColors.inkMute}
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
