#!/usr/bin/env node
/**
 * Execute the actual minified Expo web export modules with their emitted Metro
 * runtime. This catches resolver/interop failures that Node and esbuild tests
 * cannot see. It does not boot the app, connect to Supabase, or test browser UI.
 * Run after `expo export --platform web`: node scripts/verify-built-web-exports.mjs dist
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import vm from 'node:vm';
import { PDFDocument } from 'pdf-lib';
import { unzipSync, strFromU8 } from 'fflate';

const directory = resolve(process.argv[2] ?? 'dist', '_expo/static/js/web');
const files = readdirSync(directory).filter((name) => name.endsWith('.js'));
const runtimeFiles = files.filter((name) => name.startsWith('__expo-metro-runtime-'));
assert.equal(runtimeFiles.length, 1, 'Expected one production Expo Metro runtime.');
const context = vm.createContext({ console, setTimeout, clearTimeout, TextEncoder, TextDecoder,
  Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, ArrayBuffer, DataView });
vm.runInContext(readFileSync(join(directory, runtimeFiles[0]), 'utf8'), context, { filename: runtimeFiles[0] });
assert.equal(typeof context.__r, 'function');
const metroRequire = context.__r;
const metroDefine = context.__d;
const definitions = new Map();
context.__d = (factory, id, dependencies) => {
  definitions.set(id, factory.toString());
  metroDefine(factory, id, dependencies);
};
// Register unmodified chunk factories without running the app's startup modules.
// The saved production runtime then loads only the export functions under test.
context.__r = () => {};
for (const name of files.filter((name) => name !== runtimeFiles[0])) {
  const source = readFileSync(join(directory, name), 'utf8');
  assert.ok(source.startsWith('__d('), `Unexpected chunk format: ${name}`);
  vm.runInContext(source, context, { filename: name });
}
context.__r = metroRequire;
function exported(name) {
  const matches = [...definitions].filter(([, source]) => source.includes(`.${name}=`));
  assert.equal(matches.length, 1, `Expected one built module exporting ${name}.`);
  const value = metroRequire(matches[0][0])[name];
  assert.equal(typeof value, 'function', `Missing built export ${name}.`);
  return value;
}

const createTimelinePdf = exported('createTimelinePdf');
const createEvidencePacket = exported('createEvidencePacket');
const createFactualReportPdf = exported('createFactualReportPdf');
const createCourtFormPdf = exported('createCourtFormPdf');
const createSharedTimeline = exported('createSharedTimeline');
const font = new Uint8Array(readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'));
const original = new TextEncoder().encode('SYNTHETIC TEST ORIGINAL — exact bytes.\n');
const hash = async (bytes) => createHash('sha256').update(bytes).digest('hex');
const stamp = '2026-09-05T01:00:00.000Z';
const secret = 'PRIVATE_EXPORT_SENTINEL';
const entry = { id: 'synthetic-entry', user_id: 'synthetic-owner', case_id: 'synthetic-case',
  child_id: null, entry_type: 'other', event_date: '2026-09-04', event_time: null,
  title: 'Synthetic export test', body: 'A factual record with Unicode: café.',
  metadata: { review_visibility: 'court_ready', privateValue: secret }, private_notes: secret,
  created_at: stamp, updated_at: stamp, deleted_at: null };
const attachment = { id: 'synthetic-attachment', user_id: entry.user_id, case_id: entry.case_id, entry_id: entry.id,
  file_name: 'original.txt', mime_type: 'text/plain', file_hash: await hash(original),
  file_size_bytes: original.length, hash_algorithm: 'SHA-256', deleted_at: null };
const selection = { caseId: entry.case_id, caseTitle: 'Synthetic test — not for filing', entries: [entry],
  attachments: [attachment], includedEntryIds: [entry.id], generatedAt: stamp };
const fonts = { regular: font };

const pdf = await createTimelinePdf(createSharedTimeline(selection), fonts);
assert.equal((await PDFDocument.load(pdf.bytes)).getPageCount(), 1);
const packet = await createEvidencePacket(selection, { fonts, sha256: hash, getAttachmentBytes: async () => original });
const zip = unzipSync(packet.bytes);
assert.deepEqual(zip['evidence/E001-A001.txt'], original);
assert.equal((await PDFDocument.load(zip['timeline.pdf'])).getPageCount(), 1);
const manifest = JSON.parse(strFromU8(zip['evidence-manifest.json']));
assert.equal(manifest.files[0].sha256, attachment.file_hash);
assert.equal(manifest.files[0].bytes, original.length);
for (const name of ['timeline.json', 'evidence-manifest.json', 'README.txt']) assert.ok(!strFromU8(zip[name]).includes(secret));
await assert.rejects(createEvidencePacket(selection, { fonts, sha256: hash, getAttachmentBytes: async () => new Uint8Array([1]) }), /does not match/);

const report = await createFactualReportPdf(selection, { ownerId: entry.user_id, reportType: 'benchBrief', fonts });
assert.ok((await PDFDocument.load(report.bytes)).getPageCount() >= 1);
const formManifest = JSON.parse(readFileSync('assets/forms/manifest.json', 'utf8'));
const declaration = formManifest.forms.find((form) => form.id === 'MC-031');
const form = await createCourtFormPdf({ formId: 'mc031', reviewed: true,
  templateBytes: new Uint8Array(readFileSync(join('assets/forms', declaration.template))),
  values: { petitioner: 'Synthetic Petitioner', respondent: 'Synthetic Respondent', caseNumber: 'TEST-ONLY',
    declaration: 'SYNTHETIC TEST DOCUMENT — NOT FOR FILING. A recorded fact.',
    declarantName: 'Synthetic Petitioner', declarationDate: '2026-09-05', rolePetitioner: true },
}, { sha256: hash, fontBytes: font });
const loadedForm = await PDFDocument.load(form.bytes);
assert.equal(loadedForm.getPageCount(), declaration.pages);
assert.ok(loadedForm.getForm().getFields().length > 0);
console.log('Built Expo web export verification passed: timeline PDF, exact-byte evidence ZIP, integrity rejection, factual report PDF, editable MC-031 PDF.');
