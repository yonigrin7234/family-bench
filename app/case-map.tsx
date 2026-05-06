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
    persistence,
  } = useCaseMap();

  return (
    <CaseScreen>
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
          <View style={styles.summaryGrid}>
            <DetailRow label="Case" value={activeCase.title || activeCase.case_number} />
            <DetailRow label="Court" value={activeCase.court_name} />
            <DetailRow label="County" value={activeCase.county} />
            <DetailRow label="Department" value={activeCase.department} />
            <DetailRow label="Judge" value={activeCase.judge_name} />
            <DetailRow label="Status" value={activeCase.status} />
          </View>
        ) : (
          <EmptyState>No active case has been selected yet.</EmptyState>
        )}
      </SoftCard>

      <InfoCallout title="Linking status" tone="ink">
        Entry linking is not active yet. This map establishes the case structure for future links to orders, hearings, deadlines, and filings.
      </InfoCallout>

      <ChildrenSection childrenRows={children} />
      <PeopleSection people={people} />
      <CourtOrdersSection courtOrders={courtOrders} provisions={courtOrderProvisions} />
      <DatesSection keyDates={keyDates} />
      <FilingsSection filingPackages={filingPackages} />

      <SoftCard p={16} style={styles.section}>
        <SectionHeader icon="shield" title="Data source" />
        <Text style={styles.sourceText}>
          This view is reading the current {source === 'supabase' ? 'Supabase-backed' : source === 'local' ? 'local persisted' : 'local demo'} case-intelligence snapshot. No remote writes are made from Case Map.
        </Text>
        <Text style={styles.sourceText}>
          Local persistence: {persistence.active ? 'active' : 'inactive'} · Hydration: {persistence.hydrationCompleted ? 'complete' : 'pending'} · Sync: {persistence.syncMode === 'remote_write_enabled' ? 'remote writes enabled by env' : persistence.syncMode === 'local_first' ? 'local-first, remote writes disabled' : 'disabled demo mode'}
        </Text>
        {persistence.error ? <Text style={styles.sourceWarning}>{persistence.error}</Text> : null}
        <PillButton tone="ghost" size="md" icon="link" disabled full>
          Link selected entry · coming later
        </PillButton>
      </SoftCard>
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
  summaryGrid: {
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
});
