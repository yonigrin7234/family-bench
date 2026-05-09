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
  type FamilyBenchCase,
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

function FilingsSection({
  filingPackages,
  linkedEntryCountsByPackageId,
}: {
  filingPackages: FilingPackage[];
  linkedEntryCountsByPackageId: Record<string, number>;
}) {
  return (
    <SoftCard p={16} style={styles.section}>
      <SectionHeader icon="doc" title="Filing packages" count={filingPackages.length} />
      {filingPackages.length ? (
        <View style={styles.recordStack}>
          {filingPackages.map((pkg) => {
            const linkedEntryCount = linkedEntryCountsByPackageId[pkg.id] ?? 0;
            const linkedEntryLabel = `${linkedEntryCount} linked ${
              linkedEntryCount === 1 ? 'entry' : 'entries'
            }`;

            return (
              <SmallRecord
                key={pkg.id}
                title={pkg.title}
                subtitle={[pkg.court_ready_summary, linkedEntryLabel].filter(Boolean).join(' · ')}
                tone={pkg.status === 'draft' ? 'amber' : 'forest'}
                meta={pkg.due_date ? getRelativeDueLabel(pkg.due_date) : pkg.status}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState>No filing packages have been started yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function ChecklistRow({
  complete,
  label,
  detail,
}: {
  complete: boolean;
  label: string;
  detail: string;
}) {
  return (
    <View style={styles.checklistRow}>
      <Chip tone={complete ? 'forest' : 'amber'} outline={false}>
        {complete ? 'Recorded' : 'Missing'}
      </Chip>
      <View style={styles.checklistCopy}>
        <Text style={styles.checklistLabel}>{label}</Text>
        <Text style={styles.checklistDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function CaseSpine({
  activeCase,
  childrenRows,
  people,
  hasLocalCaseSetup,
  isDemoCase,
}: {
  activeCase: FamilyBenchCase | null;
  childrenRows: Child[];
  people: Person[];
  hasLocalCaseSetup: boolean;
  isDemoCase: boolean;
}) {
  return (
    <SoftCard p={16} style={styles.spineCard}>
      <SectionHeader icon="scales" title="Case spine" />
      {activeCase ? (
        <>
          <View style={styles.spineDetails}>
            <DetailRow label="Case" value={activeCase.title || activeCase.case_number} />
            <DetailRow label="Case number" value={activeCase.case_number} />
            <DetailRow label="Court" value={activeCase.court_name} />
            <DetailRow label="County" value={activeCase.county} />
            <DetailRow label="Department" value={activeCase.department} />
            <DetailRow label="Judge" value={activeCase.judge_name} />
          </View>

          <Rule />

          <View style={styles.spineBlock}>
            <View style={styles.spineBlockHeader}>
              <Text style={styles.spineBlockTitle}>Children</Text>
              <Chip tone="mute" outline={false}>
                {childrenRows.length}
              </Chip>
            </View>
            {childrenRows.length ? (
              <View style={styles.compactStack}>
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
          </View>

          <Rule />

          <View style={styles.spineBlock}>
            <View style={styles.spineBlockHeader}>
              <Text style={styles.spineBlockTitle}>Parties and people</Text>
              <Chip tone="mute" outline={false}>
                {people.length}
              </Chip>
            </View>
            {people.length ? (
              <View style={styles.compactStack}>
                {people.slice(0, 6).map((person) => (
                  <SmallRecord
                    key={person.id}
                    title={person.display_name}
                    subtitle={[person.relationship, person.email, person.phone].filter(Boolean).join(' · ')}
                    tone={person.is_primary_client ? 'ox' : 'sand'}
                    meta={person.role}
                  />
                ))}
                {people.length > 6 ? (
                  <Text style={styles.compactNote}>{people.length - 6} more people are recorded.</Text>
                ) : null}
              </View>
            ) : (
              <EmptyState>No parties or people have been added to this case record yet.</EmptyState>
            )}
          </View>

          <Rule />

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
        </>
      ) : (
        <EmptyState>No active case has been selected yet.</EmptyState>
      )}
    </SoftCard>
  );
}

function CaseMapContextRail({
  caseTitle,
  childrenCount,
  peopleCount,
  courtOrdersCount,
  provisionsCount,
  datesCount,
  filingCount,
  hasCaseNumber,
  hasCourtInfo,
  persistenceActive,
  hydrationCompleted,
  sourceLabel,
}: {
  caseTitle: string;
  childrenCount: number;
  peopleCount: number;
  courtOrdersCount: number;
  provisionsCount: number;
  datesCount: number;
  filingCount: number;
  hasCaseNumber: boolean;
  hasCourtInfo: boolean;
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
      <Text style={styles.sectionLabel}>WHAT THIS PAGE IS FOR</Text>
      <Text style={styles.railText}>
        Use Case Map as the local case spine: case facts, people, orders, deadlines, and filing-package context in one place.
      </Text>
      <Rule />
      <Text style={styles.sectionLabel}>MISSING INFO CHECKLIST</Text>
      <View style={styles.checklistStack}>
        <ChecklistRow
          complete={hasCaseNumber}
          label="Case number"
          detail="Used for captions and future court form preparation."
        />
        <ChecklistRow
          complete={hasCourtInfo}
          label="Court and county"
          detail="Keeps reports and filing packages tied to the right jurisdiction label."
        />
        <ChecklistRow
          complete={childrenCount > 0}
          label="Children"
          detail="Supports child-specific entries, reports, and future filtering."
        />
        <ChecklistRow
          complete={courtOrdersCount > 0}
          label="Court orders"
          detail="Order intake is local placeholder only until document intake is added."
        />
        <ChecklistRow
          complete={provisionsCount > 0}
          label="Order provisions"
          detail="Provision extraction and entry linking come in later stages."
        />
      </View>
      <Rule />
      <View style={styles.railActionStack}>
        <PillButton tone="ghost" size="md" icon="doc" disabled full>
          Document intake coming later
        </PillButton>
        <PillButton tone="ghost" size="md" icon="link" disabled full>
          Court-order extraction coming later
        </PillButton>
        <PillButton tone="ghost" size="md" icon="scales" disabled full>
          Add court order shell coming later
        </PillButton>
        <PillButton tone="ghost" size="md" icon="clock" disabled full>
          Add key date shell coming later
        </PillButton>
      </View>
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
    filingPackageLinkedEntryCounts,
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
  const filingsSection = (
    <FilingsSection
      filingPackages={filingPackages}
      linkedEntryCountsByPackageId={filingPackageLinkedEntryCounts}
    />
  );
  const caseSpineSection = (
    <CaseSpine
      activeCase={activeCase}
      childrenRows={children}
      people={people}
      hasLocalCaseSetup={hasLocalCaseSetup}
      isDemoCase={isDemoCase}
    />
  );
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
          courtOrdersCount={courtOrders.length}
          provisionsCount={courtOrderProvisions.length}
          datesCount={keyDates.length}
          filingCount={filingPackages.length}
          hasCaseNumber={Boolean(activeCase?.case_number)}
          hasCourtInfo={Boolean(activeCase?.court_name || activeCase?.county)}
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

      {isMobile ? (
        <SoftCard p={16} style={styles.caseSummary}>
          <SectionHeader icon="scales" title="Active case" />
          {activeCase ? (
            <View style={styles.caseSummaryBody}>
              <View style={styles.summaryGrid}>
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
      ) : null}

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
        <View style={styles.desktopWorkstationGrid}>
          <View style={styles.desktopSpineColumn}>
            {caseSpineSection}
          </View>
          <View style={styles.desktopCenterColumn}>
            {courtOrdersSection}
            {datesSection}
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
  caseSummaryBody: {
    gap: fbSpacing.x4,
  },
  caseActions: {
    gap: fbSpacing.x3,
  },
  desktopWorkstationGrid: {
    marginTop: fbSpacing.x4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: fbSpacing.x4,
  },
  desktopSpineColumn: {
    width: 320,
    flexShrink: 0,
  },
  desktopCenterColumn: {
    flex: 1,
    minWidth: 0,
  },
  spineCard: {
    marginTop: fbSpacing.x4,
    gap: fbSpacing.x4,
  },
  spineDetails: {
    gap: fbSpacing.x3,
  },
  spineBlock: {
    gap: fbSpacing.x3,
  },
  spineBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: fbSpacing.x2,
  },
  spineBlockTitle: {
    color: fbColors.ink,
    fontSize: fbType.small,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
    letterSpacing: 0,
  },
  compactStack: {
    gap: fbSpacing.x1,
  },
  compactNote: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
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
  checklistStack: {
    gap: fbSpacing.x3,
  },
  checklistRow: {
    alignItems: 'flex-start',
    gap: fbSpacing.x2,
  },
  checklistCopy: {
    gap: fbSpacing.x1,
  },
  checklistLabel: {
    color: fbColors.ink,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansSemi,
    fontWeight: fbWeights.semi,
  },
  checklistDetail: {
    color: fbColors.inkMute,
    fontSize: fbType.small,
    lineHeight: 18,
    fontFamily: fbFonts.sansRegular,
  },
  railActionStack: {
    gap: fbSpacing.x2,
  },
});
