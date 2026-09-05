import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { strFromU8, unzipSync } from 'fflate';
import { emptyCaseSnapshot } from '../../case-intelligence/ownership';
import type { Entry, EvidenceAttachment, FamilyBenchCase } from '../../case-intelligence/types';
import { createPrivateWorkspaceArchive, MAX_PRIVATE_ARCHIVE_BYTES, type PrivateArchiveWorkspace } from '../privateArchive';

const owner = '11111111-1111-4111-8111-111111111111';
const caseId = '22222222-2222-4222-8222-222222222222';
const entryId = '33333333-3333-4333-8333-333333333333';
const attachmentId = '44444444-4444-4444-8444-444444444444';
const bytes = new Uint8Array([1, 3, 5, 7]);
const sha256 = async (value: Uint8Array) => createHash('sha256').update(value).digest('hex');
const ports = { getAttachmentBytes: async () => bytes, sha256, assertCurrentAccount: () => {} };
function workspace(): PrivateArchiveWorkspace {
  return { ownerId: owner, selectedCaseId: null, caseWorkspaceStates: {}, savedReportVersions: [], conflictHistory: [], reportPreviewState: { reportType: 'timeline', typeFilter: 'all', flagFilter: 'all' }, advisorState: { threadId: 'local', pinnedThreadId: null, messages: [], updatedAt: null }, filingBuilderState: { selectedPackageId: null, packageStates: {}, updatedAt: null }, patternReviewState: { acknowledgedPatternIds: [], dismissedPatternIds: [], updatedAt: null } };
}
async function input() {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: caseId, user_id: owner, title: 'First case', deleted_at: null } as FamilyBenchCase];
  snapshot.entries = [{ id: entryId, user_id: owner, case_id: caseId, child_id: null, entry_type: 'general',
    event_date: '2026-09-05', event_time: null, event_end_time: null, custody_period: null,
    title: 'Private source', body: 'Reviewed record', child_mood: null, is_flagged: false,
    flag_severity: null, flag_category: null, issue_key: null, location_name: null, location_lat: null, location_lng: null,
    metadata: { review_visibility: 'private', captured_body: 'Original text' }, voice_transcript: null,
    capture_method: 'manual', content_hash: null, is_edited: false, private_notes: 'Private note retained', court_ready_summary: null,
    created_at: '2026-09-05T00:00:00Z', updated_at: '2026-09-05T00:00:00Z', deleted_at: null } satisfies Entry];
  snapshot.evidenceAttachments = [{ id: attachmentId, user_id: owner, case_id: caseId, entry_id: entryId,
    file_name: '../../private\\source.txt', storage_bucket: 'evidence-originals',
    storage_path: `${owner}/${caseId}/${entryId}/${attachmentId}/original`,
    file_hash: await sha256(bytes), hash_algorithm: 'sha256', file_size_bytes: bytes.length, deleted_at: null } as EvidenceAttachment];
  return { ownerId: owner, snapshot, workspace: workspace(), generatedAt: '2026-09-05T12:00:00.000Z' };
}

test('private archive retains private records and exact originals with safe paths and a verifiable manifest', async () => {
  const archive = await createPrivateWorkspaceArchive(await input(), ports);
  const files = unzipSync(archive.bytes);
  const record = JSON.parse(strFromU8(files['private-workspace.json']));
  assert.equal(record.snapshot.entries[0].private_notes, 'Private note retained');
  assert.equal(record.snapshot.entries[0].metadata.captured_body, 'Original text');
  const manifest = JSON.parse(strFromU8(files['originals-manifest.json']));
  assert.equal(manifest.files[0].name, '../../private\\source.txt');
  assert.deepEqual(files[`originals/${attachmentId}/original`], bytes);
  assert.equal(manifest.files[0].sha256, await sha256(bytes));
  assert.ok(Object.keys(files).every((path) => !path.includes('..') && !path.includes('\\')));
  assert.match(archive.name, /PRIVATE/);
  assert.match(strFromU8(files['README.txt']), /not encrypted/);
});

test('private archive rejects another owner and broken attachment links before reading bytes', async () => {
  const value = await input(); let reads = 0;
  value.snapshot.entries[0].user_id = caseId;
  await assert.rejects(createPrivateWorkspaceArchive(value, { ...ports, getAttachmentBytes: async () => { reads++; return bytes; } }), /different account/);
  assert.equal(reads, 0);
  value.snapshot.entries[0].user_id = owner;
  value.snapshot.entries[0].case_id = attachmentId;
  await assert.rejects(createPrivateWorkspaceArchive(value, ports), /invalid record link/);
});

test('missing or changed original bytes prevent any private archive output', async () => {
  await assert.rejects(createPrivateWorkspaceArchive(await input(), { ...ports, getAttachmentBytes: async () => { throw new Error('Secret provider details'); } }), /No partial archive/);
  await assert.rejects(createPrivateWorkspaceArchive(await input(), { ...ports, getAttachmentBytes: async () => new Uint8Array([2, 4, 6, 8]) }), /No partial archive/);
});

test('account/context change during file retrieval stops the archive before download', async () => {
  let current = true;
  await assert.rejects(createPrivateWorkspaceArchive(await input(), {
    ...ports, getAttachmentBytes: async () => { current = false; return bytes; },
    assertCurrentAccount: () => { if (!current) throw new Error('Account changed'); },
  }), /Account changed/);
});

test('oversized archive stops before any file download instead of returning partial data', async () => {
  const value = await input(); let reads = 0;
  value.snapshot.evidenceAttachments[0].file_size_bytes = MAX_PRIVATE_ARCHIVE_BYTES + 1;
  await assert.rejects(createPrivateWorkspaceArchive(value, { ...ports, getAttachmentBytes: async () => { reads++; return bytes; } }), /128 MiB/);
  assert.equal(reads, 0);
});

test('an empty workspace still produces a complete readable private record archive', async () => {
  const archive = await createPrivateWorkspaceArchive({ ownerId: owner, snapshot: emptyCaseSnapshot(), workspace: workspace() }, ports);
  const files = unzipSync(archive.bytes);
  assert.equal(JSON.parse(strFromU8(files['originals-manifest.json'])).files.length, 0);
  assert.deepEqual(JSON.parse(strFromU8(files['private-workspace.json'])).snapshot.entries, []);
});

test('two-case private archive retains saved context and conflict copies but excludes unrelated credential fields', async () => {
  const value = await input();
  const secondCase = '55555555-5555-4555-8555-555555555555';
  const secondEntry = '66666666-6666-4666-8666-666666666666';
  value.snapshot.cases.push({ ...value.snapshot.cases[0], id: secondCase, title: 'Second case' });
  value.snapshot.entries.push({ ...value.snapshot.entries[0], id: secondEntry, case_id: secondCase });
  value.snapshot.selectedCaseId = caseId;
  value.workspace.selectedCaseId = caseId;
  const first = workspace();
  first.advisorState.messages = [{ id: 'message-one', role: 'user', body: 'First case private conversation', createdAt: value.generatedAt, linkedEntryIds: [entryId], localOnly: true }];
  const second = workspace();
  second.advisorState.messages = [{ id: 'message-two', role: 'user', body: 'Second case private conversation', createdAt: value.generatedAt, linkedEntryIds: [secondEntry], localOnly: true }];
  value.workspace.advisorState = first.advisorState;
  value.workspace.caseWorkspaceStates = { [caseId]: first, [secondCase]: second };
  value.workspace.savedReportVersions = [{ id: 'saved-second-report', caseId: secondCase, reportType: 'timeline', title: 'Second selection', createdAt: value.generatedAt, updatedAt: value.generatedAt, includedEntryIds: [secondEntry], linkedFilingPackageIds: [], filters: { typeFilter: 'all', flagFilter: 'all', childFilter: null, dateRangeLabel: 'All dates' } }];
  value.workspace.conflictHistory = [{ key: `entries:${entryId}`, table: 'entries', version: 2, resolutionId: 'resolution-one', resolvedAt: value.generatedAt, choice: 'cloud', local: { ...value.snapshot.entries[0], body: 'Device copy' }, remote: { ...value.snapshot.entries[0], body: 'Cloud copy' } }];
  Object.assign(value.workspace, { session: { access_token: 'SECRET_ACCESS_TOKEN' }, encryptionKey: 'SECRET_DEVICE_KEY' });
  Object.assign(value.workspace.advisorState, { refresh_token: 'SECRET_REFRESH_TOKEN' });
  Object.assign(value.workspace.advisorState.messages[0], { auth: 'SECRET_NESTED_SESSION' });
  Object.assign(value.snapshot, { session: 'SECRET_SNAPSHOT_SESSION' });
  const files = unzipSync((await createPrivateWorkspaceArchive(value, ports)).bytes);
  const json = strFromU8(files['private-workspace.json']);
  const record = JSON.parse(json);
  assert.equal(record.workspace.caseWorkspaceStates[caseId].advisorState.messages[0].body, 'First case private conversation');
  assert.equal(record.workspace.caseWorkspaceStates[secondCase].advisorState.messages[0].body, 'Second case private conversation');
  assert.deepEqual(record.workspace.savedReportVersions[0].includedEntryIds, [secondEntry]);
  assert.equal(record.workspace.conflictHistory[0].local.body, 'Device copy');
  assert.equal(record.workspace.conflictHistory[0].remote.body, 'Cloud copy');
  assert.equal(json.includes('SECRET_'), false);
});

test('foreign account contexts, unknown cases and cross-case references stop archive before reading originals', async () => {
  const value = await input(); let reads = 0;
  const noReads = { ...ports, getAttachmentBytes: async () => { reads++; return bytes; } };
  value.workspace.ownerId = caseId;
  await assert.rejects(createPrivateWorkspaceArchive(value, noReads), /different account/);
  value.workspace.ownerId = owner;
  value.workspace.caseWorkspaceStates = { [entryId]: workspace() };
  await assert.rejects(createPrivateWorkspaceArchive(value, noReads), /case outside/);
  value.workspace.caseWorkspaceStates = {};
  value.workspace.conflictHistory = [{ key: `entries:${entryId}`, table: 'entries', version: 2, resolutionId: 'r', resolvedAt: value.generatedAt, choice: 'cloud', local: { ...value.snapshot.entries[0], user_id: caseId }, remote: null }];
  await assert.rejects(createPrivateWorkspaceArchive(value, noReads), /another account/);
  value.workspace.conflictHistory = [];
  const otherCase = '55555555-5555-4555-8555-555555555555';
  value.snapshot.cases.push({ ...value.snapshot.cases[0], id: otherCase });
  const other = workspace();
  other.advisorState.messages = [{ id: 'm', role: 'user', body: 'Wrong case link', createdAt: value.generatedAt, linkedEntryIds: [entryId], localOnly: true }];
  value.workspace.caseWorkspaceStates = { [otherCase]: other };
  await assert.rejects(createPrivateWorkspaceArchive(value, noReads), /cross-case/);
  assert.equal(reads, 0);
});

test('archive captures working context before asynchronous source reads and guards context-only changes', async () => {
  const value = await input();
  value.workspace.advisorState.messages = [{ id: 'm', role: 'user', body: 'Before export', createdAt: value.generatedAt, linkedEntryIds: [], localOnly: true }];
  const artifact = await createPrivateWorkspaceArchive(value, { ...ports, getAttachmentBytes: async () => { value.workspace.advisorState.messages[0].body = 'Later edit'; return bytes; } });
  const json = JSON.parse(strFromU8(unzipSync(artifact.bytes)['private-workspace.json']));
  assert.equal(json.workspace.advisorState.messages[0].body, 'Before export');
  let unchanged = true;
  await assert.rejects(createPrivateWorkspaceArchive(value, { ...ports, getAttachmentBytes: async () => { unchanged = false; return bytes; }, assertCurrentAccount: () => { if (!unchanged) throw new Error('Working context changed'); } }), /Working context changed/);
});

test('workspace conflict copies preserve allowlisted historical settings without nesting old histories or credentials', async () => {
  const value = await input();
  const historic = workspace();
  historic.reportPreviewState.reportType = 'medical';
  Object.assign(historic, { session: 'SECRET_HISTORIC_SESSION' });
  const state = { ...historic } as Partial<PrivateArchiveWorkspace> & { session?: string };
  delete state.ownerId;
  delete state.conflictHistory;
  value.workspace.conflictHistory = [{ key: `case_workspace_state:${owner}`, table: 'case_workspace_state', version: 3, resolutionId: 'workspace-resolution', resolvedAt: value.generatedAt, choice: 'device', local: { id: owner, user_id: owner, state }, remote: null }];
  const files = unzipSync((await createPrivateWorkspaceArchive(value, ports)).bytes);
  const text = strFromU8(files['private-workspace.json']);
  const history = JSON.parse(text).workspace.conflictHistory;
  assert.equal(history[0].local.state.reportPreviewState.reportType, 'medical');
  assert.deepEqual(history[0].local.state.conflictHistory, []);
  assert.equal(text.includes('SECRET_HISTORIC_SESSION'), false);
});

test('private archive includes incomplete official-form drafts and exact quarantined context for recovery', async () => {
  const value = await input();
  value.workspace.courtFormDrafts = [{ id: '77777777-7777-4777-8777-777777777777', userId: owner, caseId, formId: 'mc031', values: { declaration: 'Unfinished private declaration' }, sourceEntryIds: [entryId], createdAt: value.generatedAt, updatedAt: value.generatedAt }];
  value.workspace.contextRecovery = [{ id: 'recovery-copy', ownerId: owner, source: 'cloud', observedAt: value.generatedAt, resolvedAt: null, issues: [{ path: 'workspace.futureField', code: 'unsupported' }], raw: { futureField: { originalText: 'Unknown imported content retained exactly' } } }];
  const archive = unzipSync((await createPrivateWorkspaceArchive(value, ports)).bytes);
  const restored = JSON.parse(strFromU8(archive['private-workspace.json']));
  assert.equal(restored.workspace.courtFormDrafts[0].values.declaration, 'Unfinished private declaration');
  assert.deepEqual(restored.workspace.contextRecovery[0].raw, value.workspace.contextRecovery[0].raw);
  assert.match(strFromU8(archive['README.txt']), /unrecognized fields/);
  value.workspace.contextRecovery[0].ownerId = caseId;
  await assert.rejects(createPrivateWorkspaceArchive(value, ports), /another account/);
});
