import assert from 'node:assert/strict';
import test from 'node:test';
import type { Entry } from '../../case-intelligence/types';
import { calculateCustodyTime, validateCustodyInterval, type CustodyBasis, type CustodyCaregiver } from '../custody';

const filter = { ownerId: 'owner', caseId: 'case', childId: null, fromAt: '2026-09-01T00:00:00Z', toAt: '2026-09-02T00:00:00Z', basis: 'actual' as const };
function source(id: string, startAt: string, endAt: string, caregiver: CustodyCaregiver, patch: Partial<Entry> = {}, basis: CustodyBasis = 'actual'): Entry {
  return { id, user_id: 'owner', case_id: 'case', child_id: null, entry_type: 'other',
    event_date: '2026-09-01', event_time: null, event_end_time: null, custody_period: null, title: 'Time interval', body: 'Recorded time',
    child_mood: null, is_flagged: false, flag_severity: null, flag_category: null, issue_key: null,
    location_name: null, location_lat: null, location_lng: null,
    metadata: { custody_interval: { version: 1, startAt, endAt, caregiver, basis } }, voice_transcript: null,
    capture_method: 'manual', content_hash: null, is_edited: false, private_notes: null, court_ready_summary: null,
    created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', deleted_at: null, ...patch };
}
const at = (hour: number) => `2026-09-01T${String(hour).padStart(2, '0')}:00:00Z`;

test('custody percentages use elapsed time, not number of entries', () => {
  const result = calculateCustodyTime([source('one', at(0), at(6), 'me'), source('two', at(6), at(18), 'other_parent')], filter);
  assert.deepEqual(result.hours, { me: 6, other_parent: 12, neutral: 0 });
  assert.equal(result.unknownHours, 6);
  assert.equal(result.totalHours, 24);
  assert.ok(Math.abs(result.yourRecordedShare! - 100 / 3) < 1e-10);
});

test('same-caregiver overlaps count once; contradictory intervals remain unresolved', () => {
  const result = calculateCustodyTime([
    source('one', at(0), at(12), 'me'), source('duplicate', at(0), at(12), 'me'),
    source('overlap', at(6), at(18), 'other_parent'), source('third', at(18), at(20), 'neutral'),
  ], filter);
  assert.deepEqual(result.hours, { me: 6, other_parent: 6, neutral: 2 });
  assert.equal(result.conflictingHours, 6);
  assert.equal(result.unknownHours, 4);
  assert.equal(result.coveredHours + result.conflictingHours + result.unknownHours, result.totalHours);
});

test('intervals are clipped to the selected period and touching endpoints do not overlap', () => {
  const result = calculateCustodyTime([
    source('earlier', '2026-08-31T12:00:00Z', at(8), 'me'),
    source('later', at(8), '2026-09-02T12:00:00Z', 'other_parent'),
    source('outside', '2026-08-30T00:00:00Z', '2026-08-31T00:00:00Z', 'neutral'),
  ], filter);
  assert.deepEqual(result.hours, { me: 8, other_parent: 16, neutral: 0 });
  assert.equal(result.conflictingHours, 0);
  assert.equal(result.sourceEntries.length, 2);
});

test('owner, case, child, deletion and scheduled/actual scopes remain separate', () => {
  const rows = [
    source('valid', at(0), at(2), 'me'), source('child', at(0), at(12), 'other_parent', { child_id: 'child' }),
    source('owner', at(0), at(12), 'other_parent', { user_id: 'another' }), source('case', at(0), at(12), 'other_parent', { case_id: 'another' }),
    source('deleted', at(0), at(12), 'other_parent', { deleted_at: at(13) }), source('schedule', at(0), at(10), 'me', {}, 'scheduled'),
  ];
  assert.equal(calculateCustodyTime(rows, filter).hours.me, 2);
  assert.equal(calculateCustodyTime(rows, { ...filter, childId: 'child' }).hours.other_parent, 12);
  assert.equal(calculateCustodyTime(rows, { ...filter, basis: 'scheduled' }).hours.me, 10);
});

test('overnight intervals and daylight-saving days use real elapsed hours', () => {
  for (const [fromAt, toAt, expected] of [
    ['2026-03-08T00:00:00-08:00', '2026-03-09T00:00:00-07:00', 23],
    ['2026-11-01T00:00:00-07:00', '2026-11-02T00:00:00-08:00', 25],
  ] as const) {
    const result = calculateCustodyTime([source('dst', fromAt, toAt, 'me')], { ...filter, fromAt, toAt });
    assert.equal(result.hours.me, expected);
    assert.equal(result.totalHours, expected);
  }
});

test('missing/invalid interval data never becomes custody time', () => {
  const result = calculateCustodyTime([source('missing', at(0), at(12), 'me', { metadata: {} }), source('reversed', at(12), at(0), 'me')], filter);
  assert.equal(result.coveredHours, 0); assert.equal(result.yourRecordedShare, null);
  assert.equal(result.invalidIntervalCount, 1); assert.equal(result.unknownHours, 24);
  assert.throws(() => validateCustodyInterval({ version: 1, startAt: '2026-09-01T00:00', endAt: at(12), caregiver: 'me', basis: 'actual' }), /time zone/);
  assert.throws(() => validateCustodyInterval({ version: 1, startAt: at(0), endAt: at(12), caregiver: 'unknown', basis: 'actual' }), /Choose/);
});

test('all source records are considered beyond the old 100-entry display cap', () => {
  const rows = Array.from({ length: 101 }, (_, index) => source(String(index), at(0), at(1), 'me'));
  rows.push(source('last', at(1), at(2), 'other_parent'));
  const result = calculateCustodyTime(rows, filter);
  assert.equal(result.sourceEntries.length, 102);
  assert.equal(result.hours.other_parent, 1);
});
