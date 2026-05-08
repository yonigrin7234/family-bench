import { router } from 'expo-router';
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
  Seal,
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
  getRelativeDueLabel,
  useCaseIntelligenceHome,
  useCasePatterns,
  type FamilyBenchCase,
  type KeyDate,
  type NextStep,
  type Person,
} from '@/lib/case-intelligence';

function ChromeButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
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
      <ChromeButton icon="grip" label="Open menu" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open case workspace"
        style={({ pressed }) => [styles.casePill, pressed && styles.pressed]}
      >
        <Text style={styles.casePillText}>Family Bench</Text>
        <Icon name="caretDown" size={13} color={fbColors.inkMute} />
      </Pressable>

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

function initials(person: Person | null) {
  if (!person?.display_name) return '';
  return person.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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
  primaryPerson,
}: {
  activeCase: FamilyBenchCase | null;
  primaryPerson: Person | null;
}) {
  const personInitials = initials(primaryPerson);

  return (
    <SoftCard p={14} style={styles.caseCard}>
      <Seal size={38} label="FB" style={styles.caseSeal} />
      <View style={styles.caseCopy}>
        <Display italic size={16} style={styles.caseCaption}>
          {caseCaption(activeCase)}
        </Display>
        <Text style={styles.caseMeta}>{caseMeta(activeCase)}</Text>
      </View>
      {personInitials ? <Text style={styles.caseInitials}>{personInitials}</Text> : null}
    </SoftCard>
  );
}

function FilingNextStep({ nextStep }: { nextStep: NextStep }) {
  return (
    <View style={styles.nextStepWrap}>
      <NextStepCard
        kicker="Next step"
        title={nextStep.title}
        body={nextStep.body}
        primary={nextStep.primaryLabel}
        secondary={nextStep.secondaryLabel}
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
  const dueLabel = getRelativeDueLabel(keyDate.event_date);

  return (
    <SoftCard p={14} style={styles.hearingStrip}>
      <Text style={styles.hearingValue}>
        {dueLabel ? `${dueLabel} · ${keyDate.title}` : keyDate.title}
      </Text>
      <Text style={styles.hearingDate}>
        {formatDateLabel(keyDate.event_date, keyDate.event_time)}
      </Text>
    </SoftCard>
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

      <View style={styles.captureLauncher}>
        <PillButton
          icon="plus"
          tone="primary"
          size="lg"
          full
          onPress={() => openCapture()}
        >
          Log new entry
        </PillButton>
      </View>

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

function FirstRunSetup({ demoCase }: { demoCase: boolean }) {
  return (
    <CaseScreen>
      <TopChrome />

      <View style={styles.setupHero}>
        <View style={styles.kickerRow}>
          <Chip tone="forest" outline={false}>
            Local setup
          </Chip>
          {demoCase ? (
            <Chip tone="amber" outline={false}>
              Demo data loaded
            </Chip>
          ) : null}
        </View>
        <Display italic size={32} style={styles.setupTitle}>
          Set up your local case
        </Display>
        <Text style={styles.setupBody}>
          Add the basic case, party, child, and hearing details that Family Bench will use across
          Home, Case Map, Advisor, Timeline, and Reports. This stays on this device.
        </Text>
      </View>

      <SoftCard p={16} style={styles.setupCard}>
        <View style={styles.setupCardHeader}>
          <Icon name="shield" size={17} color={fbColors.ink} />
          <Text style={styles.setupCardTitle}>No remote writes</Text>
        </View>
        <Text style={styles.setupCardBody}>
          Demo seed data remains available until a local case is saved. This setup records factual
          case details only and does not provide legal advice.
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
      </SoftCard>
    </CaseScreen>
  );
}

export default function Home() {
  const { home, snapshot, filingEntryLinkCounts, hasUserCaseSetup, hasHydrated, isDemoCase } =
    useCaseIntelligenceHome();
  const { activePatterns } = useCasePatterns();

  if (hasHydrated && !hasUserCaseSetup) {
    return <FirstRunSetup demoCase={isDemoCase} />;
  }

  return (
    <CaseScreen>
      <TopChrome />

      <View style={styles.greetingBlock}>
        <Display italic size={31} style={styles.greeting}>
          Good morning, {firstName(home.primaryPerson)}
        </Display>
        <Text style={styles.subGreeting}>Here is today.</Text>
      </View>

      <CaseCard activeCase={home.activeCase} primaryPerson={home.primaryPerson} />
      <FilingNextStep nextStep={home.nextStep} />
      <HearingStrip keyDate={home.upcomingKeyDates[0]} />
      <AdvisorLauncher activeCase={home.activeCase} flaggedCount={home.flaggedEntries.length} />
      <PatternsLauncher patternCount={activePatterns.length} />
      <FilingBuilderLauncher
        packageCount={
          home.activeCase
            ? snapshot.filingPackages.filter(
                (filingPackage) =>
                  !filingPackage.deleted_at && filingPackage.case_id === home.activeCase?.id,
              ).length
            : 0
        }
      />
      <Rule style={styles.captureRule} />
      <QuickCapture />
      <RecentEntries
        entries={home.recentEntries}
        attachments={snapshot.evidenceAttachments}
        filingEntryLinkCounts={filingEntryLinkCounts}
      />
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
  casePill: {
    minHeight: fbTouch.min,
    paddingHorizontal: fbSpacing.x4,
    borderRadius: fbRadii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: fbColors.surface,
    borderWidth: fbBorder.hairline,
    borderColor: fbColors.ruleSoft,
  },
  casePillText: {
    color: fbColors.ink,
    fontSize: 13,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.12,
  },
  greetingBlock: {
    marginTop: fbSpacing.x8,
  },
  greeting: {
    lineHeight: 34,
  },
  subGreeting: {
    marginTop: 2,
    color: fbColors.inkMute,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansRegular,
  },
  caseCard: {
    marginTop: fbSpacing.x5 - 2,
    minHeight: 70,
    borderRadius: fbRadii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: fbSpacing.x3,
  },
  caseSeal: {
    borderRadius: fbRadii.md - 2,
  },
  caseCopy: {
    flex: 1,
  },
  caseCaption: {
    lineHeight: 19,
  },
  caseMeta: {
    marginTop: 3,
    color: fbColors.inkMute,
    fontSize: 10.5,
    fontFamily: fbFonts.monoMedium,
    textTransform: 'uppercase',
  },
  caseInitials: {
    color: fbColors.ox,
    fontSize: 11,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0.8,
  },
  nextStepWrap: {
    marginTop: fbSpacing.x3,
  },
  hearingStrip: {
    marginTop: fbSpacing.x3,
    borderRadius: fbRadii.xl,
    backgroundColor: fbColors.paperDeep,
  },
  hearingValue: {
    color: fbColors.ink,
    fontSize: 15,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.18,
  },
  hearingDate: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
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
});
