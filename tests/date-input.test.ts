import test from 'node:test';
import assert from 'node:assert/strict';
import { isCalendarDate, normalizeOptionalDate, normalizeOptionalTime } from '../lib/utils/dateInput';

test('calendar input accepts leap days and rejects rollover dates without inventing a replacement', () => {
  assert.equal(isCalendarDate('2024-02-29'), true);
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01', '2026-9-4']) assert.equal(isCalendarDate(value), false);
  assert.equal(normalizeOptionalDate(''), null);
  assert.throws(() => normalizeOptionalDate('2026-02-30'), /real calendar date/);
});
test('unknown event time remains unknown and invalid clock values fail', () => {
  assert.equal(normalizeOptionalTime(''), null);
  assert.equal(normalizeOptionalTime('23:59'), '23:59:00');
  for (const value of ['24:00', '12:60', '09:00:99']) assert.throws(() => normalizeOptionalTime(value), /valid time/);
});
