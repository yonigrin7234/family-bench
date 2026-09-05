import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyCaseSnapshot } from '../../case-intelligence/ownership';
import type { Entry, EvidenceAttachment, FamilyBenchCase, FilingPackage, FilingPackageLocalState } from '../../case-intelligence/types';
import { resolveFilingPackageSelection } from '../model';

function fixture() {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: 'case-a', user_id: 'owner', deleted_at: null }, { id: 'case-b', user_id: 'owner', deleted_at: null }] as FamilyBenchCase[];
  snapshot.filingPackages = [{ id: 'package', user_id: 'owner', case_id: 'case-a', deleted_at: null }] as FilingPackage[];
  snapshot.entries = ['entry-a', 'entry-b', 'unlinked'].map((id) => ({ id, user_id: 'owner', case_id: 'case-a', event_date: '2026-09-05', event_time: null, metadata: {}, deleted_at: null } as Entry));
  snapshot.evidenceAttachments = [{ id: 'explicit', entry_id: 'entry-b' }, { id: 'sibling', entry_id: 'entry-b' }, { id: 'unrelated', entry_id: 'unlinked' }].map((row) => ({ ...row, user_id: 'owner', case_id: 'case-a', deleted_at: null } as EvidenceAttachment));
  const packageState: FilingPackageLocalState = { packageId: 'package', linkedEntryIds: ['entry-a'], linkedAttachmentIds: ['explicit'], linkedReportTypes: ['timeline', 'expense'], checklist: { forms: false, exhibits: false, declarations: false, service: false }, exhibitGroups: [], updatedAt: '2026-09-05' };
  return { snapshot, ownerId: 'owner', caseId: 'case-a', packageId: 'package', packageState };
}

test('package review is exact linked entry union original parents, with all sibling originals', () => {
  const selected = resolveFilingPackageSelection(fixture());
  assert.deepEqual(selected.entryIds, ['entry-a', 'entry-b']);
  assert.deepEqual(selected.attachmentParentEntryIds, ['entry-b']);
  assert.deepEqual(selected.attachments.map((row) => row.id), ['explicit', 'sibling']);
  assert.deepEqual(selected.reportTypes, ['timeline', 'expense']);
  assert.deepEqual(selected.issues, []);
});

test('missing, foreign-case and unavailable package requests never become all case records', () => {
  for (const patch of [{ packageId: '' }, { packageId: 'missing' }, { caseId: 'case-b' }, { ownerId: 'another-owner' }, { packageState: null }]) {
    const selected = resolveFilingPackageSelection({ ...fixture(), ...patch });
    assert.deepEqual(selected.entryIds, []); assert.ok(selected.issues.length);
  }
  const input = fixture(); input.packageState.linkedEntryIds = []; input.packageState.linkedAttachmentIds = [];
  assert.deepEqual(resolveFilingPackageSelection(input).entryIds, [], 'A report type alone adds no entries');
});

test('private source entries block package sharing, including original-file parents and CSV sources', () => {
  for (const metadata of [{ review_visibility: 'private' }, { import_provenance: { kind: 'csv_source' }, review_visibility: 'court_ready' }]) {
    const input = fixture(); input.snapshot.entries[1].metadata = metadata;
    const selected = resolveFilingPackageSelection(input);
    assert.ok(selected.issues.some((issue) => issue.includes('private')));
    assert.deepEqual(selected.entryIds, ['entry-a']); assert.deepEqual(selected.attachments, []);
  }
});

test('dangling, deleted and cross-case sources block output without exposing foreign record content', () => {
  for (const kind of ['deleted-entry', 'deleted-original', 'foreign-original', 'dangling-parent', 'foreign-sibling']) {
    const input = fixture();
    if (kind === 'deleted-entry') input.snapshot.entries[1].deleted_at = '2026-09-05';
    if (kind === 'deleted-original') input.snapshot.evidenceAttachments[0].deleted_at = '2026-09-05';
    if (kind === 'foreign-original') input.snapshot.evidenceAttachments[0].case_id = 'case-b';
    if (kind === 'dangling-parent') input.snapshot.evidenceAttachments[0].entry_id = 'missing';
    if (kind === 'foreign-sibling') input.snapshot.evidenceAttachments[1].user_id = 'other-owner';
    const selected = resolveFilingPackageSelection(input);
    assert.ok(selected.issues.length, kind);
    assert.ok(selected.attachments.every((row) => row.user_id === 'owner' && row.case_id === 'case-a'));
  }
});

test('tombstoned linked sources remain identifiable for explicit unlink recovery without removing records', () => {
  const input = fixture();
  input.packageState.linkedEntryIds.push('unlinked');
  input.snapshot.entries[0].deleted_at = '2026-09-05';
  input.snapshot.entries[1].deleted_at = '2026-09-05'; // The live original now has no live parent.
  const originalSnapshot = structuredClone(input.snapshot);
  const blocked = resolveFilingPackageSelection(input);
  assert.deepEqual(blocked.unavailableEntryIds, ['entry-a']);
  assert.deepEqual(blocked.unavailableAttachmentIds, ['explicit']);
  assert.ok(blocked.issues.length);
  input.packageState.linkedEntryIds = input.packageState.linkedEntryIds.filter((id) => !blocked.unavailableEntryIds.includes(id));
  input.packageState.linkedAttachmentIds = input.packageState.linkedAttachmentIds.filter((id) => !blocked.unavailableAttachmentIds.includes(id));
  const recovered = resolveFilingPackageSelection(input);
  assert.deepEqual(recovered.issues, []);
  assert.deepEqual(recovered.entryIds, ['unlinked']);
  assert.deepEqual(recovered.attachments.map((row) => row.id), ['unrelated']);
  assert.deepEqual(input.snapshot, originalSnapshot, 'Unlink recovery changes selection only');
});

test('unavailable link recovery returns linked IDs only and never foreign record labels', () => {
  const input = fixture();
  input.snapshot.entries[0].case_id = 'case-b'; input.snapshot.entries[0].title = 'Other-case secret';
  input.snapshot.evidenceAttachments[0].user_id = 'other-owner'; input.snapshot.evidenceAttachments[0].file_name = 'Other-owner filename';
  const selected = resolveFilingPackageSelection(input);
  assert.deepEqual(selected.unavailableEntryIds, ['entry-a']);
  assert.deepEqual(selected.unavailableAttachmentIds, ['explicit']);
  assert.ok(!JSON.stringify(selected).includes('Other-case secret'));
  assert.ok(!JSON.stringify(selected).includes('Other-owner filename'));
  assert.deepEqual(resolveFilingPackageSelection({ ...input, packageId: 'missing' }).unavailableEntryIds, []);
  const privateInput = fixture(); privateInput.snapshot.entries[1].metadata = { review_visibility: 'private' };
  assert.deepEqual(resolveFilingPackageSelection(privateInput).unavailableAttachmentIds, [], 'Live private sources have their existing unlink controls');
});
