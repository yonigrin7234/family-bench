import type { Entry, ReportPreviewType } from '../case-intelligence/types';
import { getEntryTypeOption } from '../case-intelligence/entryTypes';
import { inDateRange, isPrivateEntry, validateDateRange } from '../export/model';
import { formatMoney, validateTypedCaptureDetails, type TypedCaptureDetails } from './capture';

export type FactualReport = {
  id: ReportPreviewType;
  title: string;
  description: string;
  icon: 'clock' | 'flag' | 'chat' | 'shield' | 'home' | 'receipt' | 'doc';
  entries: Entry[];
  keyFacts: string[];
  calculationRows: Array<{ entryId: string; text: string }>;
};

export function selectReportEntries(entries: Entry[], filter: {
  caseId: string; userId: string; fromDate?: string; toDate?: string; childId?: string;
  entryType?: string; flaggedOnly?: boolean;
}): Entry[] {
  validateDateRange(filter.fromDate, filter.toDate);
  return entries.filter((entry) => !entry.deleted_at && entry.case_id === filter.caseId && entry.user_id === filter.userId
    && !isPrivateEntry(entry) && inDateRange(entry, filter.fromDate, filter.toDate)
    && (!filter.childId || entry.child_id === filter.childId)
    && (!filter.entryType || entry.entry_type === filter.entryType) && (!filter.flaggedOnly || entry.is_flagged))
    .sort((a, b) => `${a.event_date}T${a.event_time || ''}`.localeCompare(`${b.event_date}T${b.event_time || ''}`) || a.id.localeCompare(b.id));
}

export function readTypedDetails(entry: Entry): TypedCaptureDetails | null {
  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  try { return validateTypedCaptureDetails(entry.entry_type, metadata.typed_capture); } catch { return null; }
}

export function exchangeCalculation(entries: Entry[]) {
  const exchanges = entries.filter((entry) => entry.entry_type === 'pickup_dropoff');
  const calculatedRows = exchanges.flatMap((entry) => {
    const details = readTypedDetails(entry);
    if (details?.kind !== 'pickup_dropoff' || !details.scheduledAt) return [];
    const deltaMinutes = (Date.parse(details.actualAt) - Date.parse(details.scheduledAt)) / 60_000;
    return [{ entry, scheduled: details.scheduledAt, actual: details.actualAt, lateMinutes: Math.max(0, deltaMinutes), deltaMinutes }];
  });
  const lateRows = calculatedRows.filter((row) => row.lateMinutes > 0);
  const totalLateMinutes = lateRows.reduce((sum, row) => sum + row.lateMinutes, 0);
  return { exchangeCount: exchanges.length, flaggedExchangeCount: exchanges.filter((entry) => entry.is_flagged).length,
    calculatedRows, lateRows, totalLateMinutes, missingTimes: exchanges.length - calculatedRows.length,
    summary: `${lateRows.length} late exchanges among ${calculatedRows.length} with recorded scheduled and actual instants; ${formatNumber(totalLateMinutes)} total late minutes. ${exchanges.length - calculatedRows.length} exchanges lack valid structured times and are excluded from timing totals.` };
}

export function missedTimeCalculation(entries: Entry[]) {
  const source = entries.filter((entry) => entry.entry_type === 'visit_denied');
  const rows = source.flatMap((entry) => {
    const details = readTypedDetails(entry);
    if (details?.kind !== 'visit_denied') return [];
    return [{ entry, start: Date.parse(details.scheduledStartAt), end: Date.parse(details.scheduledEndAt), hours: (Date.parse(details.scheduledEndAt) - Date.parse(details.scheduledStartAt)) / 3_600_000 }];
  });
  // Sum each recorded interval; flag overlaps rather than claiming distinct custody hours.
  const overlaps = rows.filter((row, i) => rows.slice(0, i).some((other) => other.entry.child_id === row.entry.child_id && row.start < other.end && other.start < row.end)).length;
  return { rows, totalHours: rows.reduce((sum, row) => sum + row.hours, 0), missingTimes: source.length - rows.length, overlaps };
}

export function expenseCalculation(entries: Entry[]) {
  const expenses = entries.filter((entry) => entry.entry_type === 'expense');
  const rows = expenses.flatMap((entry) => {
    const details = readTypedDetails(entry);
    return details?.kind === 'expense' ? [{ entry, ...details }] : [];
  });
  const total = (key: 'amountCents' | 'reimbursementRequestedCents' | 'reimbursementReceivedCents') => {
    const value = rows.reduce((sum, row) => sum + (row[key] ?? 0), 0);
    if (!Number.isSafeInteger(value)) throw new Error('The expense total exceeds the supported exact amount. Narrow the report range.');
    return value;
  };
  const groups = (key: (row: typeof rows[number]) => string) => rows.reduce<Record<string, number>>((sum, row) => {
    const group = key(row); sum[group] = (sum[group] ?? 0) + row.amountCents; return sum;
  }, Object.create(null) as Record<string, number>);
  const completeRows = rows.filter((row) => row.reimbursementRequestedCents !== null && row.reimbursementReceivedCents !== null);
  return { rows, totalCents: total('amountCents'), requestedCents: total('reimbursementRequestedCents'), receivedCents: total('reimbursementReceivedCents'),
    requestedCount: rows.filter((row) => row.reimbursementRequestedCents !== null).length,
    receivedCount: rows.filter((row) => row.reimbursementReceivedCents !== null).length,
    balanceCount: completeRows.length,
    balanceCents: completeRows.length ? completeRows.reduce((sum, row) => sum + row.reimbursementRequestedCents! - row.reimbursementReceivedCents!, 0) : null,
    byCategory: groups((row) => row.category), byMonth: groups((row) => row.entry.event_date.slice(0, 7)), missingAmounts: expenses.length - rows.length };
}

export function communicationCalculation(entries: Entry[]) {
  const messages = entries.filter((entry) => entry.entry_type === 'message');
  const rows = messages.flatMap((entry) => { const details = readTypedDetails(entry); return details?.kind === 'message' ? [{ entry, ...details }] : []; });
  const byId = new Map(rows.map((row) => [row.entry.id, row]));
  const responses = rows.flatMap((row) => {
    if (row.direction !== 'received' || !row.replyToEntryId) return [];
    const sent = byId.get(row.replyToEntryId);
    if (!sent || sent.direction !== 'sent' || sent.entry.case_id !== row.entry.case_id || sent.entry.user_id !== row.entry.user_id
      || sent.platform !== row.platform || sent.correspondent.trim().toLowerCase() !== row.correspondent.trim().toLowerCase()) return [];
    const minutes = (Date.parse(row.occurredAt) - Date.parse(sent.occurredAt)) / 60_000;
    if (minutes < 0) return [];
    return [{ entryId: row.entry.id, sourceEntryId: sent.entry.id, minutes }];
  });
  const tones = rows.reduce<Record<string, number>>((counts, row) => { counts[row.tone] = (counts[row.tone] ?? 0) + 1; return counts; }, Object.create(null) as Record<string, number>);
  return { rows, responses, tones, missingDetails: messages.length - rows.length,
    uncalculatedLinks: rows.filter((row) => row.replyToEntryId).length - responses.length };
}

export function formatNumber(value: number): string { return Number(value.toFixed(2)).toString(); }
export function reportDateRange(entries: Entry[]): string {
  const dates = entries.map((entry) => entry.event_date).sort();
  return dates.length ? dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} to ${dates[dates.length - 1]}` : 'No selected records';
}

/** Receives the selected, owner/case-filtered record set. Defends privacy again at the derivation boundary. */
export function buildFactualReports(input: Entry[]): Record<ReportPreviewType, FactualReport> {
  const entries = input.filter((entry) => !entry.deleted_at && !isPrivateEntry(entry));
  if (new Set(entries.map((entry) => `${entry.user_id}:${entry.case_id}`)).size > 1) throw new Error('Build a report from one account and case at a time.');
  const flagged = entries.filter((entry) => entry.is_flagged);
  const messages = entries.filter((entry) => entry.entry_type === 'message');
  const medical = entries.filter((entry) => entry.entry_type === 'medical');
  const exchanges = entries.filter((entry) => ['pickup_dropoff', 'visit_denied', 'schedule_change'].includes(entry.entry_type));
  const timing = exchangeCalculation(entries); const missed = missedTimeCalculation(entries); const expense = expenseCalculation(entries); const communication = communicationCalculation(entries);
  const categories = [...new Set(entries.map((entry) => getEntryTypeOption(entry.entry_type).label))].join(', ') || 'None';
  const report = (id: ReportPreviewType, title: string, description: string, icon: FactualReport['icon'], source: Entry[], keyFacts: string[], calculationRows: FactualReport['calculationRows'] = []): FactualReport => ({ id, title, description, icon, entries: source, keyFacts, calculationRows });
  const timingRows = timing.calculatedRows.map((row) => ({ entryId: row.entry.id, text: `Scheduled ${row.scheduled}; actual ${row.actual}; ${formatNumber(row.lateMinutes)} minutes late${row.deltaMinutes < 0 ? ` (${formatNumber(-row.deltaMinutes)} minutes early)` : ''}.` }));
  const missedFacts = [`${missed.rows.length} missed-visit records have a scheduled interval: ${formatNumber(missed.totalHours)} recorded interval hours. ${missed.missingTimes} records lack valid intervals.`,
    ...(missed.overlaps ? [`${missed.overlaps} recorded intervals overlap another interval for the same child/case-wide scope. The sum can double-count time.`] : []),
    'These observations do not establish an ordered custody baseline, distinct hours lost, or a custody percentage.'];
  const expenseFacts = [`${expense.rows.length} expenses with valid USD amounts total ${formatMoney(expense.totalCents)}. ${expense.missingAmounts} expense records lack valid structured amounts and are excluded from totals.`,
    `Reimbursement requested: ${formatMoney(expense.requestedCount ? expense.requestedCents : null)} from ${expense.requestedCount} of ${expense.rows.length} expenses; received: ${formatMoney(expense.receivedCount ? expense.receivedCents : null)} from ${expense.receivedCount} of ${expense.rows.length}. Blank amounts are not treated as zero.`,
    `Recorded balance: ${formatMoney(expense.balanceCents)} across ${expense.balanceCount} expenses with both requested and received amounts recorded. ${expense.rows.length - expense.balanceCount} expenses are excluded from this balance. This is not a determination of what is owed.`,
    ...Object.entries(expense.byCategory).sort().map(([category, amount]) => `Category ${category}: ${formatMoney(amount)}.`),
    ...Object.entries(expense.byMonth).sort().map(([month, amount]) => `Month ${month}: ${formatMoney(amount)}.`)];
  const severity = flagged.reduce<Record<string, number>>((counts, entry) => { const key = entry.flag_severity || 'not recorded'; counts[key] = (counts[key] ?? 0) + 1; return counts; }, Object.create(null) as Record<string, number>);
  return {
    timeline: report('timeline', 'Full journal', 'Chronological selected records, with private records excluded.', 'clock', entries, [`${entries.length} selected entries; ${flagged.length} flagged for review.`, `Recorded dates: ${reportDateRange(entries)}.`, `Types: ${categories}.`]),
    flagged: report('flagged', 'Flagged incidents', 'Entries marked by the user for follow-up; flags are not verified findings.', 'flag', flagged, [`${flagged.length} flagged records.`, ...Object.entries(severity).sort().map(([level, count]) => `Recorded severity ${level}: ${count}.`)]),
    communication: report('communication', 'Communication summary', 'Recorded messages and explicitly linked replies; no automatic tone or legal classification.', 'chat', messages,
      [`${messages.length} message records; ${communication.rows.filter((row) => row.direction === 'sent').length} recorded sent and ${communication.rows.filter((row) => row.direction === 'received').length} received. ${communication.missingDetails} lack structured details.`,
        communication.responses.length ? `${communication.responses.length} linked replies have a mean response time of ${formatNumber(communication.responses.reduce((sum, row) => sum + row.minutes, 0) / communication.responses.length)} minutes.` : 'No response times can be calculated from the selected records.',
        `${communication.uncalculatedLinks} reply links were excluded because their selected source, person, platform, or time did not match.`,
        'Response timing uses selected, explicitly linked messages only; no reply or relationship is inferred.',
        ...Object.entries(communication.tones).sort().map(([tone, count]) => `Tone described by you — ${tone.replaceAll('_', ' ')}: ${count}.`)],
      communication.responses.map((row) => ({ entryId: row.entryId, text: `Reply to ${row.sourceEntryId}: ${formatNumber(row.minutes)} minutes.` }))),
    medical: report('medical', 'Medical summary', 'User-recorded visits and health notes; no diagnosis or treatment inference.', 'shield', medical,
      [`${medical.length} medical records.`, ...medical.flatMap((entry) => { const details = readTypedDetails(entry); return details?.kind === 'medical' ? [`${entry.event_date}: ${details.provider}, ${details.visitType}; next appointment ${details.nextAppointmentDate || 'not recorded'}. Source ${entry.id}.`] : []; })]),
    custodyExchange: report('custodyExchange', 'Exchange and missed-time summary', 'Scheduled/actual exchange timing and recorded missed-visit intervals.', 'home', exchanges,
      [timing.summary, ...missedFacts], [...timingRows, ...missed.rows.map((row) => ({ entryId: row.entry.id, text: `Recorded missed interval: ${formatNumber(row.hours)} hours; ${new Date(row.start).toISOString()} to ${new Date(row.end).toISOString()}.` }))]),
    late: report('late', 'Late incident report', 'All selected exchange records, with timing coverage and source-linked calculations.', 'clock', entries.filter((entry) => entry.entry_type === 'pickup_dropoff'), [timing.summary, 'Early arrivals are recorded as zero late minutes. Dates and offsets are used across midnight and clock changes. Missing times are never treated as on time.'], timingRows),
    expense: report('expense', 'Expense report', 'Recorded USD amounts grouped by category and event month.', 'receipt', entries.filter((entry) => entry.entry_type === 'expense'), expenseFacts,
      expense.rows.map((row) => ({ entryId: row.entry.id, text: `${row.entry.event_date}: ${formatMoney(row.amountCents)}, ${row.category}; paid by ${row.paidBy.replaceAll('_', ' ')}; requested ${formatMoney(row.reimbursementRequestedCents)}, received ${formatMoney(row.reimbursementReceivedCents)}.` }))),
    benchBrief: report('benchBrief', 'Bench Brief — factual overview', 'A selected-record overview with a source appendix; not an official court form or legal assessment.', 'doc', entries,
      [`Recorded dates: ${reportDateRange(entries)}.`, `${entries.length} records: ${flagged.length} flagged, ${messages.length} messages, ${medical.length} medical notes.`, timing.summary, ...missedFacts, ...expenseFacts]),
  };
}
