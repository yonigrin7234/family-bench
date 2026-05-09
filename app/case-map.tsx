import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CaseScreen } from '@/components/case-intelligence/CaseScreen';
import {
  Chip,
  Display,
  Icon,
  InfoCallout,
  PillButton,
  Rule,
  SoftCard,
  fbColors,
  fbFonts,
  fbLegalCopy,
  fbSpacing,
  fbType,
  fbWeights,
  type ChipTone,
  type IconName,
} from '@/components/ui/fb';
import {
  formatDateLabel,
  getRelativeDueLabel,
  useCaseMap,
  type Child,
  type CourtOrder,
  type CourtOrderProvision,
  type FilingPackage,
  type KeyDate,
  type Person,
} from '@/lib/case-intelligence';
import { useResponsive } from '@/lib/hooks/useResponsive';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not recorded'}</Text>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: IconName;
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Icon name={icon} size={16} color={fbColors.ink} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {typeof count === 'number' ? (
        <Chip tone="mute" outline={false}>
          {count}
        </Chip>
      ) : null}
    </View>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{children}</Text>
    </View>
  );
}

function SmallRecord({
  title,
  subtitle,
  meta,
  tone = 'ink',
}: {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  tone?: ChipTone;
}) {
  return (
    <View style={styles.record}>
      <View style={styles.recordCopy}>
        <Text style={styles.recordTitle}>{title}</Text>
        {subtitle ? <Text style={styles.recordSubtitle}>{subtitle}</Text> : null}
      </View>
      {meta ? (
        <Chip tone={tone} outline={false}>
          {meta}
        </Chip>
      ) : null}
    </View>
  );
}

function ChildrenSection({ childrenRows }: { childrenRows: Child[] }) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="home" title="Children" count={childrenRows.length} />
      {childrenRows.length ? (
        <View style={styles.recordStack}>
          {childrenRows.map((child) => (
            <SmallRecord
              key={child.id}
              title={child.name}
              subtitle={child.date_of_birth ? `DOB ${child.date_of_birth}` : 'Date of birth not recorded'}
              tone="forest"
              meta="Child"
            />
          ))}
        </View>
      ) : (
        <EmptyState>No children have been added to this case record yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function PeopleSection({ people }: { people: Person[] }) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="chat" title="Parties and people" count={people.length} />
      {people.length ? (
        <View style={styles.recordStack}>
          {people.map((person) => (
            <SmallRecord
              key={person.id}
              title={person.display_name}
              subtitle={[person.relationship, person.email, person.phone].filter(Boolean).join(' · ')}
              tone={person.is_primary_client ? 'ox' : 'sand'}
              meta={person.role}
            />
          ))}
        </View>
      ) : (
        <EmptyState>No parties or people have been added to this case record yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function CourtOrdersSection({
  courtOrders,
  provisions,
}: {
  courtOrders: CourtOrder[];
  provisions: CourtOrderProvision[];
}) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="scales" title="Court orders" count={courtOrders.length} />
      {courtOrders.length ? (
        <View style={styles.recordStack}>
          {courtOrders.map((order) => (
            <SmallRecord
              key={order.id}
              title={order.order_title}
              subtitle={order.order_date ? formatDateLabel(order.order_date) : 'Order date not recorded'}
              tone="ink"
              meta={order.order_type}
            />
          ))}
        </View>
      ) : (
        <EmptyState>
          No court orders have been added yet. Uploads and provision extraction come later.
        </EmptyState>
      )}

      <Rule />

      <SectionHeader icon="link" title="Order provisions" count={provisions.length} />
      {provisions.length ? (
        <View style={styles.recordStack}>
          {provisions.map((provision) => (
            <SmallRecord
              key={provision.id}
              title={provision.label}
              subtitle={provision.body}
              tone="sand"
              meta={provision.category}
            />
          ))}
        </View>
      ) : (
        <EmptyState>
          No provisions are mapped yet. Future entries will link to specific order language here.
        </EmptyState>
      )}
    </SoftCard>
  );
}

function DatesSection({ keyDates }: { keyDates: KeyDate[] }) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="clock" title="Key dates and deadlines" count={keyDates.length} />
      {keyDates.length ? (
        <View style={styles.recordStack}>
          {keyDates.map((date) => {
            const relative = getRelativeDueLabel(date.event_date);
            return (
              <SmallRecord
                key={date.id}
                title={date.title}
                subtitle={formatDateLabel(date.event_date, date.event_time)}
                tone={relative === 'Past due' ? 'ox' : 'amber'}
                meta={date.is_completed ? 'Complete' : relative}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState>No hearings or deadlines are recorded yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function FilingsSection({ filingPackages }: { filingPackages: FilingPackage[] }) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="doc" title="Filing packages" count={filingPackages.length} />
      {filingPackages.length ? (
        <View style={styles.recordStack}>
          {filingPackages.map((pkg) => (
            <SmallRecord
              key={pkg.id}
              title={pkg.title}
              subtitle={pkg.court_ready_summary}
              tone={pkg.status === 'draft' ? 'amber' : 'forest'}
              meta={pkg.due_date ? getRelativeDueLabel(pkg.due_date) : pkg.status}
            />
          ))}
        </View>
      ) : (
        <EmptyState>No filing packages have been started yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function CaseMapContextRail({
  caseTitle,
  childrenCount,
  peopleCount,
  datesCount,
  filingCount,
  persistenceActive,
  hydrationCompleted,
  sourceLabel,
}: {
  caseTitle: string;
  childrenCount: number;
  peopleCount: number;
  datesCount: number;
  filingCount: number;
  persistenceActive: boolean;
  hydrationCompleted: boolean;
  sourceLabel: string;
}) {
  return (
    <SoftCard p={14} style={styles.railCard}>
      <Text style={styles.sectionLabel}>CASE CONTEXT</Text>
      <Text style={styles.railValue}>{caseTitle}</Text>
      <Text style={styles.railText}>
        {childrenCount} children · {peopleCount} people · {datesCount} key dates · {filingCount} filing packages.
      </Text>
      <Rule />
      <Text style={styles.railText}>
        Persistence {persistenceActive ? 'active' : 'inactive'} · hydration {hydrationCompleted ? 'complete' : 'pending'}.
      </Text>
      <Text style={styles.railText}>Source: {sourceLabel}.</Text>
    </SoftCard>
  );
}

export default function CaseMap() {
  const {
    activeCase,
    children,
    people,
    courtOrders,
    courtOrderProvisions,
    keyDates,
    filingPackages,
    source,
    hasLocalCaseSetup,
    isDemoCase,
    persistence,
  } = useCaseMap();
  const { isMobile } = useResponsive();
  const sourceLabel =
    source === 'supabase' ? 'Supabase-backed' : source === 'local' ? 'local persisted' : 'local demo';
  const childrenSection = <ChildrenSection childrenRows={children} />;
  const peopleSection = <PeopleSection people={people} />;
  const courtOrdersSection = (
    <CourtOrdersSection courtOrders={courtOrders} provisions={courtOrderProvisions} />
  );
  const datesSection = <DatesSection keyDates={keyDates} />;
  const filingsSection = <FilingsSection filingPackages={filingPackages} />;
  const sourceSection = (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="shield" title="Data source" />
      <Text style={styles.sourceText}>
        This view is reading the current {sourceLabel} case-intelligence snapshot. No remote writes are made from Case Map.
      </Text>
      <Text style={styles.sourceText}>
        Local persistence: {persistence.active ? 'active' : 'inactive'} · Hydration: {persistence.hydrationCompleted ? 'complete' : 'pending'} · Sync: {persistence.syncMode === 'remote_write_enabled' ? 'remote writes enabled by env' : persistence.syncMode === 'local_first' ? 'local-first, remote writes disabled' : 'disabled demo mode'}
      </Text>
      {persistence.error ? <Text style={styles.sourceWarning}>{persistence.error}</Text> : null}
      <PillButton tone="ghost" size="md" icon="link" disabled full>
        Link selected entry · coming later
      </PillButton>
    </SoftCard>
  );

  return (
    <CaseScreen
      desktopMaxWidth={1120}
      rightRail={
        <CaseMapContextRail
          caseTitle={activeCase?.title || activeCase?.case_number || 'Current case'}
          childrenCount={children.length}
          peopleCount={people.length}
          datesCount={keyDates.length}
          filingCount={filingPackages.length}
          persistenceActive={persistence.active}
          hydrationCompleted={persistence.hydrationCompleted}
          sourceLabel={sourceLabel}
        />
      }
    >
      <View style={styles.header}>
        <Display italic size={32} style={styles.title}>
          Case map
        </Display>
        <Text style={styles.subtitle}>
          The case structure entries will link into. {fbLegalCopy.legalInformationNotAdvice}
        </Text>
      </View>

      <SoftCard p={16} style={styles.caseSummary}>
        <SectionHeader icon="scales" title="Active case" />
        {activeCase ? (
          <View style={[styles.caseSummaryBody, !isMobile && styles.desktopCaseSummaryBody]}>
            <View style={[styles.summaryGrid, !isMobile && styles.desktopSummaryGrid]}>
              <DetailRow label="Case" value={activeCase.title || activeCase.case_number} />
              <DetailRow label="Court" value={activeCase.court_name} />
              <DetailRow label="County" value={activeCase.county} />
              <DetailRow label="Department" value={activeCase.department} />
              <DetailRow label="Judge" value={activeCase.judge_name} />
              <DetailRow label="Status" value={activeCase.status} />
            </View>
            <View style={styles.caseActions}>
              <Chip tone={isDemoCase ? 'amber' : 'forest'} outline={false}>
                {hasLocalCaseSetup ? 'Local case' : 'Demo case'}
              </Chip>
              <PillButton
                tone="soft"
                size="md"
                icon="scales"
                full
                onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'edit' } } as never)}
              >
                {hasLocalCaseSetup ? 'Edit case details' : 'Set up local case'}
              </PillButton>
            </View>
          </View>
        ) : (
          <EmptyState>No active case has been selected yet.</EmptyState>
        )}
      </SoftCard>

      <InfoCallout title="Linking status" tone="ink">
        Entry linking is not active yet. This map establishes the case structure for future links to orders, hearings, deadlines, and filings.
      </InfoCallout>

      {isMobile ? (
        <>
          {childrenSection}
          {peopleSection}
          {courtOrdersSection}
          {datesSection}
          {filingsSection}
          {sourceSection}
        </>
      ) : (
        <View style={styles.desktopMapGrid}>
          <View style={styles.desktopMapColumn}>
            {childrenSection}
            {peopleSection}
            {datesSection}
          </View>
          <View style={styles.desktopMapColumn}>
            {courtOrdersSection}
            {filingsSection}
            {sourceSection}
          </View>
        </View>
      )}
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
  caseSummary: {
    marginTop: fbSpacing.x5,
    gap: fbSpacing.x4,
  },
  section: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  sectionHeader: {
    minHeight: 32,
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
    letterSpacing: -0.14,
  },
  sectionLabel: {
    color: fbColors.ox,
    fontSize: fbType.micro,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 1.05,
  },
  summaryGrid: {
    gap: fbSpacing.x3,
  },
  desktopSummaryGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  caseSummaryBody: {
    gap: fbSpacing.x4,
  },
  desktopCaseSummaryBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  caseActions: {
    gap: fbSpacing.x3,
  },
  desktopMapGrid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x4,
  },
  desktopMapColumn: {
    flex: 1,
    minWidth: 0,
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
  recordStack: {
    gap: fbSpacing.x2,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: fbSpacing.x3,
    paddingVertical: fbSpacing.x2,
  },
  recordCopy: {
    flex: 1,
  },
  recordTitle: {
    color: fbColors.ink,
    fontSize: fbType.body,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: -0.14,
  },
  recordSubtitle: {
    marginTop: fbSpacing.x1,
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  emptyState: {
    paddingVertical: fbSpacing.x2,
  },
  emptyText: {
    color: fbColors.inkMute,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  sourceText: {
    color: fbColors.inkSoft,
    fontSize: fbType.body,
    lineHeight: 21,
    fontFamily: fbFonts.sansRegular,
  },
  sourceWarning: {
    color: fbColors.oxDeep,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railCard: {
    gap: fbSpacing.x3,
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
});
