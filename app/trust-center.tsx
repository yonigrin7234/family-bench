import { useMemo } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EvidenceChecks } from '@/components/briefcase/EvidenceChecks';
import { Chip, Display, InfoCallout, PillButton, SoftCard, fbColors, fbFonts, fbSpacing, fbType } from '@/components/ui/fb';
import { useAuthStore } from '@/lib/auth/session';
import { useCaseIntelligenceHome } from '@/lib/case-intelligence';
import { useCaseIntelligenceStore } from '@/lib/case-intelligence/useCaseIntelligence';
import { buildBriefcaseModel, trustRecordCounts } from '@/lib/briefcase/model';
import { useResponsive } from '@/lib/hooks/useResponsive';

export default function TrustCenter() {
  const { snapshot, home } = useCaseIntelligenceHome();
  const state = useCaseIntelligenceStore();
  const session = useAuthStore((value) => value.session);
  const { isMobile, width } = useResponsive();
  const ownerId = state.ownerId;
  const caseId = home.activeCase?.id || null;
  const model = useMemo(() => buildBriefcaseModel(snapshot, ownerId, caseId), [snapshot, ownerId, caseId]);
  const counts = trustRecordCounts(model, state.localRecords);
  const cardWidth = isMobile ? '100%' : width >= 1280 ? '23%' : '48%';
  const saveProblem = state.storageBlocked || state.persistence.error;
  const saveStatus = saveProblem ? 'Save needs attention' : state.saving ? 'Saving…' : state.persistence.lastPersistedAt ? 'Last device save recorded' : 'No device save yet';
  const syncStatus = state.conflicts.length ? `${state.conflicts.length} conflicts need review`
    : state.syncError ? 'Sync needs attention' : state.syncing ? 'Sync in progress'
      : counts.pendingRecords ? `${counts.pendingRecords} account changes waiting` : state.hasLoaded ? 'No changes waiting in this account' : 'Opening account records';

  return <CaseScreen desktopMaxWidth={1280} rightRail={false}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Chip tone="forest">Your records and controls</Chip>
        <Display size={34} accessibilityRole="header">Trust Center</Display>
        <Text style={styles.intro}>See what is saved, what needs attention, and what an original-file check can tell you.</Text>
        <View style={styles.actions}>
          <PillButton tone="ghost" onPress={() => router.push('/settings')}>Account and device settings</PillButton>
          <PillButton tone="soft" onPress={() => router.push('/briefcase' as never)}>Open hearing Briefcase</PillButton>
        </View>
      </View>

      <View style={styles.panels}>
        <SoftCard p={16} style={[styles.panel, { width: cardWidth }]}>
          <Text accessibilityRole="header" style={styles.title}>Your account</Text>
          <Chip tone={session?.user.email_confirmed_at ? 'forest' : 'amber'}>{session?.user.email_confirmed_at ? 'Email verified' : 'Verification required'}</Chip>
          <Text selectable style={styles.body}>{session?.user.email || 'Email not available'}</Text>
          <Text style={styles.body}>Case records belong to the signed-in account. Cloud original files require authenticated access.</Text>
          <Text style={styles.body}>Cloud service administrators may be able to access stored data. Device encryption does not make the service zero-access.</Text>
          <PillButton size="sm" tone="ghost" onPress={() => router.push('/settings')}>Manage account</PillButton>
        </SoftCard>

        <SoftCard p={16} style={[styles.panel, { width: cardWidth }]}>
          <Text accessibilityRole="header" style={styles.title}>Device and sync</Text>
          <Chip tone={saveProblem ? 'ox' : state.persistence.lastPersistedAt ? 'forest' : 'mute'}>{saveStatus}</Chip>
          {state.persistence.lastPersistedAt && <Text style={styles.body}>{new Date(state.persistence.lastPersistedAt).toLocaleString()}</Text>}
          <Text style={styles.body}>Local case records and original files are stored with AES-256-GCM encryption. Browser/device storage and the device key are needed to reopen them.</Text>
          <Text accessibilityLiveRegion="polite" style={styles.body}>{syncStatus}</Text>
          {(state.persistence.error || state.error || state.syncError) && <Text accessibilityRole="alert" style={styles.error}>{state.persistence.error || state.error || state.syncError}</Text>}
          <PillButton size="sm" tone="ghost" onPress={() => router.push('/settings')}>Review sync and recovery</PillButton>
        </SoftCard>

        <SoftCard p={16} style={[styles.panel, { width: cardWidth }]}>
          <Text accessibilityRole="header" style={styles.title}>Original-file integrity</Text>
          <Text style={styles.stat}>{counts.originalFiles}</Text>
          <Text style={styles.body}>Original files linked to entries in {model.activeCase?.title || 'the selected case'}.</Text>
          <Text style={styles.body}>{counts.filesWithRecordedHash} have a recorded SHA-256. A recorded hash is not a fresh byte check; use the check below to read and verify the files.</Text>
          {model.unlinkedAttachmentCount > 0 && <Text style={styles.error}>{model.unlinkedAttachmentCount} file records lack an available source entry and cannot be checked here.</Text>}
          <PillButton size="sm" tone="ghost" onPress={() => router.push('/evidence')}>Review source entries</PillButton>
        </SoftCard>

        <SoftCard p={16} style={[styles.panel, { width: cardWidth }]}>
          <Text accessibilityRole="header" style={styles.title}>Sharing and retention</Text>
          <Text style={styles.body}>Factual exports include your selected entries and source references. Private notes and raw app metadata are excluded. Original files keep their own content and metadata.</Text>
          <Text style={styles.body}>Signing out keeps encrypted device copies. Settings provides a separate clear-device action after pending changes have synced. Clearing browser/app data can remove unsynced records and keys.</Text>
          <Text style={styles.body}>Downloaded reports and ZIPs are outside the app’s encrypted storage. Review and store them carefully.</Text>
          <PillButton size="sm" tone="ghost" onPress={() => router.push('/export-prep')}>Review an export</PillButton>
        </SoftCard>
      </View>

      {!model.activeCase ? <InfoCallout title="Set up a case to check its originals" tone="ink">Account settings remain available. Add a case and attach original files before running a file check.</InfoCallout>
        : <EvidenceChecks key={`${ownerId}:${caseId}`} ownerId={ownerId} caseId={caseId} attachments={model.attachments} title="Check originals in this case" />}
      {!model.activeCase && <PillButton tone="primary" onPress={() => router.push('/onboarding')}>Set up a case</PillButton>}
      <InfoCallout title="What a file check establishes" tone="ink">A successful check confirms that available file bytes match their recorded SHA-256 and size. It does not establish who created a file, whether its contents are true, or whether a court will accept it.</InfoCallout>
    </View>
  </CaseScreen>;
}

const styles = StyleSheet.create({
  page: { gap: fbSpacing.x5 }, header: { gap: fbSpacing.x3 },
  intro: { fontFamily: fbFonts.sansRegular, fontSize: 16, lineHeight: 24, color: fbColors.inkMute },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: fbSpacing.x2 },
  panels: { flexDirection: 'row', flexWrap: 'wrap', gap: fbSpacing.x3, alignItems: 'stretch' },
  panel: { flexGrow: 1, gap: fbSpacing.x3 },
  title: { fontFamily: fbFonts.sansSemi, fontSize: fbType.h2, color: fbColors.ink },
  body: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.inkMute },
  error: { fontFamily: fbFonts.sansRegular, fontSize: fbType.body, lineHeight: 21, color: fbColors.oxDeep },
  stat: { fontFamily: fbFonts.monoMedium, fontSize: 30, color: fbColors.ink },
});
