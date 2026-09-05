import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import type { Entry } from '../../case-intelligence/types';
import { buildTypedCaptureDetails, moneyCents, recordedInstant, typedCaptureSummary, validateTypedCaptureDetails } from '../capture';
import { buildFactualReports, communicationCalculation, exchangeCalculation, expenseCalculation, missedTimeCalculation, selectReportEntries } from '../reports';
import { createFactualReportPdf } from '../pdf';

function entry(id: string, type = 'journal', details?: unknown, patch: Partial<Entry> = {}): Entry {
  return { id, user_id: 'owner', case_id: 'case-a', child_id: 'child-a', entry_type: type, event_date: '2026-09-05', event_time: '10:00:00', event_end_time: null, custody_period: null,
    title: `Record ${id}`, body: 'User-recorded observation.', child_mood: null, is_flagged: false, flag_severity: null, flag_category: null, issue_key: null,
    location_name: null, location_lat: null, location_lng: null, metadata: { typed_capture: details } as Entry['metadata'], voice_transcript: null, capture_method: 'manual_text', content_hash: null,
    is_edited: false, private_notes: 'PRIVATE_NOTE_NEVER_EXPORT', court_ready_summary: null, created_at: '2026-09-05T10:05:00Z', updated_at: '2026-09-05T10:05:00Z', deleted_at: null, ...patch };
}
const exchange = (scheduledAt: string | null, actualAt: string) => ({ version: 1, kind: 'pickup_dropoff', scheduledAt, actualAt, exchangeType: 'pickup', transferMethod: 'in_person', people: '' });
const expense = (amount: string, requested = '', received = '') => buildTypedCaptureDetails('expense', { amount, reimbursementRequested: requested, reimbursementReceived: received, category: 'school', paidBy: 'me' }, '2026-09-05', '10:00');
const message = (direction: string, occurredAt: string, replyToEntryId: string | null, extra: Record<string, unknown> = {}) => ({ version: 1, kind: 'message', platform: 'email', correspondent: 'Alex', direction, occurredAt, replyToEntryId, tone: 'not_assessed', ...extra });

test('amounts use exact cents and reject malformed values and contradictory reimbursements', () => {
  assert.equal(moneyCents('0.10') + moneyCents('0.20'), 30);
  for (const value of ['-1', '1.234', '1e3', 'NaN', '', '1,000.00']) assert.throws(() => moneyCents(value));
  assert.throws(() => expense('0'), /greater than zero/);
  assert.throws(() => expense('10', '11'), /cannot exceed/);
  assert.throws(() => expense('10', '5', '6'), /cannot exceed/);
});

test('unrecorded reimbursements remain unknown and balances use only complete records', () => {
  const unknown = expense('25');
  assert.equal(unknown.kind, 'expense');
  if (unknown.kind !== 'expense') throw new Error('Wrong fixture kind');
  assert.equal(unknown.reimbursementRequestedCents, null);
  assert.equal(unknown.reimbursementReceivedCents, null);
  assert.deepEqual(typedCaptureSummary(unknown).slice(-2), [['Reimbursement requested', 'Not recorded'], ['Reimbursement received', 'Not recorded']]);
  assert.deepEqual(validateTypedCaptureDetails('expense', JSON.parse(JSON.stringify(unknown))), unknown);
  const records = [entry('unknown', 'expense', unknown), entry('request-only', 'expense', expense('25', '10')),
    entry('received-only', 'expense', expense('25', '', '4')), entry('complete', 'expense', expense('25', '8', '0'))];
  const result = expenseCalculation(records);
  assert.equal(result.requestedCents, 1800); assert.equal(result.receivedCents, 400);
  assert.equal(result.requestedCount, 2); assert.equal(result.receivedCount, 2);
  assert.equal(result.balanceCount, 1); assert.equal(result.balanceCents, 800);
  assert.equal(expenseCalculation([records[0]]).balanceCents, null);
  const facts = buildFactualReports(records).expense.keyFacts.join(' ');
  assert.match(facts, /Blank amounts are not treated as zero/);
  assert.match(facts, /USD 8.00 across 1 expenses/);
  assert.match(buildFactualReports([records[0]]).expense.keyFacts.join(' '), /Recorded balance: Not recorded/);
  assert.throws(() => expense('25', '', '26'), /cannot exceed/);
});

test('recorded instants reject invalid calendars/clocks/offsets and preserve DST elapsed time', () => {
  for (const value of ['2026-02-30 12:00Z', '2026-01-01 25:00Z', '2026-01-01 12:60Z', '2026-01-01 12:00+14:30', '2026-01-01 12:00+15:00']) assert.throws(() => recordedInstant(value));
  const start = recordedInstant('2026-03-08 01:30-08:00'); const end = recordedInstant('2026-03-08 03:30-07:00');
  assert.equal((Date.parse(end) - Date.parse(start)) / 3_600_000, 1);
  const fallFirst = recordedInstant('2026-11-01 01:30-07:00'); const fallSecond = recordedInstant('2026-11-01 01:30-08:00');
  assert.equal(Date.parse(fallSecond) - Date.parse(fallFirst), 3_600_000);
});

test('typed validation reconstructs allowed fields, keeps original quote, and validates required details', () => {
  const details = validateTypedCaptureDetails('child_statement', { version: 1, kind: 'child_statement', quote: 'I felt afraid.', context: 'Walking home', captured_body: 'injected', account_secret: 'excluded' });
  assert.deepEqual(details, { version: 1, kind: 'child_statement', quote: 'I felt afraid.', context: 'Walking home' });
  assert.equal(typedCaptureSummary(details)[0][1], '“I felt afraid.”');
  assert.throws(() => validateTypedCaptureDetails('expense', details), /match/);
  assert.throws(() => buildTypedCaptureDetails('medical', {}, '2026-09-05', ''), /Provider/);
  assert.throws(() => buildTypedCaptureDetails('visit_denied', { scheduledStartAt: '2026-09-05 17:00Z', scheduledEndAt: '2026-09-05 16:00Z', reason: 'No reason given' }, '2026-09-05', ''), /after/);
});

test('capture builders persist valid normalized instants that survive reload validation', () => {
  const exchangeDetails = buildTypedCaptureDetails('pickup_dropoff', { exchangeType: 'pickup', transferMethod: 'school', scheduledAt: '2026-09-05 10:00Z' }, '2026-09-05', '10:20Z');
  assert.deepEqual(validateTypedCaptureDetails('pickup_dropoff', JSON.parse(JSON.stringify(exchangeDetails))), exchangeDetails);
  assert.equal(exchangeCalculation([entry('new', 'pickup_dropoff', exchangeDetails)]).totalLateMinutes, 20);
  const denied = buildTypedCaptureDetails('visit_denied', { scheduledStartAt: '2026-09-05 17:00Z', scheduledEndAt: '2026-09-06 17:00Z', reason: 'No reason given' }, '2026-09-05', '17:00');
  assert.equal(missedTimeCalculation([entry('missed', 'visit_denied', denied)]).totalHours, 24);
  const communication = buildTypedCaptureDetails('message', { platform: 'email', direction: 'sent', correspondent: 'Alex', tone: 'not_assessed' }, '2026-09-05', '10:00Z');
  assert.deepEqual(validateTypedCaptureDetails('message', communication), communication);
});

test('report selection is uncapped and enforces case, owner, deletion, privacy and inclusive dates', () => {
  const records = Array.from({ length: 151 }, (_, i) => entry(`r${i}`));
  records.push(entry('wrong-case', 'journal', undefined, { case_id: 'case-b' }), entry('wrong-owner', 'journal', undefined, { user_id: 'else' }), entry('deleted', 'journal', undefined, { deleted_at: '2026-09-05T11:00Z' }), entry('private', 'journal', undefined, { metadata: { review_visibility: 'private' } }), entry('outside', 'journal', undefined, { event_date: '2026-09-04' }));
  const selected = selectReportEntries(records, { caseId: 'case-a', userId: 'owner', fromDate: '2026-09-05', toDate: '2026-09-05' });
  assert.equal(selected.length, 151);
  assert.equal(selectReportEntries(records, { caseId: 'case-a', userId: 'owner', childId: 'other-child' }).length, 0);
  assert.throws(() => selectReportEntries(records, { caseId: 'case-a', userId: 'owner', fromDate: '2026-09-06', toDate: '2026-09-05' }));
  assert.throws(() => buildFactualReports([entry('a'), entry('b', 'journal', undefined, { case_id: 'other' })]), /one account and case/);
});

test('lateness uses dates and offsets, never treats missing times or denied visits as on-time exchanges', () => {
  const records = [entry('overnight', 'pickup_dropoff', exchange('2026-09-05T23:30:00Z', '2026-09-06T00:15:00Z')),
    entry('early', 'pickup_dropoff', exchange('2026-09-05T10:30:00Z', '2026-09-05T10:00:00Z')),
    entry('missing', 'pickup_dropoff'), entry('denied', 'visit_denied')];
  const result = exchangeCalculation(records);
  assert.equal(result.exchangeCount, 3); assert.equal(result.calculatedRows.length, 2);
  assert.equal(result.lateRows.length, 1); assert.equal(result.totalLateMinutes, 45); assert.equal(result.missingTimes, 1);
  const updated = exchangeCalculation(records.map((row) => row.id === 'overnight' ? entry('overnight', 'pickup_dropoff', exchange('2026-09-05T23:30:00Z', '2026-09-06T00:30:00Z')) : row));
  assert.equal(updated.totalLateMinutes, 60);
});

test('missed-time intervals use actual elapsed duration and disclose overlapping records', () => {
  const details = (start: string, end: string) => ({ version: 1, kind: 'visit_denied', scheduledStartAt: start, scheduledEndAt: end, reason: 'No reason given', actions: '', witnesses: '' });
  const rows = [entry('a', 'visit_denied', details('2026-03-08T01:30:00-08:00', '2026-03-08T03:30:00-07:00')), entry('b', 'visit_denied', details('2026-03-08T03:00:00-07:00', '2026-03-08T04:00:00-07:00')), entry('missing', 'visit_denied')];
  const result = missedTimeCalculation(rows);
  assert.equal(result.totalHours, 2); assert.equal(result.overlaps, 1); assert.equal(result.missingTimes, 1);
  assert.match(buildFactualReports(rows).custodyExchange.keyFacts.join(' '), /double-count/);
});

test('expenses total all selected records in cents and separate missing structured data', () => {
  const result = expenseCalculation([entry('a', 'expense', expense('0.10')), entry('b', 'expense', expense('0.20', '0.10', '0.05'), { event_date: '2026-08-31' }), entry('legacy', 'expense')]);
  assert.equal(result.totalCents, 30); assert.equal(result.requestedCents - result.receivedCents, 5);
  assert.equal(result.byCategory.school, 30); assert.equal(result.byMonth['2026-08'], 20); assert.equal(result.byMonth['2026-09'], 10); assert.equal(result.missingAmounts, 1);
});

test('response times require an explicitly selected same-person/platform sent message and nonnegative time', () => {
  const sent = entry('sent', 'message', message('sent', '2026-09-05T10:00:00Z', null));
  const received = entry('received', 'message', message('received', '2026-09-05T10:25:00Z', 'sent'));
  assert.equal(communicationCalculation([sent, received]).responses[0].minutes, 25);
  assert.equal(communicationCalculation([received]).responses.length, 0);
  for (const extra of [{ platform: 'text' }, { correspondent: 'Someone else' }, { occurredAt: '2026-09-05T09:00:00Z' }, { replyToEntryId: null }]) {
    assert.equal(communicationCalculation([sent, entry('received', 'message', message('received', '2026-09-05T10:25:00Z', 'sent', extra))]).responses.length, 0);
  }
  const privateSent = { ...sent, metadata: { ...sent.metadata as object, review_visibility: 'private' } } as Entry;
  assert.match(buildFactualReports([privateSent, received]).communication.keyFacts.join(' '), /No response times/);
});

test('report PDF re-derives selected facts and produces a source appendix without accepting private/wrong-type records', async () => {
  const fonts = { regular: new Uint8Array(readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf')) };
  const row = entry('expense-one', 'expense', expense('12.50', '5', '2'));
  const input = { caseId: 'case-a', caseTitle: 'Synthetic test case', entries: [row], attachments: [], includedEntryIds: [row.id], generatedAt: '2026-09-05T12:00:00Z' };
  const artifact = await createFactualReportPdf(input, { reportType: 'expense', ownerId: 'owner', fonts });
  const pdf = await PDFDocument.load(artifact.bytes);
  assert.equal(pdf.getTitle(), 'Family Bench — Expense report'); assert.equal(pdf.getPageCount(), 2); assert.equal(artifact.mimeType, 'application/pdf');
  await assert.rejects(() => createFactualReportPdf({ ...input, entries: [{ ...row, metadata: { review_visibility: 'private' } }] }, { reportType: 'expense', ownerId: 'owner', fonts }), /Private/);
  await assert.rejects(() => createFactualReportPdf(input, { reportType: 'late', ownerId: 'owner', fonts }), /matching record/);
  await assert.rejects(() => createFactualReportPdf(input, { reportType: 'expense', ownerId: 'someone-else', fonts }), /another account/);
  let currentChecks = 0;
  await assert.rejects(() => createFactualReportPdf(input, { reportType: 'expense', ownerId: 'owner', fonts, assertCurrent: () => { if (++currentChecks > 1) throw new Error('Account changed'); } }), /Account changed/);
  await assert.rejects(() => createFactualReportPdf({ ...input, entries: [{ ...row, body: 'Unsupported glyph 🦄' }] }, { reportType: 'expense', ownerId: 'owner', fonts }), /cannot preserve/);
});
