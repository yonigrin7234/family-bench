import type {
  CaseIntelligenceSnapshot,
  DetectedCasePattern,
  DetectedPatternKind,
  Entry,
  FilingBuilderState,
  FilingPackage,
  PatternReviewState,
  PatternStatus,
} from './types';

const LATE_EXCHANGE_TERMS = [
  'late',
  'delay',
  'delayed',
  'after scheduled',
  'past scheduled',
  'minutes late',
  'arrived after',
];

const MEDICAL_TERMS = [
  'medical',
  'doctor',
  'appointment',
  'therapy',
  'therapist',
  'prescription',
  'dentist',
  'urgent care',
  'medication',
];

const COMMUNICATION_TERMS = [
  'no response',
  'no reply',
  'did not respond',
  "didn't respond",
  'without responding',
  'unanswered',
  'refuse',
  'refused',
  'declined',
  'would not answer',
  "won't respond",
];

function isLive<T extends { deleted_at: string | null }>(row: T) {
  return !row.deleted_at;
}

function entryTimestamp(entry: Entry) {
  return `${entry.event_date}T${entry.event_time ?? '00:00:00'}`;
}

function byEntryDateAsc(a: Entry, b: Entry) {
  return entryTimestamp(a).localeCompare(entryTimestamp(b));
}

function byEntryDateDesc(a: Entry, b: Entry) {
  return entryTimestamp(b).localeCompare(entryTimestamp(a));
}

function entryText(entry: Entry) {
  return [
    entry.title,
    entry.body,
    entry.private_notes,
    entry.court_ready_summary,
    entry.issue_key,
    entry.flag_category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasAnyTerm(entry: Entry, terms: string[]) {
  const text = entryText(entry);
  return terms.some((term) => text.includes(term));
}

function patternId(caseId: string, kind: DetectedPatternKind, suffix?: string) {
  return suffix ? `${caseId}:${kind}:${suffix}` : `${caseId}:${kind}`;
}

function patternStatus(patternIdValue: string, state: PatternReviewState): PatternStatus {
  if (state.dismissedPatternIds.includes(patternIdValue)) return 'dismissed';
  if (state.acknowledgedPatternIds.includes(patternIdValue)) return 'acknowledged';
  return 'new';
}

function relatedFilingPackagesForEntries({
  entryIds,
  filingPackages,
  filingBuilderState,
}: {
  entryIds: string[];
  filingPackages: FilingPackage[];
  filingBuilderState: FilingBuilderState;
}) {
  const entryIdSet = new Set(entryIds);
  const packageById = new Map(filingPackages.map((filingPackage) => [filingPackage.id, filingPackage]));

  return Object.values(filingBuilderState.packageStates)
    .filter((packageState) => packageState.linkedEntryIds.some((entryId) => entryIdSet.has(entryId)))
    .map((packageState) => packageById.get(packageState.packageId) ?? null)
    .filter((filingPackage): filingPackage is FilingPackage => Boolean(filingPackage));
}

function createPattern({
  id,
  kind,
  title,
  explanation,
  entries,
  filingPackages,
  filingBuilderState,
  reviewState,
  relatedFilingPackages,
}: {
  id: string;
  kind: DetectedPatternKind;
  title: string;
  explanation: string;
  entries: Entry[];
  filingPackages: FilingPackage[];
  filingBuilderState: FilingBuilderState;
  reviewState: PatternReviewState;
  relatedFilingPackages?: FilingPackage[];
}): DetectedCasePattern | null {
  const sourceEntries = [...entries].sort(byEntryDateDesc);
  if (!sourceEntries.length) return null;

  const dateSorted = [...sourceEntries].sort(byEntryDateAsc);
  const entryIds = sourceEntries.map((entry) => entry.id);

  return {
    id,
    kind,
    title,
    explanation,
    entryCount: sourceEntries.length,
    firstSeenOn: dateSorted[0]?.event_date ?? null,
    lastSeenOn: dateSorted[dateSorted.length - 1]?.event_date ?? null,
    sourceEntries,
    relatedFilingPackages:
      relatedFilingPackages ??
      relatedFilingPackagesForEntries({ entryIds, filingPackages, filingBuilderState }),
    status: patternStatus(id, reviewState),
  };
}

export function buildDetectedCasePatterns({
  snapshot,
  caseId,
  filingBuilderState,
  patternReviewState,
}: {
  snapshot: CaseIntelligenceSnapshot;
  caseId?: string | null;
  filingBuilderState: FilingBuilderState;
  patternReviewState: PatternReviewState;
}): DetectedCasePattern[] {
  if (!caseId) return [];

  const entries = snapshot.entries
    .filter(isLive)
    .filter((entry) => entry.case_id === caseId);
  const filingPackages = snapshot.filingPackages
    .filter(isLive)
    .filter((filingPackage) => filingPackage.case_id === caseId);
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  const patterns = [
    createPattern({
      id: patternId(caseId, 'late_exchanges'),
      kind: 'late_exchanges',
      title: 'Possible pattern: repeated late exchanges',
      explanation:
        'Two or more exchange entries mention late timing. Review the supporting entries for dates, scheduled times, and actual timing when available.',
      entries: entries.filter(
        (entry) => entry.entry_type === 'pickup_dropoff' && hasAnyTerm(entry, LATE_EXCHANGE_TERMS),
      ),
      filingPackages,
      filingBuilderState,
      reviewState: patternReviewState,
    }),
    createPattern({
      id: patternId(caseId, 'denied_visits'),
      kind: 'denied_visits',
      title: 'Possible pattern: scheduled parenting time did not happen',
      explanation:
        'These entries record scheduled parenting time that did not happen or was marked as missed. The app is grouping source records only.',
      entries: entries.filter(
        (entry) =>
          entry.entry_type === 'visit_denied' ||
          entry.issue_key === 'missed_exchanges' ||
          entry.flag_category === 'denied_visit',
      ),
      filingPackages,
      filingBuilderState,
      reviewState: patternReviewState,
    }),
    createPattern({
      id: patternId(caseId, 'flagged_incidents'),
      kind: 'flagged_incidents',
      title: 'Possible pattern: flagged entries needing review',
      explanation:
        'These entries were marked for review by the user. The app is not determining severity or drawing legal conclusions.',
      entries: entries.filter((entry) => entry.is_flagged),
      filingPackages,
      filingBuilderState,
      reviewState: patternReviewState,
    }),
    createPattern({
      id: patternId(caseId, 'medical_entries'),
      kind: 'medical_entries',
      title: 'Possible pattern: medical-related records',
      explanation:
        'These entries are medical records or include medical terms. Review source details before using them in a report or filing package.',
      entries: entries.filter(
        (entry) =>
          entry.entry_type === 'medical' ||
          entry.issue_key === 'medical' ||
          hasAnyTerm(entry, MEDICAL_TERMS),
      ),
      filingPackages,
      filingBuilderState,
      reviewState: patternReviewState,
    }),
    createPattern({
      id: patternId(caseId, 'communication_non_response'),
      kind: 'communication_non_response',
      title: 'Possible pattern: communication non-response or refusal',
      explanation:
        'These communication entries include local text terms such as no response, no reply, refused, or declined. This placeholder rule uses local text only.',
      entries: entries.filter(
        (entry) =>
          (entry.entry_type === 'message' || entry.issue_key === 'communications') &&
          hasAnyTerm(entry, COMMUNICATION_TERMS),
      ),
      filingPackages,
      filingBuilderState,
      reviewState: patternReviewState,
    }),
    ...filingPackages
      .map((filingPackage) => {
        const packageState = filingBuilderState.packageStates[filingPackage.id];
        const linkedEntries =
          packageState?.linkedEntryIds
            .map((entryId) => entryById.get(entryId) ?? null)
            .filter((entry): entry is Entry => Boolean(entry)) ?? [];

        return createPattern({
          id: patternId(caseId, 'filing_linked_entries', filingPackage.id),
          kind: 'filing_linked_entries',
          title: 'Possible pattern: entries grouped in a filing package',
          explanation:
            'These entries are currently linked to a local filing package. This grouping does not decide whether a filing is appropriate.',
          entries: linkedEntries,
          filingPackages,
          filingBuilderState,
          reviewState: patternReviewState,
          relatedFilingPackages: [filingPackage],
        });
      }),
  ].filter((pattern): pattern is DetectedCasePattern => Boolean(pattern));

  return patterns.filter((pattern) => pattern.kind !== 'late_exchanges' || pattern.entryCount >= 2);
}
