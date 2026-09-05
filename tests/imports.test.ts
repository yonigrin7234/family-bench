import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { CSV_TEMPLATE, CsvValidationError, decodeCsvUtf8, parseCsvImport } from '../lib/imports/csv';
import { MAX_CSV_BYTES, validateImportProvenance } from '../lib/imports/model';
import { CSV_TYPED_EXAMPLES } from '../lib/imports/guide';
import { buildCsvImportPlan, findImportedDuplicate, importedEntryInput, provenanceFor, sourceEntryInput, type CsvImportPlan, type ImportScope } from '../lib/imports/plan';
import { CsvImportStopped, runCsvImport, type CsvImportPorts, type CsvImportProgress } from '../lib/imports/run';
import type { CaptureEntryInput } from '../lib/case-intelligence/useCaseIntelligence';
import type { Entry, EvidenceAttachment } from '../lib/case-intelligence/types';
import type { Json } from '../lib/supabase/database.types';

const ownerId = '11111111-1111-4111-8111-111111111111', caseId = '22222222-2222-4222-8222-222222222222', childId = '33333333-3333-4333-8333-333333333333';
const foreign = '99999999-9999-4999-8999-999999999999';
const scope: ImportScope = { ownerId, caseId, childId: null };
const stamp = '2026-09-05T01:00:00.000Z';
const encode = (text: string) => new TextEncoder().encode(text);
const hash = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const csv = (rows: string[]) => encode(`entry_type,event_date,body\r\n${rows.join('\r\n')}\r\n`);
const quoted = (value: string) => `"${value.replaceAll('"', '""')}"`;
const typedCsv = (kind: string, details: unknown) => encode(`entry_type,event_date,body,typed_details\njournal,2026-09-01,First,\n${kind},2026-09-02,Recorded facts,${quoted(typeof details === 'string' ? details : JSON.stringify(details))}`);
async function planFor(bytes = csv(['journal,2026-09-01,First', 'journal,2026-09-02,Second']), destination = scope) { return buildCsvImportPlan(destination, bytes, parseCsvImport(bytes), hash); }

test('CSV supports a UTF-8 BOM, unicode, quoted commas, doubled quotes, multiline bodies, CRLF and trailing empty fields', () => {
  const rows = parseCsvImport(encode('\uFEFFentry_type,event_date,body,event_time,title,private_notes,is_flagged,typed_details\r\njournal,2024-02-29,"  Café, \"\"exact words\"\"\r\n第二行 🙂  ",09:05, ," Private\nnote ",true,\r\n'));
  assert.equal(rows.length, 1); assert.equal(rows[0].rowIndex, 1);
  assert.equal(rows[0].body, 'Café, "exact words"\r\n第二行 🙂'); assert.equal(rows[0].privateNotes, 'Private\nnote');
  assert.equal(rows[0].eventTime, '09:05:00'); assert.equal(rows[0].isFlagged, true); assert.equal(rows[0].title.length > 0, true);
  assert.equal(parseCsvImport(encode(CSV_TEMPLATE)).length, 1);
  assert.equal(parseCsvImport(encode('body,event_date,entry_type\nFacts,2026-09-01,journal'))[0].body, 'Facts');
});

test('malformed UTF-8, nulls and oversize input reject without replacement decoding', () => {
  for (const bytes of [[], [0], [0xc0, 0x80], [0xe0, 0x80, 0x80], [0xed, 0xa0, 0x80], [0xf4, 0x90, 0x80, 0x80], [0xe2, 0x82], [0x80], [0xc2, 0x41]]) assert.throws(() => decodeCsvUtf8(new Uint8Array(bytes)));
  assert.throws(() => decodeCsvUtf8(new Uint8Array(MAX_CSV_BYTES + 1)), /4 MiB/);
  assert.equal(decodeCsvUtf8(new Uint8Array(MAX_CSV_BYTES).fill(65)).length, MAX_CSV_BYTES);
});

test('invalid quoting, unknown/duplicate/missing headers and blank records are not silently accepted', () => {
  for (const text of [
    'entry_type,event_date,body,body\njournal,2026-09-01,A,B',
    'entry_type,event_date,body,provider\njournal,2026-09-01,A,Unknown',
    'entry_type,event_date\njournal,2026-09-01',
    'Entry_type,event_date,body\njournal,2026-09-01,A',
    'entry_type,event_date,body\njournal,2026-09-01,a"b',
    'entry_type,event_date,body\njournal,2026-09-01,"A" suffix',
    'entry_type,event_date,body\njournal,2026-09-01,"unclosed',
    'entry_type,event_date,body\rjournal,2026-09-01,A',
    'entry_type,event_date,body\njournal,2026-09-01,A\n\n',
    'entry_type,event_date,body\njournal,2026-09-01,A,extra',
  ]) assert.throws(() => parseCsvImport(encode(text)), Error, text);
});

test('all invalid rows are reported by data-row index; no valid subset is returned', () => {
  assert.throws(() => parseCsvImport(encode('entry_type,event_date,body,event_time,is_flagged\njournal,2026-02-29,A,,\nunknown,2026-09-01,B,,\njournal,2026-09-01,C,24:00,\njournal,2026-09-01,D,,yes\njournal,2026-09-01, ,,')), (error) => {
    assert.ok(error instanceof CsvValidationError); assert.deepEqual(error.issues.map((issue) => issue.rowIndex), [1, 2, 3, 4, 5]); return true;
  });
});

test('the 500-record limit counts data records, not newlines inside quoted fields', () => {
  const data = Array.from({ length: 500 }, (_, i) => `journal,2026-09-01,"row ${i}\nmore"`);
  assert.equal(parseCsvImport(csv(data)).length, 500);
  assert.throws(() => parseCsvImport(csv([...data, 'journal,2026-09-01,extra'])), /more than 500/);
});

test('typed details reject unknown, duplicate and escaped duplicate keys, mismatches and invalid field values', () => {
  for (const details of [
    { version: 1, kind: 'journal', hidden: 'ignored?' }, { version: 1, kind: 'expense' },
    '{"version":1,"kind":"journal","kind":"journal"}', '{"version":1,"kind":"journal","k\\u0069nd":"journal"}',
    '{"version":1,"kind":"journal","__proto__":{}}', 'null', '[1]', '{broken}',
  ]) assert.throws(() => parseCsvImport(typedCsv('journal', details)));
  const good = parseCsvImport(typedCsv('child_statement', { version: 1, kind: 'child_statement', quote: 'She said "kind": "quiet"', context: 'At home' }));
  assert.equal(good[1].typedDetails?.kind, 'child_statement');
});

test('unknown reimbursements stay null, explicit zero stays zero, invalid cents and external entry links reject', () => {
  const expense = { version: 1, kind: 'expense', amountCents: 1200, currency: 'USD', category: 'school', paidBy: 'me' };
  const first = parseCsvImport(typedCsv('expense', expense))[1].typedDetails;
  assert.ok(first?.kind === 'expense'); assert.equal(first.reimbursementRequestedCents, null); assert.equal(first.reimbursementReceivedCents, null);
  const known = parseCsvImport(typedCsv('expense', { ...expense, reimbursementRequestedCents: 0, reimbursementReceivedCents: 0 }))[1].typedDetails;
  assert.ok(known?.kind === 'expense'); assert.equal(known.reimbursementRequestedCents, 0); assert.equal(known.reimbursementReceivedCents, 0);
  for (const patch of [{ amountCents: 1.5 }, { amountCents: 0 }, { reimbursementRequestedCents: 1201 }, { reimbursementReceivedCents: '0' }]) assert.throws(() => parseCsvImport(typedCsv('expense', { ...expense, ...patch })));
  const message = { version: 1, kind: 'message', platform: 'email', direction: 'sent', correspondent: 'Other parent', occurredAt: '2026-09-01T15:00:00Z', replyToEntryId: foreign, tone: 'not_assessed' };
  assert.throws(() => parseCsvImport(typedCsv('message', message)), /cannot link/);
  assert.equal(parseCsvImport(typedCsv('message', { ...message, replyToEntryId: null }))[1].typedDetails?.kind, 'message');
  assert.throws(() => parseCsvImport(typedCsv('message', { ...message, replyToEntryId: null, occurredAt: '2026-09-01T15:00:00' })), /time zone/);
});

test('every downloadable structured example is accepted by the current strict CSV schema', () => {
  for (const example of CSV_TYPED_EXAMPLES) assert.equal(parseCsvImport(typedCsv(example.kind, example))[1].typedDetails?.kind, example.kind);
});

test('import identities are stable for the original, account, case, child and row; source records use a deterministic date', async () => {
  const plan = await planFor(), same = await planFor(); assert.deepEqual(plan, same);
  for (const destination of [{ ...scope, ownerId: foreign }, { ...scope, caseId: foreign }, { ...scope, childId }]) {
    const other = await planFor(undefined, destination); assert.notEqual(other.sourceEntryId, plan.sourceEntryId); assert.notEqual(other.rows[0].id, plan.rows[0].id);
  }
  const changed = await planFor(encode('entry_type,event_date,body\njournal,2026-09-01,First\njournal,2026-09-02,Second\n'));
  assert.notEqual(changed.fileHash, plan.fileHash); assert.notEqual(changed.sourceEntryId, plan.sourceEntryId); assert.equal(changed.rows[0].rowHash, plan.rows[0].rowHash);
  assert.equal(sourceEntryInput(plan).eventDate, '2026-09-01'); assert.equal(sourceEntryInput(plan).reviewVisibility, 'private');
  assert.equal(importedEntryInput(plan, plan.rows[0]).reviewVisibility, 'private');
  await assert.rejects(() => buildCsvImportPlan(scope, encode('x'), [], hash), /1–500/);
  await assert.rejects(() => buildCsvImportPlan({ ...scope, ownerId: 'local' }, encode(CSV_TEMPLATE), parseCsvImport(encode(CSV_TEMPLATE)), hash), /valid account/);
  await assert.rejects(() => planFor(undefined, { ...scope, childId: 'unknown' }), /valid account/);
});

test('source/row provenance validates exact structure and valid one-based row indexes', async () => {
  const plan = await planFor(); assert.deepEqual(validateImportProvenance(provenanceFor(plan)), provenanceFor(plan));
  assert.equal(validateImportProvenance(provenanceFor(plan, plan.rows[0])).rowIndex, 1);
  for (const patch of [{ version: 2 }, { extra: true }, { fileHash: 'fake' }, { sourceAttachmentId: 'bad' }, { rowIndex: 0 }, { rowIndex: 501 }, { rowHash: null }]) assert.throws(() => validateImportProvenance({ ...provenanceFor(plan, plan.rows[0]), ...patch }));
  assert.throws(() => validateImportProvenance({ ...provenanceFor(plan), rowIndex: 1 }));
});

function entryFrom(input: CaptureEntryInput, destination = scope): Entry {
  return { id: input.id!, user_id: destination.ownerId, case_id: destination.caseId, child_id: destination.childId, created_at: stamp, updated_at: stamp, deleted_at: null,
    entry_type: 'general', event_date: input.eventDate, event_time: input.eventTime ?? null, event_end_time: null, custody_period: null, title: input.title ?? null, body: input.body ?? null,
    child_mood: null, is_flagged: input.isFlagged, flag_severity: null, flag_category: null, issue_key: null, location_name: null, location_lat: null, location_lng: null,
    metadata: { review_visibility: input.reviewVisibility ?? 'private', import_provenance: input.importProvenance as unknown as Json }, voice_transcript: null,
    capture_method: 'manual', content_hash: 'original', is_edited: false, private_notes: input.privateNotes ?? null, court_ready_summary: null };
}
function setup(plan: CsvImportPlan, bytes: Uint8Array) {
  const state = { entries: [] as Entry[], attachments: [] as EvidenceAttachment[], durable: [] as Entry[], calls: [] as string[], current: true, failEntryId: '', failAttachment: false, failFlush: false, missing: false, original: bytes, after: (_name: string) => {} };
  const finish = (name: string) => { state.calls.push(name); state.after(name); };
  const ports: CsvImportPorts = {
    assertCurrent: () => { if (!state.current) throw new Error('Account or case changed.'); }, entries: () => state.entries, attachments: () => state.attachments,
    hash: async (value) => { const digest = await hash(value); finish('hash'); return digest; }, source: { entryId: '', filename: 'synthetic.csv', kind: 'document', localUri: 'fixture-only' },
    saveEntry: async (input) => {
      const entry = entryFrom(input, plan.scope); assert.equal(state.entries.some((row) => row.id === entry.id), false, 'runner must not recreate an existing entry');
      state.entries = [...state.entries, entry]; finish(`entry:${input.id}`);
      if (state.failEntryId === input.id) { state.failEntryId = ''; throw new Error('Encrypted snapshot save failed.'); }
      state.durable = [...state.entries]; return { entry };
    },
    saveAttachment: async (input) => {
      assert.ok(state.durable.some((entry) => entry.id === plan.sourceEntryId), 'source must be durable before preserving bytes');
      const attachment: EvidenceAttachment = { id: input.attachmentId!, user_id: plan.scope.ownerId, case_id: plan.scope.caseId, entry_id: input.entryId,
        file_name: input.filename, file_type: 'document', mime_type: 'text/csv', file_size_bytes: bytes.length, storage_bucket: 'evidence-originals', storage_path: 'fixture-only',
        thumbnail_path: null, description: null, is_receipt: false, file_hash: plan.fileHash, hash_algorithm: 'sha256', captured_at: null, source_device: null, exif: null, created_at: stamp, deleted_at: null };
      state.attachments = [...state.attachments, attachment]; finish('attachment');
      if (state.failAttachment) { state.failAttachment = false; throw new Error('Attachment metadata save failed.'); }
      return { attachment };
    },
    flush: async () => { finish('flush'); if (state.failFlush) throw new Error('Retry save failed.'); state.durable = [...state.entries]; },
    readOriginal: async () => { finish('read'); if (state.missing) throw new Error('Original unavailable.'); return state.original; },
  };
  return { state, ports };
}

test('complete import preserves and verifies the private source before rows and skips exact repetitions', async () => {
  const bytes = csv(['journal,2026-09-01,First', 'journal,2026-09-01,First', 'journal,2026-09-02,Second']); const plan = await planFor(bytes), { state, ports } = setup(plan, bytes);
  const updates: CsvImportProgress[] = []; ports.onProgress = (p) => updates.push(p);
  const result = await runCsvImport(plan, ports);
  assert.deepEqual(state.calls, [`entry:${plan.sourceEntryId}`, 'attachment', 'read', 'hash', `entry:${plan.rows[0].id}`, `entry:${plan.rows[2].id}`]);
  assert.equal(result.phase, 'complete'); assert.equal(result.created, 2); assert.equal(result.repeated, 1); assert.equal(result.processed, 3);
  assert.equal(state.entries.length, 3); assert.ok(state.entries.every((entry) => (entry.metadata as Record<string, unknown>).review_visibility === 'private'));
  assert.equal(updates[0].sourceEntrySaved, true); assert.equal(updates[0].sourceOriginalSaved, false);
  assert.equal(updates[1].sourceOriginalSaved, true); assert.equal(updates[1].processed, 0);
});

test('durable source and attachment failures expose partial state and retry without creating duplicates', async () => {
  for (const failAt of ['source', 'attachment']) {
    const bytes = csv(['journal,2026-09-01,First']), plan = await planFor(bytes), { state, ports } = setup(plan, bytes);
    if (failAt === 'source') state.failEntryId = plan.sourceEntryId; else state.failAttachment = true;
    await assert.rejects(() => runCsvImport(plan, ports), (error) => { assert.ok(error instanceof CsvImportStopped); assert.equal(error.progress.processed, 0); assert.equal(error.progress.sourceEntrySaved, failAt !== 'source'); return true; });
    assert.equal(state.entries.length, 1);
    const result = await runCsvImport(plan, ports); assert.equal(result.created, 1); assert.equal(state.entries.length, 2); assert.equal(state.attachments.length, 1);
    assert.equal(state.calls.filter((name) => name === `entry:${plan.sourceEntryId}`).length, 1);
  }
});

test('a failed row remains pending, retry flushes it durably and preserves later review edits', async () => {
  const bytes = csv(['journal,2026-09-01,First', 'journal,2026-09-02,Second', 'journal,2026-09-03,Third']), plan = await planFor(bytes), { state, ports } = setup(plan, bytes);
  state.failEntryId = plan.rows[1].id;
  await assert.rejects(() => runCsvImport(plan, ports), (error) => { assert.ok(error instanceof CsvImportStopped); assert.equal(error.progress.created, 1); assert.equal(error.progress.processed, 1); return true; });
  assert.equal(state.entries.length, 3); assert.equal(state.durable.length, 2);
  state.entries = state.entries.map((entry) => entry.id === plan.rows[0].id ? { ...entry, body: 'Later factual correction', metadata: { ...entry.metadata as object, review_visibility: 'court_ready' } } : entry);
  const result = await runCsvImport(plan, ports);
  assert.equal(result.existing, 2); assert.equal(result.created, 1); assert.equal(state.entries.length, 4); assert.equal(state.durable.length, 4);
  assert.equal(state.entries.find((entry) => entry.id === plan.rows[0].id)?.body, 'Later factual correction');
  assert.equal(state.calls.filter((name) => name === `entry:${plan.rows[1].id}`).length, 1);
  assert.equal((await runCsvImport(plan, ports)).created, 0);
});

test('a failed retry flush never reports an optimistic duplicate as completed', async () => {
  const bytes = csv(['journal,2026-09-01,First']), plan = await planFor(bytes), { state, ports } = setup(plan, bytes);
  state.failEntryId = plan.rows[0].id; await assert.rejects(() => runCsvImport(plan, ports)); state.failFlush = true;
  await assert.rejects(() => runCsvImport(plan, ports), (error) => { assert.ok(error instanceof CsvImportStopped); assert.equal(error.progress.processed, 0); assert.equal(error.progress.existing, 0); return true; });
});

test('missing or altered original bytes stop before imported rows even when metadata matches', async () => {
  for (const mode of ['missing', 'changed', 'wrong-size']) {
    const bytes = csv(['journal,2026-09-01,First']), plan = await planFor(bytes), { state, ports } = setup(plan, bytes);
    if (mode === 'missing') state.missing = true;
    if (mode === 'changed') state.original = new Uint8Array(bytes.length).fill(65);
    if (mode === 'wrong-size') state.original = new Uint8Array(1);
    await assert.rejects(() => runCsvImport(plan, ports), (error) => { assert.ok(error instanceof CsvImportStopped); assert.equal(error.progress.sourceOriginalSaved, false); assert.equal(error.progress.processed, 0); return true; });
    assert.equal(state.entries.length, 1);
  }
});

test('account/case/session cancellation is checked after each awaited source, hash, and row action', async () => {
  const bytes = csv(['journal,2026-09-01,First', 'journal,2026-09-02,Second']), plan = await planFor(bytes);
  for (const boundary of [`entry:${plan.sourceEntryId}`, 'attachment', 'read', 'hash', `entry:${plan.rows[0].id}`]) {
    const { state, ports } = setup(plan, bytes); state.after = (name) => { if (name === boundary) state.current = false; };
    let notifiedAfterCancel = false; ports.onProgress = () => { if (!state.current) notifiedAfterCancel = true; };
    await assert.rejects(() => runCsvImport(plan, ports), /Account or case changed/);
    assert.equal(state.calls.at(-1), boundary); assert.equal(notifiedAfterCancel, false);
  }
  const { state, ports } = setup(plan, bytes); state.current = false; await assert.rejects(() => runCsvImport(plan, ports)); assert.deepEqual(state.calls, []);
});

test('dedupe is scoped to owner, case and child and preserves edited records; identity collisions fail closed before writes', async () => {
  const plan = await planFor(), row = plan.rows[0], original = entryFrom(importedEntryInput(plan, row));
  assert.equal(findImportedDuplicate([original], plan, row), original);
  for (const patch of [{ user_id: foreign }, { case_id: foreign }, { child_id: childId }, { deleted_at: stamp }, { metadata: {} }, { metadata: { import_provenance: { ...provenanceFor(plan, row), sourceAttachmentId: foreign } } }]) {
    const wrong = { ...original, ...patch };
    assert.throws(() => findImportedDuplicate([wrong], plan, row), /does not match/);
    const { state, ports } = setup(plan, csv(['journal,2026-09-01,First', 'journal,2026-09-02,Second'])); state.entries = [wrong];
    await assert.rejects(() => runCsvImport(plan, ports), /does not match/); assert.equal(state.calls.length, 0);
  }
  const anotherFile = await planFor(encode('entry_type,event_date,body\njournal,2026-09-01,First\n'));
  assert.equal(findImportedDuplicate([original], anotherFile, anotherFile.rows[0]), original);
  for (const patch of [{ user_id: foreign }, { case_id: foreign }, { child_id: childId }, { deleted_at: stamp }, { metadata: {} }]) assert.equal(findImportedDuplicate([{ ...original, ...patch }], anotherFile, anotherFile.rows[0]), undefined);
});
