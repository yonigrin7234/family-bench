import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectWorkspaceContext, safeContextInput } from '../lib/case-intelligence/contextIntegrity';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';
import type { CaseIntelligenceSnapshot, CaseWorkspaceContext } from '../lib/case-intelligence/types';
const owner = '11111111-1111-4111-8111-111111111111';
const first = '22222222-2222-4222-8222-222222222222';
const second = '33333333-3333-4333-8333-333333333333';
const a = '44444444-4444-4444-8444-444444444444';
const b = '55555555-5555-4555-8555-555555555555';
function snapshot() {
  return { ...emptyCaseSnapshot(), selectedCaseId: first, cases: [{ id: first, user_id: owner, is_active: true, deleted_at: null }, { id: second, user_id: owner, deleted_at: null }], entries: [{ id: a, user_id: owner, case_id: first }, { id: b, user_id: owner, case_id: second }], children: [{ id: a, user_id: owner, case_id: first }, { id: b, user_id: owner, case_id: second }], filingPackages: [{ id: a, user_id: owner, case_id: first }, { id: b, user_id: owner, case_id: second }] } as CaseIntelligenceSnapshot;
}
function context(): CaseWorkspaceContext {
  return { reportPreviewState: { reportType: 'timeline', flagFilter: 'all', typeFilter: 'all' }, advisorState: { threadId: 'local', pinnedThreadId: null, messages: [], updatedAt: null }, filingBuilderState: { selectedPackageId: null, packageStates: {}, updatedAt: null }, patternReviewState: { acknowledgedPatternIds: [], dismissedPatternIds: [], updatedAt: null } };
}

test('all explicit context namespaces resolve within their expected case, including pattern suffixes and child filters', () => {
  const value = { ...context(), selectedCaseId: first, caseWorkspaceStates: { [first]: context(), [second]: context() }, savedReportVersions: [{ id: 'report', reportType: 'timeline', caseId: first, includedEntryIds: [a], linkedFilingPackageIds: [a], filters: { childFilter: a } }] };
  assert.deepEqual(inspectWorkspaceContext(value, snapshot(), owner), []);
  value.caseWorkspaceStates[second].patternReviewState.acknowledgedPatternIds = [`${second}:filing_linked_entries:${a}`];
  value.savedReportVersions[0].filters.childFilter = b;
  const issues = inspectWorkspaceContext(value, snapshot(), owner);
  assert.ok(issues.some((issue) => issue.path.endsWith('childFilter')));
  assert.ok(issues.some((issue) => issue.path.includes('acknowledgedPatternIds')));
  const safe = safeContextInput(value, issues);
  assert.equal((safe.savedReportVersions as unknown[]).length, 0);
  assert.deepEqual(Object.keys(safe.caseWorkspaceStates as object), [first]);
  assert.equal(value.caseWorkspaceStates[second].patternReviewState.acknowledgedPatternIds.length, 1);
});

test('unknown metadata is quarantined without being interpreted, while independent valid context remains intact', () => {
  const value = { ...context(), selectedCaseId: first, caseWorkspaceStates: { [first]: context() }, futureExpandedSnapshot: { linkedCaseId: second, arbitraryText: 'opaque original' } };
  const issues = inspectWorkspaceContext(value, snapshot(), owner);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, 'unsupported');
  const safe = safeContextInput(value, issues);
  assert.ok(!Object.hasOwn(safe, 'futureExpandedSnapshot'));
  assert.deepEqual(safe.advisorState, value.advisorState);
  assert.equal(value.futureExpandedSnapshot.arbitraryText, 'opaque original');
});

test('foreign context ownership cannot expose otherwise well-shaped conversation text', () => {
  const value = { ...context(), ownerId: second, selectedCaseId: first };
  value.advisorState.messages = [{ id: 'm', role: 'user', body: 'Foreign context body', createdAt: '2026-09-05T00:00:00Z', linkedEntryIds: [], localOnly: true }];
  const issues = inspectWorkspaceContext(value, snapshot(), owner);
  assert.ok(issues.some((issue) => issue.code === 'owner'));
  assert.deepEqual(safeContextInput(value, issues), {});
});

test('removed selection references clear their display context and incomplete form drafts retain valid source links', () => {
  const value = { ...context(), selectedCaseId: first, courtFormDrafts: [{ id: a, userId: owner, caseId: first, formId: 'mc031', values: { declaration: 'Incomplete draft' }, sourceEntryIds: [a], createdAt: '2026-09-05', updatedAt: '2026-09-05' }] };
  value.filingBuilderState.selectedPackageId = a;
  const before = snapshot();
  assert.deepEqual(inspectWorkspaceContext(value, before, owner), []);
  before.filingPackages = [];
  const issues = inspectWorkspaceContext(value, before, owner);
  const safe = safeContextInput(value, issues);
  assert.ok(!Object.hasOwn(safe, 'filingBuilderState'));
  assert.equal((safe.courtFormDrafts as unknown[]).length, 1);
  value.courtFormDrafts[0].sourceEntryIds = [b];
  assert.ok(inspectWorkspaceContext(value, before, owner).some((issue) => issue.path.includes('sourceEntryIds')));
});
