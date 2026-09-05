import test from 'node:test';
import assert from 'node:assert/strict';
import { savePendingCaptureAttachments } from '../captureQueue';

test('a partial attachment failure retries only unfinished files under the original entry and attachment IDs', async () => {
  const completedIds = new Set<string>();
  const attachments = ['one', 'two', 'three'].map((id) => ({ attachmentId: id, filename: `${id}.pdf`, kind: 'document' as const }));
  const calls: string[] = [];
  let fail = true;
  const save = async (input: { entryId: string; attachmentId: string }) => {
    assert.equal(input.entryId, 'stable-entry');
    calls.push(input.attachmentId);
    if (input.attachmentId === 'two' && fail) throw new Error('Storage full');
  };
  await assert.rejects(savePendingCaptureAttachments({ entryId: 'stable-entry', attachments, completedIds, save }), /Storage full/);
  assert.deepEqual([...completedIds], ['one']);
  fail = false;
  await savePendingCaptureAttachments({ entryId: 'stable-entry', attachments, completedIds, save });
  assert.deepEqual(calls, ['one', 'two', 'two', 'three']);
  assert.deepEqual([...completedIds], ['one', 'two', 'three']);
});
