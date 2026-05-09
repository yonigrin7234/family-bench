import type {
  CaseIntelligenceSnapshot,
  Entry,
  FamilyBenchCase,
  KeyDate,
  NextStep,
  PatternTag,
} from './types';

function isLive<T extends { deleted_at: string | null }>(row: T) {
  return !row.deleted_at;
}

function byDateAsc(a: KeyDate, b: KeyDate) {
  const left = `${a.event_date}T${a.event_time ?? '00:00:00'}`;
  const right = `${b.event_date}T${b.event_time ?? '00:00:00'}`;
  return left.localeCompare(right);
}

function byEntryDateDesc(a: Entry, b: Entry) {
  const left = `${a.event_date}T${a.event_time ?? '00:00:00'}`;
  const right = `${b.event_date}T${b.event_time ?? '00:00:00'}`;
  return right.localeCompare(left);
}

function daysUntil(date: string, today = new Date()) {
  const target = new Date(`${date}T12:00:00`);
  const base = new Date(today);
  base.setHours(12, 0, 0, 0);
  return Math.ceil((target.getTime() - base.getTime()) / 86_400_000);
}

function keyDateDescription(value?: string | null) {
  return value?.replace('[family-bench-priority:true]', '').trim() || null;
}

export function formatDateLabel(date: string, time?: string | null) {
  const parsed = new Date(`${date}T${time ?? '12:00:00'}`);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(parsed);

  if (!time) return dateLabel;

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);

  return `${dateLabel} · ${timeLabel}`;
}

export function getRelativeDueLabel(date?: string | null, today = new Date()) {
  if (!date) return undefined;
  const days = daysUntil(date, today);
  if (days < 0) return 'Past due';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days`;
}

export function getActiveCase(snapshot: CaseIntelligenceSnapshot): FamilyBenchCase | null {
  return (
    snapshot.cases
      .filter(isLive)
      .find((c) => c.is_active || c.status === 'active') ??
    snapshot.cases.filter(isLive)[0] ??
    null
  );
}

export function getUpcomingKeyDates(
  snapshot: CaseIntelligenceSnapshot,
  caseId = getActiveCase(snapshot)?.id,
  today = new Date(),
) {
  if (!caseId) return [];
  const todayDate = today.toISOString().slice(0, 10);

  return snapshot.keyDates
    .filter(isLive)
    .filter((d) => d.case_id === caseId)
    .filter((d) => !d.is_completed)
    .filter((d) => d.event_date >= todayDate)
    .sort(byDateAsc);
}

export function getRecentEntries(
  snapshot: CaseIntelligenceSnapshot,
  caseId = getActiveCase(snapshot)?.id,
  limit = 8,
) {
  if (!caseId) return [];
  return snapshot.entries
    .filter(isLive)
    .filter((entry) => entry.case_id === caseId)
    .sort(byEntryDateDesc)
    .slice(0, limit);
}

export function getFlaggedEntries(
  snapshot: CaseIntelligenceSnapshot,
  caseId = getActiveCase(snapshot)?.id,
) {
  if (!caseId) return [];
  return snapshot.entries
    .filter(isLive)
    .filter((entry) => entry.case_id === caseId)
    .filter((entry) => entry.is_flagged)
    .sort(byEntryDateDesc);
}

export function getEntriesByType(
  snapshot: CaseIntelligenceSnapshot,
  entryType: string,
  caseId = getActiveCase(snapshot)?.id,
) {
  if (!caseId) return [];
  return snapshot.entries
    .filter(isLive)
    .filter((entry) => entry.case_id === caseId)
    .filter((entry) => entry.entry_type === entryType)
    .sort(byEntryDateDesc);
}

export function getEntriesByIssue(
  snapshot: CaseIntelligenceSnapshot,
  issueKey: string,
  caseId = getActiveCase(snapshot)?.id,
) {
  if (!caseId) return [];
  return snapshot.entries
    .filter(isLive)
    .filter((entry) => entry.case_id === caseId)
    .filter((entry) => entry.issue_key === issueKey || entry.flag_category === issueKey)
    .sort(byEntryDateDesc);
}

export function getPatternsForCase(
  snapshot: CaseIntelligenceSnapshot,
  caseId = getActiveCase(snapshot)?.id,
): PatternTag[] {
  if (!caseId) return [];
  return snapshot.patternTags
    .filter(isLive)
    .filter((tag) => tag.case_id === caseId)
    .sort((a, b) => (b.last_seen_on ?? '').localeCompare(a.last_seen_on ?? ''));
}

export function getNextStepForCase(
  snapshot: CaseIntelligenceSnapshot,
  caseId = getActiveCase(snapshot)?.id,
  today = new Date(),
): NextStep {
  if (!caseId) {
    return {
      title: 'Set up your case',
      body: 'Add the court, parties, and hearing date before building court-ready records.',
      primaryLabel: 'Start setup',
      secondaryLabel: 'Not now',
    };
  }

  const nextFiling = snapshot.filingPackages
    .filter(isLive)
    .filter((pkg) => pkg.case_id === caseId)
    .filter((pkg) => !['filed', 'served', 'complete'].includes(pkg.status))
    .sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))[0];

  if (nextFiling) {
    return {
      title: nextFiling.title,
      body:
        nextFiling.court_ready_summary ??
        'Continue the filing package using saved case records and evidence.',
      primaryLabel: 'Continue filing',
      secondaryLabel: 'Not now',
      dueLabel: getRelativeDueLabel(nextFiling.due_date, today),
      completionPercent: nextFiling.completion_percent,
      relatedFilingPackageId: nextFiling.id,
    };
  }

  const nextDate = getUpcomingKeyDates(snapshot, caseId, today)[0];
  if (nextDate) {
    return {
      title: nextDate.title,
      body: keyDateDescription(nextDate.description) ?? 'Review the case record before this date.',
      primaryLabel: 'Review date',
      secondaryLabel: 'Not now',
      dueLabel: getRelativeDueLabel(nextDate.event_date, today),
      relatedKeyDateId: nextDate.id,
    };
  }

  return {
    title: 'Log the next event',
    body: 'Capture exchanges, expenses, statements, and documents while details are fresh.',
    primaryLabel: 'Log event',
    secondaryLabel: 'Not now',
  };
}
