import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import { EntryCard } from '@/components/case-intelligence/EntryCard';
import {
  Chip,
  Display,
  Icon,
  NextStepCard,
  PillButton,
  ProgressBar,
  Rule,
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
  type IconName,
} from '@/components/ui/fb';
import {
  type EvidenceAttachment,
  type Entry,
  type EntryTypeValue,
  formatDateLabel,
  useCaseIntelligenceHome,
  useCasePatterns,
  type FamilyBenchCase,
  type KeyDate,
  type NextStep,
  type Person,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

function ChromeButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chromeButton, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={fbColors.ink} />
    </Pressable>
  );
}

function TopChrome() {
  return (
    <View style={styles.topChrome}>
      <Text style={styles.brandLabel}>Family Bench</Text>

      <ChromeButton
        icon="folder"
        label="Open evidence folder"
        onPress={() => router.push('/evidence' as never)}
      />
    </View>
  );
}

function firstName(person: Person | null) {
  return person?.display_name.split(/\s+/)[0] || 'there';
}

function caseCaption(activeCase: FamilyBenchCase | null) {
  return activeCase?.title || activeCase?.case_number || 'Family Bench case';
}

function caseMeta(activeCase: FamilyBenchCase | null) {
  if (!activeCase) return 'Case setup pending';
  return [activeCase.case_number, activeCase.county, activeCase.department]
    .filter(Boolean)
    .join(' · ');
}

function CaseCard({
  activeCase,
  primaryPerson: _primaryPerson,
}: {
  activeCase: FamilyBenchCase | null;
  primaryPerson: Person | null;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Switch case"
      onPress={() => router.push('/cases' as never)}
      style={({ pressed }) => [styles.caseStrip, pressed && styles.pressed]}
    >
      <View style={styles.caseStripSeal}>
        <Text style={styles.caseStripSealText}>FB</Text>
      </View>
      <View style={styles.caseStripCopy}>
        <Display italic size={15} style={styles.caseStripCaption}>
          {caseCaption(activeCase)}
        </Display>
        <Text style={styles.caseStripMeta}>{caseMeta(activeCase)}</Text>
      </View>
      <Icon name="caretDown" size={12} color={fbColors.inkMute} />
    </Pressable>
  );
}

function getDaysToDate(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return 0;
  const diff = target - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function FilingNextStep({ nextStep, caseId }: { nextStep: NextStep; caseId: string | null }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const identity = JSON.stringify([caseId, nextStep]);
  if (dismissed === identity) return null;

  function openNextStep() {
    if (!caseId) {
      router.push('/onboarding' as never);
    } else if (nextStep.relatedFilingPackageId) {
      router.push({
        pathname: '/filings',
        params: { packageId: nextStep.relatedFilingPackageId },
      } as never);
    } else if (nextStep.relatedKeyDateId) {
      router.push('/case-map' as never);
    } else {
      openCapture();
    }
  }
  return (
    <View style={styles.nextStepWrap}>
      <NextStepCard
        kicker="Next step"
        title={nextStep.title}
        body={nextStep.body}
        primary={nextStep.primaryLabel}
        secondary={nextStep.secondaryLabel}
        onPrimary={openNextStep}
        onSecondary={() => setDismissed(identity)}
        right={
          nextStep.dueLabel ? (
            <Chip tone={nextStep.dueLabel === 'Past due' ? 'ox' : 'amber'} outline={false}>
              {nextStep.dueLabel}
            </Chip>
          ) : null
        }
      >
        {typeof nextStep.completionPercent === 'number' ? (
          <ProgressBar pct={nextStep.completionPercent} label="Form completion" />
        ) : null}
      </NextStepCard>
    </View>
  );
}

function HearingStrip({ keyDate }: { keyDate?: KeyDate }) {
  if (!keyDate) return null;
  const days = getDaysToDate(keyDate.event_date);
  const dateLabel = formatDateLabel(keyDate.event_date, keyDate.event_time);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open date: ${keyDate.title}`}
      onPress={() => router.push('/case-map' as never)}
      style={({ pressed }) => [styles.countdownStrip, pressed && styles.pressed]}
    >
      <Text style={styles.countdownNumber}>{days}</Text>
      <View style={styles.countdownCopy}>
        <Text style={styles.countdownTitle}>days to next date</Text>
        <Text style={styles.countdownMeta}>
          {dateLabel} · {keyDate.title}
        </Text>
      </View>
      <Icon name="chevR" size={14} color={fbColors.inkMute} />
    </Pressable>
  );
}

function AdvisorLauncher({
  activeCase,
  flaggedCount,
}: {
  activeCase: FamilyBenchCase | null;
  flaggedCount: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Advisor"
      onPress={() => router.push('/advisor' as never)}
      style={({ pressed }) => [styles.advisorPressable, pressed && styles.pressed]}
    >
      <SoftCard p={14} style={styles.advisorCard}>
        <View style={styles.advisorIcon}>
          <Icon name="chat" size={16} color={fbColors.ink} />
        </View>
        <View style={styles.advisorCopy}>
          <Text style={styles.advisorTitle}>Advisor placeholder</Text>
          <Text style={styles.advisorBody}>
            {activeCase?.title || 'Current case'} · {flaggedCount} flagged entries available
          </Text>
        </View>
        <Icon name="chevR" size={15} color={fbColors.inkMute} />
      </SoftCard>
    </Pressable>
  );
}

function FilingBuilderLauncher({ packageCount }: { packageCount: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Filing Builder"
      onPress={() => router.push('/filings' as never)}
      style={({ pressed }) => [styles.advisorPressable, pressed && styles.pressed]}
    >
      <SoftCard p={14} style={styles.advisorCard}>
        <View style={styles.advisorIcon}>
          <Icon name="folder" size={16} color={fbColors.ink} />
        </View>
        <View style={styles.advisorCopy}>
          <Text style={styles.advisorTitle}>Filing Builder</Text>
          <Text style={styles.advisorBody}>
            {packageCount} local filing {packageCount === 1 ? 'package' : 'packages'}
          </Text>
        </View>
        <Icon name="chevR" size={15} color={fbColors.inkMute} />
      </SoftCard>
    </Pressable>
  );
}

function PatternsLauncher({ patternCount }: { patternCount: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Patterns"
      onPress={() => router.push('/patterns' as never)}
      style={({ pressed }) => [styles.advisorPressable, pressed && styles.pressed]}
    >
      <SoftCard p={14} style={styles.advisorCard}>
        <View style={styles.advisorIcon}>
          <Icon name="filter" size={16} color={fbColors.ink} />
        </View>
        <View style={styles.advisorCopy}>
          <Text style={styles.advisorTitle}>Patterns</Text>
          <Text style={styles.advisorBody}>
            {patternCount} active possible {patternCount === 1 ? 'pattern' : 'patterns'}
          </Text>
        </View>
        <Icon name="chevR" size={15} color={fbColors.inkMute} />
      </SoftCard>
    </Pressable>
  );
}

function CaptureTile({
  icon,
  title,
  body,
  onPress,
}: {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.captureTilePressable, pressed && styles.pressed]}
    >
      <SoftCard p={13} style={styles.captureTile}>
        <View style={styles.tileIcon}>
          <Icon name={icon} size={16} color={fbColors.oxDeep} />
        </View>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileBody}>{body}</Text>
      </SoftCard>
    </Pressable>
  );
}

function openCapture(type?: EntryTypeValue) {
  if (type) {
    router.push({ pathname: '/capture', params: { type } } as never);
    return;
  }
  router.push('/capture' as never);
}

function openEntry(entryId: string) {
  router.push({ pathname: '/entry/[id]', params: { id: entryId } } as never);
}

function QuickCapture() {
  return (
    <View style={styles.quickSection}>
      <Text style={styles.sectionLabel}>QUICK CAPTURE</Text>

      <View style={styles.captureGrid}>
        <CaptureTile
          icon="home"
          title="Exchange"
          body="Pickup or dropoff"
          onPress={() => openCapture('pickup_dropoff')}
        />
        <CaptureTile
          icon="x"
          title="Missed time"
          body="Scheduled time did not happen"
          onPress={() => openCapture('visit_denied')}
        />
        <CaptureTile
          icon="chat"
          title="Child statement"
          body="Statement or concern"
          onPress={() => openCapture('child_statement')}
        />
        <CaptureTile
          icon="receipt"
          title="Expense"
          body="Receipt or reimbursement"
          onPress={() => openCapture('expense')}
        />
      </View>
    </View>
  );
}

function attachmentCountForEntry(attachments: EvidenceAttachment[], entryId: string) {
  return attachments.filter((attachment) => attachment.entry_id === entryId && !attachment.deleted_at).length;
}

function RecentEntries({
  entries,
  attachments,
  filingEntryLinkCounts,
}: {
  entries: Entry[];
  attachments: EvidenceAttachment[];
  filingEntryLinkCounts: Record<string, number>;
}) {
  return (
    <View style={styles.recentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
        <PillButton
          tone="ghost"
          size="sm"
          iconRight="chevR"
          onPress={() => router.push('/timeline' as never)}
        >
          Timeline
        </PillButton>
      </View>

      {entries.length ? (
        <View style={styles.entryStack}>
          {entries.slice(0, 3).map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              attachmentCount={attachmentCountForEntry(attachments, entry.id)}
              filingLinkCount={filingEntryLinkCounts[entry.id] ?? 0}
              compact
              onPress={() => openEntry(entry.id)}
            />
          ))}
        </View>
      ) : (
        <SoftCard p={16} style={styles.emptyRecent}>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyBody}>
            Capture the next event, message, expense, or court-order note when it happens.
          </Text>
        </SoftCard>
      )}
    </View>
  );
}

function HomeContextRail({
  activeCase,
  nextKeyDate,
  entriesCount,
  flaggedCount,
  attachmentCount,
  filingPackageCount,
}: {
  activeCase: FamilyBenchCase | null;
  nextKeyDate?: KeyDate;
  entriesCount: number;
  flaggedCount: number;
  attachmentCount: number;
  filingPackageCount: number;
}) {
  return (
    <View style={styles.contextRail}>
      <Text style={styles.sectionLabel}>CASE CONTEXT</Text>
      <Display italic size={19} style={styles.contextCaption}>
        {caseCaption(activeCase)}
      </Display>
      <Text style={styles.contextMeta}>{caseMeta(activeCase) || 'Local case details'}</Text>
      <Rule />
      <View style={styles.contextStatStack}>
        <View style={styles.contextStatRow}>
          <Text style={styles.contextStatLabel}>Entries</Text>
          <Text style={styles.contextStatValue}>{entriesCount}</Text>
        </View>
        <View style={styles.contextStatRow}>
          <Text style={styles.contextStatLabel}>Flagged</Text>
          <Text style={styles.contextStatValue}>{flaggedCount}</Text>
        </View>
        <View style={styles.contextStatRow}>
          <Text style={styles.contextStatLabel}>Attachments</Text>
          <Text style={styles.contextStatValue}>{attachmentCount}</Text>
        </View>
        <View style={styles.contextStatRow}>
          <Text style={styles.contextStatLabel}>Filing packages</Text>
          <Text style={styles.contextStatValue}>{filingPackageCount}</Text>
        </View>
      </View>
      <Rule />
      <Text style={styles.contextRailTitle}>Next date</Text>
      <Text style={styles.contextRailText}>
        {nextKeyDate
          ? `${nextKeyDate.title} · ${formatDateLabel(nextKeyDate.event_date, nextKeyDate.event_time)}`
          : 'No upcoming date recorded locally.'}
      </Text>
      <Rule />
      <Text style={styles.contextRailText}>
        Desktop is for organizing the local case file. Mobile remains optimized for quick capture.
      </Text>
    </View>
  );
}

function FirstRunSetup({ demoCase }: { demoCase: boolean }) {
  const { isMobile } = useResponsive();

  return (
    <CaseScreen desktopMaxWidth={820}>
      {isMobile ? <TopChrome /> : null}

      <View style={[styles.setupHero, !isMobile && styles.setupHeroDesktop]}>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Case setup
          </Chip>
          {demoCase ? (
            <Chip tone="amber" outline={false}>
              Demo data loaded
            </Chip>
          ) : null}
        </View>
        <Display size={32} style={styles.setupTitle}>
          Set up your case
        </Display>
        <Text style={styles.setupBody}>
          Add the basic case, party, child, and hearing details that Family Bench will use across
          Home, Case Map, Advisor, Timeline, and Reports. Your records save on this device and sync to your account.
        </Text>
      </View>

      <SoftCard p={16} style={styles.setupCard}>
        <View style={styles.setupCardHeader}>
          <Icon name="shield" size={17} color={fbColors.ink} />
          <Text style={styles.setupCardTitle}>Your private account</Text>
        </View>
        <Text style={styles.setupCardBody}>
          Add factual details about your case. The status bar shows when your changes are saved and synced.
        </Text>
        <PillButton
          tone="primary"
          size="lg"
          full
          icon="plus"
          onPress={() => router.push('/onboarding' as never)}
        >
          Start case setup
        </PillButton>
        <PillButton tone="ghost" full onPress={() => router.push('/welcome' as never)}>See how Family Bench works</PillButton>
      </SoftCard>
    </CaseScreen>
  );
}

export default function Home() {
  const { home, snapshot, filingEntryLinkCounts, hasUserCaseSetup, hasHydrated, isDemoCase, loading } =
    useCaseIntelligenceHome();
  const { activePatterns } = useCasePatterns();
  const { isMobile } = useResponsive();

  if (loading || !hasHydrated) return <CaseScreen><Text style={styles.setupBody}>Opening your case…</Text></CaseScreen>;
  if (hasHydrated && !hasUserCaseSetup && !isDemoCase) {
    return <FirstRunSetup demoCase={false} />;
  }

  const filingPackageCount = home.activeCase
    ? snapshot.filingPackages.filter(
        (filingPackage) =>
          !filingPackage.deleted_at && filingPackage.case_id === home.activeCase?.id,
      ).length
    : 0;

  return (
    <CaseScreen
      desktopMaxWidth={1160}
      contentStyle={!isMobile ? styles.homeDesktopContent : undefined}
      rightRail={
        !isMobile ? (
          <HomeContextRail
            activeCase={home.activeCase}
            nextKeyDate={home.upcomingKeyDates[0]}
            entriesCount={snapshot.entries.filter((entry) => !entry.deleted_at).length}
            flaggedCount={home.flaggedEntries.length}
            attachmentCount={snapshot.evidenceAttachments.filter((attachment) => !attachment.deleted_at).length}
            filingPackageCount={filingPackageCount}
          />
        ) : undefined
      }
    >
      {isMobile ? <TopChrome /> : null}

      <View style={!isMobile ? styles.desktopHeroGrid : undefined}>
        <View style={!isMobile ? styles.desktopHeroPrimary : undefined}>
          <View style={[styles.greetingBlock, !isMobile && styles.desktopGreetingBlock]}>
            <Text style={styles.desktopKicker}>
              Good morning, {firstName(home.primaryPerson)}
            </Text>
            <Display
              size={isMobile ? 28 : 40}
              style={[styles.greeting, !isMobile && styles.desktopGreeting]}
            >
              Here&apos;s today.
            </Display>
          </View>

          <CaseCard activeCase={home.activeCase} primaryPerson={home.primaryPerson} />
          <FilingNextStep nextStep={home.nextStep} caseId={home.activeCase?.id ?? null} />
          <HearingStrip keyDate={home.upcomingKeyDates[0]} />
        </View>

        {!isMobile ? (
          <View style={styles.desktopHeroSecondary}>
            <AdvisorLauncher activeCase={home.activeCase} flaggedCount={home.flaggedEntries.length} />
            <PatternsLauncher patternCount={activePatterns.length} />
            <FilingBuilderLauncher packageCount={filingPackageCount} />
          </View>
        ) : null}
      </View>

      <Rule style={styles.captureRule} />
      <View style={!isMobile ? styles.desktopLowerGrid : undefined}>
        <View style={!isMobile ? styles.desktopQuickColumn : undefined}>
          <QuickCapture />
        </View>
        <View style={!isMobile ? styles.desktopRecentColumn : undefined}>
          <RecentEntries
            entries={home.recentEntries}
            attachments={snapshot.evidenceAttachments}
            filingEntryLinkCounts={filingEntryLinkCounts}
          />
        </View>
      </View>
    </CaseScreen>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: fbAlpha.pressed,
  },
  topChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x2,
  },
  setupHero: {
    marginTop: fbSpacing.x8,
    gap: fbSpacing.x3,
  },
  setupHeroDesktop: {
    marginTop: 0,
  },
  setupTitle: {
    lineHeight: 34,
  },
  setupBody: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  setupCard: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  setupCardHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x2,
  },
  setupCardTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  setupCardBody: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  chromeButton: {
    width: fbTouch.min,
    height: fbTouch.min,
    borderRadius: fbRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.surface,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
  },
  brandLabel: {
    color: fbColors.ink,
    fontSize: 13,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.12,
  },
  greetingBlock: {
    marginTop: fbSpacing.x8,
  },
  desktopGreetingBlock: {
    marginTop: 0,
  },
  desktopKicker: {
    color: fbColors.inkMute,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fbFonts.sansMedium,
    fontWeight: fbWeights.medium,
    marginBottom: fbSpacing.x1,
  },
  greeting: {
    lineHeight: 34,
  },
  desktopGreeting: {
    lineHeight: 44,
  },
  subGreeting: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  homeDesktopContent: {
    alignSelf: 'stretch',
  },
  desktopHeroGrid: {
    flexDirection: 'row',
    gap: fbSpacing.x5,
    alignItems: 'stretch',
  },
  desktopHeroPrimary: {
    flex: 1.35,
    minWidth: 0,
  },
  desktopHeroSecondary: {
    flex: 0.85,
    minWidth: 280,
    paddingTop: fbSpacing.x8,
  },
  desktopLowerGrid: {
    flexDirection: 'row',
    gap: fbSpacing.x6,
    alignItems: 'flex-start',
  },
  desktopQuickColumn: {
    flex: 0.82,
    minWidth: 260,
  },
  desktopRecentColumn: {
    flex: 1.18,
    minWidth: 0,
  },
  caseStrip: {
    marginTop: fbSpacing.x4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caseStripSeal: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: fbColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseStripSealText: {
    color: fbColors.paper,
    fontSize: 12,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.4,
  },
  caseStripCopy: {
    flex: 1,
    minWidth: 0,
  },
  caseStripCaption: {
    lineHeight: 18,
  },
  caseStripMeta: {
    marginTop: 1,
    color: fbColors.inkMute,
    fontSize: 10,
    fontFamily: fbFonts.monoMedium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nextStepWrap: {
    marginTop: fbSpacing.x3,
  },
  countdownStrip: {
    marginTop: fbSpacing.x3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: fbRadii.lg,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countdownNumber: {
    color: fbColors.ink,
    fontSize: 44,
    lineHeight: 44,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -1.8,
  },
  countdownCopy: {
    flex: 1,
    minWidth: 0,
  },
  countdownTitle: {
    color: fbColors.ink,
    fontSize: 14,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  countdownMeta: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: 12,
    fontFamily: fbFonts.sansRegular,
  },
  advisorPressable: {
    marginTop: fbSpacing.x3,
  },
  advisorCard: {
    minHeight: 72,
    borderRadius: fbRadii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
    backgroundColor: fbColors.paperDeep,
  },
  advisorIcon: {
    width: 34,
    height: 34,
    borderRadius: fbRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.surface,
  },
  advisorCopy: {
    flex: 1,
  },
  advisorTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  advisorBody: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  captureRule: {
    marginTop: fbSpacing.x5,
  },
  quickSection: {
    marginTop: fbSpacing.x4,
  },
  sectionLabel: {
    color: fbColors.ox,
    fontSize: 10.5,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  captureLauncher: {
    marginTop: fbSpacing.x3,
  },
  captureGrid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: fbSpacing.x3 - 2,
  },
  captureTilePressable: {
    flexBasis: '47.5%',
    flexGrow: 1,
    minHeight: 106,
  },
  captureTile: {
    flex: 1,
    borderRadius: fbRadii.xl,
    minHeight: 106,
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: fbRadii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fbColors.oxWash,
  },
  tileTitle: {
    marginTop: fbSpacing.x3 - 2,
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.18,
  },
  tileBody: {
    marginTop: 3,
    color: fbColors.inkMute,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: fbFonts.sansRegular,
  },
  recentSection: {
    marginTop: fbSpacing.x6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  entryStack: {
    marginTop: fbSpacing.x3,
    gap: fbSpacing.x3,
  },
  emptyRecent: {
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
  contextRail: {
    gap: fbSpacing.x3,
    padding: fbSpacing.x4,
    borderRadius: fbRadii.md,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.rule,
    backgroundColor: fbColors.surface,
  },
  contextCaption: {
    lineHeight: 23,
  },
  contextMeta: {
    color: fbColors.inkMute,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fbFonts.monoMedium,
    textTransform: 'uppercase',
  },
  contextStatStack: {
    gap: fbSpacing.x2,
  },
  contextStatRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
  },
  contextStatLabel: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  contextStatValue: {
    color: fbColors.ink,
    fontSize: 18,
    lineHeight: 22,
    fontFamily: fbFonts.monoSemi,
    fontWeight: fbWeights.semi,
  },
  contextRailTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    lineHeight: 20,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  contextRailText: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
});
