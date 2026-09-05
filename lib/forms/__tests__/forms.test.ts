import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFName } from 'pdf-lib';
import { courtFormSections, sanitizeCourtFormValues, validateCourtFormValues, mappedPdfValues, type CourtFormId } from '../model';
import { courtFormTemplate } from '../templates';
import { createCourtFormPdf } from '../pdf';
import { assertCourtFormSources, courtFormSources, courtFormSourceText } from '../sources';
import { DECLARATION_FIXTURE, REQUEST_FIXTURE } from './fixtures';
import type { Entry } from '../../case-intelligence/types';

const bytes = (id: CourtFormId) => new Uint8Array(readFileSync(`assets/forms/${courtFormTemplate(id).template}`));
const hash = async (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const fixtures = { mc031: DECLARATION_FIXTURE, fl300: REQUEST_FIXTURE };
const fontBytes = new Uint8Array(readFileSync('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'));

test('official sources and editable working templates match the manifest; every mapped field exists with its expected type', async () => {
  for (const id of ['mc031', 'fl300'] as const) {
    const source = courtFormTemplate(id);
    assert.equal(await hash(readFileSync(`assets/forms/${source.original}`)), source.sha256);
    assert.equal(await hash(bytes(id)), source.templateSha256);
    assert.match(new URL(source.sourceUrl).hostname, /(^|\.)courts\.ca\.gov$/);
    const document = await PDFDocument.load(bytes(id)); const form = document.getForm();
    assert.equal(document.getPageCount(), source.pages); assert.equal(form.hasXFA(), false);
    for (const field of courtFormSections(id).flatMap((section) => section.fields)) for (const name of field.pdfFields) {
      assert.equal(form.getField(name).constructor.name, field.kind === 'check' ? 'PDFCheckBox' : 'PDFTextField', name);
    }
  }
});

test('filled templates preserve canonical values, checkbox states, every editable field and untouched court sections', async () => {
  for (const id of ['mc031', 'fl300'] as const) {
    const before = await PDFDocument.load(bytes(id)); const expected = mappedPdfValues(id, fixtures[id]);
    const result = await createCourtFormPdf({ formId: id, values: fixtures[id], reviewed: true, templateBytes: bytes(id) }, { sha256: hash, fontBytes });
    const after = await PDFDocument.load(result.bytes); const form = after.getForm();
    assert.equal(after.getPageCount(), before.getPageCount());
    assert.deepEqual(form.getFields().map((field) => field.getName()), before.getForm().getFields().map((field) => field.getName()));
    for (const original of before.getForm().getFields()) {
      const name = original.getName(); const field = form.getField(name);
      if (field instanceof PDFTextField) {
        assert.equal(field.getText() ?? '', expected[name] ?? (original as PDFTextField).getText() ?? '', name);
        if (name in expected) {
          assert.equal(field.isReadOnly(), false, `Filled text must remain editable: ${name}`);
          for (const widget of field.acroField.getWidgets()) {
            assert.ok(widget.getAppearances()?.normal, `Missing visible appearance: ${name}`);
            const widgetValue = widget.dict.get(PDFName.of('V'));
            if (widgetValue) assert.equal(widgetValue.toString(), field.acroField.getValue()!.toString(), `Widget disagrees with canonical value: ${name}`);
          }
        }
      } else if (field instanceof PDFCheckBox) {
        assert.equal(field.isChecked(), expected[name] ?? (original as PDFCheckBox).isChecked(), name);
        for (const widget of field.acroField.getWidgets()) {
          assert.equal(widget.getAppearanceState()?.toString(), field.isChecked() ? widget.getOnValue()?.toString() : '/Off', name);
          if (name in expected) {
            const appearances = widget.getAppearances()?.normal;
            assert.ok(appearances, `Missing visible checkbox appearance: ${name}`);
            assert.ok('get' in appearances && appearances.get(widget.getAppearanceState()!), `Missing current checkbox state appearance: ${name}`);
          }
        }
      }
    }
    assert.match(result.name, /unsigned/); assert.equal(result.mimeType, 'application/pdf');
    assert.equal(after.catalog.has(PDFName.of('Perms')), false);
    assert.equal(form.acroForm.dict.has(PDFName.of('NeedAppearances')), false);
  }
});

test('drafts allow incomplete values, drop unapproved fields and reject wrong types or unsupported forms', () => {
  assert.deepEqual(sanitizeCourtFormValues('mc031', { declaration: '  A fact.\r\nSecond line.  ', judicialSignature: 'forged', rolePetitioner: true }), { declaration: 'A fact.\nSecond line.', rolePetitioner: true });
  assert.deepEqual(sanitizeCourtFormValues('fl300', {}), {});
  assert.throws(() => sanitizeCourtFormValues('unknown' as CourtFormId, {}), /not supported/);
  assert.throws(() => sanitizeCourtFormValues('fl300', { requestCustody: 'yes' }), /checkbox/);
  assert.throws(() => sanitizeCourtFormValues('mc031', { declaration: 'x'.repeat(20_001) }), /20,000/);
});

test('generation rejects missing review, invalid calendar dates and contradictory request details', async () => {
  await assert.rejects(createCourtFormPdf({ formId: 'mc031', values: DECLARATION_FIXTURE, reviewed: false, templateBytes: bytes('mc031') }, { sha256: hash, fontBytes }), /Review/);
  assert.throws(() => validateCourtFormValues('mc031', { ...DECLARATION_FIXTURE, declarationDate: '2026-02-30' }), /real date/);
  assert.throws(() => validateCourtFormValues('mc031', { ...DECLARATION_FIXTURE, roleRespondent: true }), /one declarant role/);
  assert.throws(() => validateCourtFormValues('fl300', { ...REQUEST_FIXTURE, requestOther: false }), /Select Other orders/);
  assert.throws(() => validateCourtFormValues('fl300', { ...REQUEST_FIXTURE, changeOrder: false }), /change to an existing order/);
  assert.throws(() => validateCourtFormValues('fl300', { ...REQUEST_FIXTURE, child2Name: '' }), /Child 2/);
  assert.throws(() => validateCourtFormValues('fl300', { ...REQUEST_FIXTURE, hasRestrainingOrders: false }), /protective order/);
});

test('overflow, unsupported glyphs, stale context and changed template bytes stop output without truncation', async () => {
  const make = (values: unknown, extra: Record<string, unknown> = {}) => createCourtFormPdf({ formId: 'mc031', values, reviewed: true, templateBytes: bytes('mc031') }, { sha256: hash, fontBytes, ...extra });
  await assert.rejects(make({ ...DECLARATION_FIXTURE, declaration: 'A complete factual sentence. '.repeat(500) }), /does not fit/);
  await assert.rejects(make({ ...DECLARATION_FIXTURE, petitioner: 'Verylongunbrokenname'.repeat(30) }), /does not fit|at most/);
  await assert.rejects(make({ ...DECLARATION_FIXTURE, declaration: 'Unsupported \u{1F600}' }), /cannot preserve/);
  await assert.rejects(make(DECLARATION_FIXTURE, { sha256: async () => 'bad-hash' }), /integrity/);
  let calls = 0;
  await assert.rejects(make(DECLARATION_FIXTURE, { assertCurrent: () => { if (++calls > 1) throw new Error('context changed'); } }), /context changed/);
});

test('journal insertion is uncapped, owner/case/live/privacy scoped and does not copy private notes', () => {
  const entry = (id: string, patch: Partial<Entry> = {}) => ({ id, user_id: 'owner', case_id: 'case', event_date: '2026-09-05', event_time: '10:00:00', body: 'A recorded fact.', private_notes: 'PRIVATE_SENTINEL', metadata: {}, deleted_at: null, ...patch }) as Entry;
  const rows = Array.from({ length: 150 }, (_, index) => entry(String(index)));
  rows.push(entry('private', { metadata: { review_visibility: 'private' } }), entry('deleted', { deleted_at: '2026-09-05T00:00Z' }), entry('other-case', { case_id: 'else' }), entry('other-owner', { user_id: 'else' }));
  assert.equal(courtFormSources(rows, 'case', 'owner').length, 150);
  assert.doesNotThrow(() => assertCourtFormSources(['0', '149'], rows, 'case', 'owner'));
  for (const id of ['private', 'deleted', 'other-case', 'other-owner', 'missing']) assert.throws(() => assertCourtFormSources([id], rows, 'case', 'owner'));
  const inserted = courtFormSourceText(rows[0]);
  assert.equal(inserted, '2026-09-05 10:00:00\nA recorded fact.'); assert.doesNotMatch(inserted, /PRIVATE_SENTINEL/);
});
