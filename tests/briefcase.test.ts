import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';
import type { CourtOrder, CourtOrderProvision, Entry, EvidenceAttachment, FamilyBenchCase, KeyDate, LocalRecordMeta } from '../lib/case-intelligence/types';
import { buildBriefcaseModel, evidenceSelectionKey, searchBriefcaseEntries, searchBriefcaseOrders, selectedBriefcaseAttachments, selectedBriefcaseEntries, trustRecordCounts } from '../lib/briefcase/model';
import { checkBriefcaseOriginals } from '../lib/briefcase/checks';
import { verifyEvidenceBytes } from '../lib/evidence/core';

const stamp = '2026-09-05T01:00:00.000Z';
const owner = '11111111-1111-4111-8111-111111111111';
const foreign = '22222222-2222-4222-8222-222222222222';
const secret = 'private-token-never-searchable';
const common = { user_id: owner, created_at: stamp, updated_at: stamp, deleted_at: null };

function caseRow(patch: Partial<FamilyBenchCase> = {}): FamilyBenchCase {
  return { ...common, id: 'case-a', title: 'Case A', case_number: null, court_name: null, department: null, judge_name: null, case_type: null, status: 'active', county: null, state: null, is_active: true, next_hearing_at: null, ...patch };
}
function entry(id = 'record-a', patch: Partial<Entry> = {}): Entry {
  return {
    ...common, id, case_id: 'case-a', child_id: null, entry_type: 'general', event_date: '2026-09-04', event_time: null, event_end_time: null,
    custody_period: null, title: 'Café exchange', body: 'Arrived at the library at 14:30.', child_mood: null, is_flagged: false, flag_severity: null,
    flag_category: null, issue_key: null, location_name: null, location_lat: null, location_lng: null,
    metadata: { captured_body: secret, arbitrary: secret }, voice_transcript: secret, capture_method: 'manual', content_hash: secret,
    is_edited: false, private_notes: secret, court_ready_summary: secret, ...patch,
  };
}
function attachment(id = 'file-a', patch: Partial<EvidenceAttachment> = {}): EvidenceAttachment {
  return {
    id, user_id: owner, case_id: 'case-a', entry_id: 'record-a', file_name: 'receipt.pdf', file_type: 'document', mime_type: 'application/pdf', file_size_bytes: 4,
    storage_bucket: 'private-evidence', storage_path: `${owner}/case-a/record-a/${id}`, thumbnail_path: null, description: secret, is_receipt: false,
    file_hash: 'a'.repeat(64), hash_algorithm: 'sha256', captured_at: stamp, source_device: secret, exif: { note: secret }, created_at: stamp, deleted_at: null, ...patch,
  };
}
function order(id = 'order-a', patch: Partial<CourtOrder> = {}): CourtOrder {
  return { ...common, id, case_id: 'case-a', order_date: '2026-08-01', order_title: 'Parenting schedule', order_type: 'custody', source_attachment_id: 'file-a', provisions: { private: secret }, ...patch };
}
function provision(id = 'provision-a', patch: Partial<CourtOrderProvision> = {}): CourtOrderProvision {
  return { ...common, id, case_id: 'case-a', court_order_id: 'order-a', provision_key: null, category: 'exchange', label: 'Friday exchange', body: 'Exchanges take place at the library.', effective_date: null, end_date: null, ...patch };
}
function hearing(id = 'hearing-a', patch: Partial<KeyDate> = {}): KeyDate {
  return { ...common, id, case_id: 'case-a', date_type: 'hearing', event_date: '2026-09-25', event_time: null, title: 'Review hearing', description: null, is_completed: false, related_filing_package_id: null, related_court_order_id: null, ...patch };
}
function snapshot() {
  return { ...emptyCaseSnapshot(), cases: [caseRow()], entries: [entry()], evidenceAttachments: [attachment()], courtOrders: [order()], courtOrderProvisions: [provision()], keyDates: [hearing()] };
}

test('briefcase scopes every record to an owned, live case and a live parent', () => {
  const data = snapshot();
  data.cases.push(caseRow({ id: 'case-b' }), caseRow({ id: 'foreign-case', user_id: foreign }));
  data.entries.push(entry('other-case', { case_id: 'case-b' }), entry('other-owner', { user_id: foreign }), entry('deleted', { deleted_at: stamp }));
  data.evidenceAttachments.push(attachment('other-case', { case_id: 'case-b', entry_id: 'other-case' }), attachment('other-owner', { user_id: foreign }), attachment('deleted', { deleted_at: stamp }), attachment('orphan', { entry_id: null }), attachment('deleted-parent', { entry_id: 'deleted' }), attachment('foreign-parent', { entry_id: 'other-owner' }));
  data.courtOrders.push(order('other-case', { case_id: 'case-b' }), order('other-owner', { user_id: foreign }), order('deleted', { deleted_at: stamp }));
  data.courtOrderProvisions.push(provision('other-owner', { user_id: foreign }), provision('other-case', { case_id: 'case-b' }), provision('missing-order', { court_order_id: 'missing' }), provision('deleted', { deleted_at: stamp }));
  data.keyDates.push(hearing('other-owner', { user_id: foreign }), hearing('other-case', { case_id: 'case-b' }), hearing('deleted', { deleted_at: stamp }), hearing('deadline', { date_type: 'filing_deadline' }));
  const model = buildBriefcaseModel(data, owner, 'case-a');
  assert.deepEqual(model.entries.map((row) => row.id), ['record-a']);
  assert.deepEqual(model.attachments.map((row) => row.id), ['file-a']);
  assert.deepEqual(model.orders.map((row) => row.id), ['order-a']);
  assert.deepEqual(model.provisions.map((row) => row.id), ['provision-a']);
  assert.deepEqual(model.hearings.map((row) => row.id), ['hearing-a']);
  assert.equal(model.unlinkedAttachmentCount, 3);
  for (const caseId of ['foreign-case', 'missing']) {
    const unavailable = buildBriefcaseModel(data, owner, caseId);
    assert.equal(unavailable.activeCase, null);
    assert.equal(unavailable.entries.length + unavailable.attachments.length + unavailable.orders.length + unavailable.provisions.length + unavailable.hearings.length, 0);
  }
  data.cases[0].deleted_at = stamp;
  assert.equal(buildBriefcaseModel(data, owner, 'case-a').entries.length, 0);
});

test('briefcase search uses factual text, dates, file names and provisions but excludes private fields', () => {
  const data = snapshot();
  data.entries.push(entry('private', { title: 'Hiddenunique', metadata: { review_visibility: 'private' } }));
  const model = buildBriefcaseModel(data, owner, 'case-a');
  for (const query of ['cafe', 'LIBRARY 14:30', '2026-09-04', 'receipt.pdf', '   ']) assert.deepEqual(searchBriefcaseEntries(model, query).map((row) => row.id), ['record-a']);
  for (const query of [secret, 'Hiddenunique', 'library absent-word']) assert.equal(searchBriefcaseEntries(model, query).length, 0);
  assert.deepEqual(searchBriefcaseOrders(model, 'Friday library').map((row) => row.id), ['order-a']);
  assert.equal(searchBriefcaseOrders(model, secret).length, 0);
  assert.equal(model.privateEntryCount, 1);
});

test('order-linked filter includes exact provision links and original source entry only', () => {
  const data = snapshot();
  data.entries.push(entry('linked', { metadata: { linked_court_order_provision_id: 'provision-a' } }), entry('wrong-link', { metadata: { linked_court_order_provision_id: 'unknown' } }), entry('invalid-link', { metadata: { linked_court_order_provision_id: ['provision-a'] } }), entry('private-linked', { metadata: { linked_court_order_provision_id: 'provision-a', review_visibility: 'private' } }));
  const model = buildBriefcaseModel(data, owner, 'case-a');
  assert.deepEqual(searchBriefcaseEntries(model, '', 'order-a', true).map((row) => row.id), ['linked', 'record-a']);
  assert.equal(searchBriefcaseEntries(model, '', 'missing', true).length, 0);
  assert.equal(searchBriefcaseEntries(model, '', null, true).length, 0);
});

test('selected export records remove foreign, private, missing and duplicate IDs', () => {
  const data = snapshot();
  data.entries.push(entry('private', { metadata: { review_visibility: 'private' } }), entry('other-case', { case_id: 'case-b' }));
  data.evidenceAttachments.push(attachment('private-file', { entry_id: 'private' }));
  const model = buildBriefcaseModel(data, owner, 'case-a');
  const requested = ['record-a', 'private', 'other-case', 'missing', 'record-a'];
  assert.deepEqual(selectedBriefcaseEntries(model, requested).map((row) => row.id), ['record-a']);
  assert.deepEqual(selectedBriefcaseAttachments(model, requested).map((row) => row.id), ['file-a']);
  assert.equal(selectedBriefcaseEntries(model, []).length, 0);
});

test('trust counts distinguish recorded hashes from live checks and show the account queue', () => {
  const data = snapshot();
  data.evidenceAttachments.push(attachment('legacy-valid', { hash_algorithm: 'SHA-256' }), attachment('unhashed', { file_hash: null }), attachment('invalid', { file_hash: 'fake' }));
  const model = buildBriefcaseModel(data, owner, 'case-a');
  const meta = (id: string, sync_status: LocalRecordMeta['sync_status']): LocalRecordMeta => ({ table: 'entries', id, sync_status, local_created_at: stamp, local_updated_at: stamp });
  const counts = trustRecordCounts(model, { a: meta('a', 'synced'), b: meta('b', 'local_pending'), c: meta('c', 'error') });
  assert.deepEqual(counts, { pendingRecords: 2, filesWithRecordedHash: 2, originalFiles: 4, entries: 1 });
  assert.equal(trustRecordCounts(buildBriefcaseModel(data, owner, null), { b: meta('b', 'local_pending') }).pendingRecords, 1);
});

test('file-check identity is stable across display order and changes when immutable source changes', () => {
  const a = attachment(), b = attachment('file-b');
  assert.equal(evidenceSelectionKey([a, b]), evidenceSelectionKey([b, a]));
  for (const patch of [{ file_hash: 'b'.repeat(64) }, { storage_path: 'another-path' }, { file_size_bytes: 5 }, { entry_id: 'another-entry' }]) {
    assert.notEqual(evidenceSelectionKey([a]), evidenceSelectionKey([{ ...a, ...patch }]));
  }
});

test('checking originals deduplicates work and reports missing or changed files individually', async () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const hash = async (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
  const verified = attachment('verified', { file_hash: await hash(bytes) });
  const missing = attachment('missing');
  const changed = attachment('changed');
  const calls: string[] = [], progress: number[][] = [];
  const report = await checkBriefcaseOriginals([verified, missing, verified, changed], {
    isCurrent: () => true, now: () => stamp,
    readVerifiedOriginal: async (row) => {
      calls.push(row.id);
      if (row.id === 'missing') throw new Error('Original file unavailable.');
      await verifyEvidenceBytes(bytes, row, hash);
      return bytes;
    }, onProgress: (done, total) => progress.push([done, total]),
  });
  assert.deepEqual(calls, ['verified', 'missing', 'changed']);
  assert.deepEqual(progress, [[1, 3], [2, 3], [3, 3]]);
  assert.equal(report?.checkedAt, stamp);
  assert.deepEqual(report?.results.map((row) => [row.attachmentId, row.status]), [['verified', 'verified'], ['missing', 'failed'], ['changed', 'failed']]);
  assert.match(report!.results[2].message, /integrity check failed/);
});

test('a reader returning empty or wrong-sized bytes cannot produce a verified result', async () => {
  for (const bytes of [new Uint8Array(), new Uint8Array([1])]) {
    const report = await checkBriefcaseOriginals([attachment()], { isCurrent: () => true, readVerifiedOriginal: async () => bytes });
    assert.equal(report?.results[0].status, 'failed');
    assert.match(report!.results[0].message, /size does not match/);
  }
});

test('changing account or selection cancels an old file check without progress or result', async () => {
  let current = false, reads = 0, updates = 0;
  const beforeStart = await checkBriefcaseOriginals([attachment()], { isCurrent: () => current, readVerifiedOriginal: async () => { reads++; return new Uint8Array(4); } });
  assert.equal(beforeStart, null); assert.equal(reads, 0);
  current = true;
  const duringRead = await checkBriefcaseOriginals([attachment(), attachment('next')], {
    isCurrent: () => current,
    readVerifiedOriginal: async () => { reads++; current = false; return new Uint8Array(4); },
    onProgress: () => { updates++; },
  });
  assert.equal(duringRead, null); assert.equal(reads, 1); assert.equal(updates, 0);
});
