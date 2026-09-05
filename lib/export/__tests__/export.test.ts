import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { strFromU8, unzipSync } from 'fflate';
import type { Entry, EvidenceAttachment } from '../../case-intelligence/types';
import { createSharedTimeline, publicFileName, validateDateRange, type TimelineSelection } from '../model';
import { createEvidencePacket, createTimelinePdf, wrapText } from '../timeline';

const font = new Uint8Array(readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'));
const fonts = { regular: font };
const stamp = '2026-09-05T01:00:00.000Z';
const secret = 'DO-NOT-SHARE-PRIVATE-DATA';
function entry(id = 'entry-1', patch: Partial<Entry> = {}): Entry {
  return {
    id, user_id: 'account-secret', case_id: 'case-1', child_id: null, entry_type: 'general',
    event_date: '2026-09-04', event_time: '14:30:00', event_end_time: null, custody_period: null,
    title: 'Recorded exchange', body: 'Arrived at 14:30. The exchange completed at 14:35.',
    child_mood: null, is_flagged: false, flag_severity: null, flag_category: null, issue_key: null,
    location_name: null, location_lat: 42, location_lng: 7,
    metadata: { captured_body: secret, token: secret, local_uri: `/private/${secret}` },
    voice_transcript: secret, capture_method: 'manual', content_hash: secret, is_edited: true,
    private_notes: secret, court_ready_summary: secret, created_at: stamp, updated_at: stamp,
    deleted_at: null, ...patch,
  };
}
function attachment(patch: Partial<EvidenceAttachment> = {}): EvidenceAttachment {
  return {
    id: 'attachment-1', user_id: 'account-secret', case_id: 'case-1', entry_id: 'entry-1',
    file_name: `/private/${secret}/receipt.pdf`, file_type: 'document', mime_type: 'application/pdf',
    file_size_bytes: 4, storage_bucket: 'private-evidence', storage_path: `/private/${secret}`,
    thumbnail_path: secret, description: secret, is_receipt: true, file_hash: null,
    hash_algorithm: 'SHA-256', captured_at: stamp, source_device: secret,
    exif: { device: secret }, created_at: stamp, deleted_at: null, ...patch,
  };
}
function selection(patch: Partial<TimelineSelection> = {}): TimelineSelection {
  return { caseId: 'case-1', caseTitle: 'Family timeline', entries: [entry()], attachments: [attachment()],
    includedEntryIds: ['entry-1'], generatedAt: stamp, ...patch };
}
const sha256 = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

test('shared schema excludes private notes, raw metadata, auth, source paths, transcripts and summaries', () => {
  const report = createSharedTimeline(selection());
  const json = JSON.stringify(report);
  for (const forbidden of [secret, 'account-secret', 'private_notes', 'metadata', 'storage_path', 'voice_transcript', 'court_ready_summary', '/private/']) {
    assert.ok(!json.includes(forbidden), `leaked ${forbidden}`);
  }
  assert.equal(report.entries[0].text, entry().body);
  assert.equal(report.entries[0].sourceEntryId, 'entry-1');
  assert.deepEqual(report.entries[0].attachments, [{ reference: 'E001-A001', name: 'receipt.pdf', mimeType: 'application/pdf' }]);
  assert.equal(publicFileName('C:\\Users\\private\\proof.png'), 'proof.png');
});

test('selection rejects private, deleted, missing and cross-case entries', () => {
  for (const patch of [{ metadata: { review_visibility: 'private' } }, { metadata: { review_visibility: 'court_ready', import_provenance: { kind: 'csv_source' } } }, { deleted_at: stamp }, { case_id: 'other' }]) {
    assert.throws(() => createSharedTimeline(selection({ entries: [entry('entry-1', patch)] })));
  }
  assert.throws(() => createSharedTimeline(selection({ includedEntryIds: ['missing'] })), /no longer available/);
  assert.throws(() => createSharedTimeline(selection({ includedEntryIds: [] })), /at least one/);
  assert.throws(() => createSharedTimeline(selection({ attachments: [attachment({ user_id: 'another-user' })] })), /does not belong/);
});

test('date range is inclusive and validates real calendar dates', () => {
  assert.doesNotThrow(() => validateDateRange('2024-02-29', '2026-09-04'));
  for (const [start, end] of [['2025-02-29', ''], ['2026-02-30', ''], ['2026-12-01', '2026-01-01'], ['9/4/26', '']]) {
    assert.throws(() => validateDateRange(start, end));
  }
  assert.equal(createSharedTimeline(selection({ fromDate: '2026-09-04', toDate: '2026-09-04' })).entries.length, 1);
  assert.throws(() => createSharedTimeline(selection({ fromDate: '2026-09-05' })), /outside/);
});

test('only included entries are exported with stable chronological source references', () => {
  const report = createSharedTimeline(selection({ entries: [entry('later', { event_date: '2026-09-05' }), entry('earlier'), entry('excluded')],
    attachments: [], includedEntryIds: ['later', 'earlier'] }));
  assert.deepEqual(report.entries.map((item) => [item.reference, item.sourceEntryId]), [['E001', 'earlier'], ['E002', 'later']]);
});

test('PDF preserves supported Unicode and paginates long entries and unbroken tokens', async () => {
  const unicode = '“Café” — Déjà vu. Ελληνικά. Кириллица.';
  const report = createSharedTimeline(selection({ attachments: [], entries: [entry('entry-1', {
    title: unicode, body: `${unicode}\n\n${'A long factual record with accents: résumé. '.repeat(600)}\n${'W'.repeat(2000)}`,
  })] }));
  const pdf = await createTimelinePdf(report, fonts);
  const loaded = await PDFDocument.load(pdf.bytes);
  assert.ok(loaded.getPageCount() >= 5);
  assert.equal(loaded.getTitle(), 'Family Bench - factual timeline');
  assert.equal(pdf.mimeType, 'application/pdf');
  assert.deepEqual(report.entries[0].text.split('\n')[0], unicode);
  assert.ok(wrapText('123456789', { widthOfTextAtSize: (value) => value.length }, 10, 3).every((line) => line.length <= 3));
});

test('unsupported glyphs stop PDF generation rather than silently dropping user text', async () => {
  await assert.rejects(() => createTimelinePdf(createSharedTimeline(selection({ entries: [entry('entry-1', { body: 'A child said 你好' })] })), fonts), /could not preserve/);
});

test('evidence packet contains exact bytes, factual timeline and verifiable manifest without private row fields', async () => {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  const digest = await sha256(bytes);
  const artifact = await createEvidencePacket(selection({ attachments: [attachment({ file_hash: digest })] }), {
    fonts, sha256, getAttachmentBytes: async () => bytes,
  });
  const zip = unzipSync(artifact.bytes);
  assert.deepEqual(Object.keys(zip).sort(), ['README.txt', 'evidence-manifest.json', 'evidence/E001-A001.pdf', 'timeline.json', 'timeline.pdf']);
  assert.deepEqual(zip['evidence/E001-A001.pdf'], bytes);
  const manifest = JSON.parse(strFromU8(zip['evidence-manifest.json']));
  assert.equal(manifest.files[0].sha256, digest);
  assert.equal(manifest.files[0].bytes, 4);
  for (const name of ['timeline.json', 'evidence-manifest.json', 'README.txt']) {
    assert.ok(!strFromU8(zip[name]).includes(secret));
    assert.ok(!strFromU8(zip[name]).includes('account-secret'));
  }
  assert.equal((await PDFDocument.load(zip['timeline.pdf'])).getPageCount(), 1);
});

test('missing, empty and changed evidence stop the entire packet with a source reference', async () => {
  await assert.rejects(() => createEvidencePacket(selection(), { fonts, sha256, getAttachmentBytes: async () => { throw new Error(`/private/${secret}`); } }), /Evidence E001-A001 could not be read/);
  await assert.rejects(() => createEvidencePacket(selection(), { fonts, sha256, getAttachmentBytes: async () => new Uint8Array() }), /is empty/);
  await assert.rejects(() => createEvidencePacket(selection({ attachments: [attachment({ file_hash: 'a'.repeat(64) })] }), {
    fonts, sha256, getAttachmentBytes: async () => new Uint8Array([1]),
  }), /does not match/);
});
