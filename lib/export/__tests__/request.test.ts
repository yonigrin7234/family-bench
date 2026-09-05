import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRequestedEntryIds, parseRequestedEntrySelection } from '../request';

test('absent selection opens case flow while an explicit empty selection stays empty', () => {
  assert.deepEqual(parseRequestedEntryIds(undefined), { ids: null, error: null });
  assert.deepEqual(parseRequestedEntryIds('[]'), { ids: [], error: null });
});
test('a broken explicit export link never falls back to all records', () => {
  for (const value of ['', '{bad', 'null', '{}', '[1]', '["../../private"]', '[""]']) {
    const result = parseRequestedEntryIds(value);
    assert.deepEqual(result.ids, []); assert.match(result.error!, /invalid record selection/);
  }
});
test('valid source selections retain order and remove duplicate IDs', () => {
  assert.deepEqual(parseRequestedEntryIds('["source-b","source-a","source-b"]'), { ids: ['source-b', 'source-a'], error: null });
});
test('empty or ambiguous single-record links cannot become a case-wide export', () => {
  assert.deepEqual(parseRequestedEntrySelection('source-1'), { ids: ['source-1'], error: null });
  for (const args of [[''], ['../source'], ['source-1', '["source-2"]']] as Array<[string, string?]>) {
    const result = parseRequestedEntrySelection(...args);
    assert.deepEqual(result.ids, []); assert.match(result.error!, /invalid/);
  }
});
