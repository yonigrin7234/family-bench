import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanRemoteRow, mergeSyncReceipts, findSyncConflicts, prepareSyncChanges } from '../lib/case-intelligence/syncModel';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';
import type { LocalRecordMeta } from '../lib/case-intelligence/types';
const owner = '11111111-1111-4111-8111-111111111111';
const meta: LocalRecordMeta = { table: 'entries', id: 'entry', local_created_at: '2026-09-04', local_updated_at: '2026-09-04', sync_status: 'pending', mutation_id: 'later', server_version: 0 };
test('an edit during upload stays queued with the acknowledged server version', () => {
  const next = mergeSyncReceipts({ 'entries:entry': meta }, [{ table_name: 'entries', record_id: 'entry', mutation_id: 'earlier', version: 1 }]);
  assert.equal(next['entries:entry'].sync_status, 'pending');
  assert.equal(next['entries:entry'].server_version, 1);
  assert.equal(next['entries:entry'].mutation_id, 'later');
});
test('matching receipts clear only the acknowledged mutation', () => {
  assert.equal(mergeSyncReceipts({ 'entries:entry': meta }, [{ table_name: 'entries', record_id: 'entry', mutation_id: 'later', version: 1 }])['entries:entry'].sync_status, 'synced');
});
test('stale versions require review, while an ambiguous successful commit is replayable', () => {
  const change = { table_name: 'entries', row: { id: 'entry', user_id: owner, body: 'local' }, expected_version: 0, mutation_id: 'later' };
  assert.equal(findSyncConflicts([change], {}, [{ table_name: 'entries', record_id: 'entry', version: 1, mutation_id: 'other' }]).length, 1);
  assert.equal(findSyncConflicts([change], {}, [{ table_name: 'entries', record_id: 'entry', version: 1, mutation_id: 'later' }]).length, 0);
});
test('local filesystem and sync bookkeeping never leave the device', () => {
  const row = cleanRemoteRow('attachments', { id: 'attachment', user_id: owner, exif: { local_uri: 'file:///secret', local_evidence_key: 'secret', sync_status: 'pending', hash_status: 'verified' } });
  assert.deepEqual(row.exif, { hash_status: 'verified' });
});
test('server-only provenance and unknown columns never become writable through a read and edit cycle', () => {
  const row = cleanRemoteRow('entries', { id: 'entry', user_id: owner, body: 'Edited fact', original_content_hash: 'server proof', capture_timestamp: 'server time', future_secret_column: 'do not write' });
  assert.deepEqual(row, { id: 'entry', user_id: owner, body: 'Edited fact' });
  assert.throws(() => cleanRemoteRow('unknown', row), /Unknown sync table/);
});
test('sync orders parents first and refuses another account’s changes', () => {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: 'case', user_id: owner }] as typeof snapshot.cases;
  snapshot.entries = [{ id: 'entry', user_id: owner }] as typeof snapshot.entries;
  const records = { 'cases:case': { ...meta, id: 'case', table: 'cases' }, 'entries:entry': meta };
  assert.deepEqual(prepareSyncChanges(snapshot, records, owner).map((c) => c.table_name), ['cases', 'entries']);
  assert.throws(() => prepareSyncChanges(snapshot, records, 'another-owner'), /does not belong/);
});
