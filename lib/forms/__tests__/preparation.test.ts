import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pinCourtFormPreparation } from '../preparation';
import type { CourtFormDraft } from '../model';
import type { Entry } from '../../case-intelligence/types';
import { DECLARATION_FIXTURE } from './fixtures';

const entry = { id: 'entry', user_id: 'owner', case_id: 'case', body: 'A recorded fact.', event_date: '2026-09-05', event_time: '10:00:00', metadata: {}, deleted_at: null } as Entry;
const draft: CourtFormDraft = { id: 'draft', userId: 'owner', caseId: 'case', formId: 'mc031', values: DECLARATION_FIXTURE, sourceEntryIds: ['entry'], createdAt: '2026-09-05T00:00:00Z', updatedAt: '2026-09-05T00:00:00Z' };

test('form generation survives its own save and same-content sync replacements', async () => {
  const assertPrepared = pinCourtFormPreparation(draft, [entry]);
  let drafts: CourtFormDraft[] = [];
  let entries = [entry];
  // Save returns fresh records and sync republishes them after PDF work begins.
  await Promise.resolve(); drafts = [structuredClone(draft)];
  const assertCurrent = () => assertPrepared(drafts, entries);
  assertCurrent();
  const { createCourtFormPdf } = await import('../pdf');
  const { courtFormTemplate } = await import('../templates');
  const artifact = await createCourtFormPdf({ formId: 'mc031', values: draft.values, reviewed: true, templateBytes: readFileSync(`assets/forms/${courtFormTemplate('mc031').template}`) }, {
    fontBytes: readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    sha256: async (bytes) => {
      drafts = [{ ...structuredClone(draft), updatedAt: '2026-09-05T00:01:00Z', values: { ...draft.values, roleRespondent: false, otherRole: '' } }];
      entries = [{ ...structuredClone(entry), updated_at: '2026-09-05T00:01:00Z', metadata: { sync_receipt: 'new' }, private_notes: 'Not exported' }];
      await Promise.resolve();
      return createHash('sha256').update(bytes).digest('hex');
    },
    assertCurrent,
  });
  assertCurrent(); assert.ok(artifact.bytes.length > 1000); assert.equal(artifact.mimeType, 'application/pdf');
});

test('a draft edit, removal, identity change or source selection change cancels preparation', () => {
  const assertPrepared = pinCourtFormPreparation(draft, [entry]);
  for (const patch of [
    { values: { ...draft.values, declaration: 'Changed after review.' } },
    { values: { ...draft.values, roleRespondent: true } },
    { sourceEntryIds: [] }, { caseId: 'other-case' }, { userId: 'other-owner' }, { formId: 'fl300' as const },
  ]) assert.throws(() => assertPrepared([{ ...draft, ...patch }], [entry]), /draft changed/);
  assert.throws(() => assertPrepared([], [entry]), /draft changed/);
});

test('source edits during saving or PDF preparation cancel but unrelated record updates do not', () => {
  const assertPrepared = pinCourtFormPreparation(draft, [entry]);
  for (const patch of [
    { body: 'Edited factual body.' }, { event_date: '2026-09-06' }, { event_time: '11:00:00' },
    { metadata: { review_visibility: 'private' } }, { metadata: { import_provenance: { kind: 'csv_source' } } },
    { deleted_at: '2026-09-05T00:01:00Z' }, { user_id: 'other-owner' }, { case_id: 'other-case' },
  ]) assert.throws(() => assertPrepared([draft], [{ ...entry, ...patch }]), /source entry/i);
  assert.throws(() => assertPrepared([draft], []), /source entry/i);
  assert.doesNotThrow(() => assertPrepared([draft, { ...draft, id: 'unrelated', values: {} }], [{ ...entry, title: 'Changed label', updated_at: 'later' }, { ...entry, id: 'unrelated', body: 'Changed unrelated fact.' }]));
});

test('preparation expectations remain fixed if callers mutate the original draft and source objects', () => {
  const source = structuredClone(entry); const selected = structuredClone(draft);
  const assertPrepared = pinCourtFormPreparation(selected, [source]);
  source.body = 'Changed in place.';
  assert.throws(() => assertPrepared([draft], [source]), /facts changed/);
  selected.values.declaration = 'Draft changed in place.';
  assert.throws(() => assertPrepared([selected], [entry]), /draft changed/);
});
