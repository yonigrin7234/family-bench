import { PDFDocument, PDFDict, PDFName, PDFTextField, PDFCheckBox, drawTextField, drawLine, pushGraphicsState, popGraphicsState, rgb, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { courtFormSections, mappedPdfValues, type CourtFormId } from './model';
import { courtFormTemplate } from './templates';
import type { TimelineArtifact } from '../export/timeline';

/** Stop at the field boundary; the generic PDF layout scans huge remainders repeatedly. */
function narrativeLines(value: string, font: PDFFont, size: number, width: number, maxLines: number): string[] {
  const lines: string[] = [];
  const push = (line: string) => { lines.push(line); if (lines.length > maxLines) throw new Error('overflow'); };
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const token of paragraph.match(/\s+|\S+/g) ?? []) {
      if (font.widthOfTextAtSize(line + token, size) <= width) { line += token; continue; }
      if (line) { push(line.trimEnd()); line = ''; }
      if (font.widthOfTextAtSize(token.trimStart(), size) > width) throw new Error('overflow');
      line = token.trimStart();
    }
    push(line);
  }
  return lines;
}

/** Fill only reviewed, allowlisted inputs on the pinned official template. Keep every form page and editable field. */
export async function createCourtFormPdf(input: {
  formId: CourtFormId; values: unknown; reviewed: boolean; templateBytes: Uint8Array;
}, options: { sha256: (bytes: Uint8Array) => Promise<string>; fontBytes: Uint8Array; assertCurrent?: () => void }): Promise<TimelineArtifact> {
  options.assertCurrent?.();
  if (!input.reviewed) throw new Error('Review the form inputs before generating the PDF.');
  const template = courtFormTemplate(input.formId);
  const mapped = mappedPdfValues(input.formId, input.values);
  if (await options.sha256(input.templateBytes) !== template.templateSha256) throw new Error('The court template integrity check failed. No form was created.');
  const pdf = await PDFDocument.load(input.templateBytes);
  if (pdf.getPageCount() !== template.pages) throw new Error('The official form page count does not match.');
  const form = pdf.getForm();
  if (form.hasXFA()) throw new Error('This template has unsupported active form content.');
  const fields = new Map(courtFormSections(input.formId).flatMap((section) => section.fields).flatMap((field) => field.pdfFields.map((name) => [name, field] as const)));
  // Embed the font so viewer substitutions cannot invalidate measured text fit. Fixed sizes never shrink to conceal overflow.
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(options.fontBytes, { subset: false });
  const fontData = fontkit.create(options.fontBytes);
  const charset = new Set(font.getCharacterSet());
  const resources = form.acroForm.dict.lookupMaybe(PDFName.of('DR'), PDFDict) ?? pdf.context.obj({});
  const fonts = resources.lookupMaybe(PDFName.of('Font'), PDFDict) ?? pdf.context.obj({});
  fonts.set(PDFName.of('FBFormText'), font.ref); resources.set(PDFName.of('Font'), fonts); form.acroForm.dict.set(PDFName.of('DR'), resources);
  form.acroForm.dict.delete(PDFName.of('NeedAppearances'));

  for (const [name, value] of Object.entries(mapped)) {
    const field = form.getField(name); const definition = fields.get(name); const label = definition?.label ?? name;
    if (typeof value === 'boolean') {
      if (!(field instanceof PDFCheckBox)) throw new Error(`The template checkbox changed: ${label}.`);
      if (value) field.check(); else field.uncheck();
      // The official source can lack a usable On appearance despite a valid /V and /AS.
      field.updateAppearances((_checkBox, widget) => {
        const { width, height } = widget.getRectangle();
        const ink = rgb(0, 0, 0); const side = Math.min(width, height) * 0.68;
        const left = (width - side) / 2; const bottom = (height - side) / 2;
        // The box outlines are printed in the official page artwork. Add only the X.
        const cross = [
          ...drawLine({ start: { x: left, y: bottom }, end: { x: left + side, y: bottom + side }, thickness: 0.9, color: ink }),
          ...drawLine({ start: { x: left, y: bottom + side }, end: { x: left + side, y: bottom }, thickness: 0.9, color: ink }),
        ];
        return { normal: { on: cross, off: [pushGraphicsState(), popGraphicsState()] } };
      });
      continue;
    }
    if (!(field instanceof PDFTextField)) throw new Error(`The template text field changed: ${label}.`);
    const unsupported = Array.from(value).find((character) => character !== '\n' && !charset.has(character.codePointAt(0)!));
    if (unsupported) throw new Error(`${label}: the PDF font cannot preserve character U+${unsupported.codePointAt(0)!.toString(16).toUpperCase()}. No PDF was created. Use the official form in a PDF editor that supports that text.`);
    if (!definition?.multiline && /[\n\r\t]/.test(value)) throw new Error(`${label}: use a single line.`);
    const maxLength = field.getMaxLength();
    if (maxLength && value.length > maxLength) throw new Error(`${label}: the official field allows at most ${maxLength} characters. Review the text or use an appropriate attachment.`);
    const multiline = Boolean(definition?.multiline);
    if (multiline) field.enableMultiline(); else field.disableMultiline();
    // The source's repeated captions were read-only and JavaScript-dependent. They are filled on every page and now editable independently.
    field.disableReadOnly(); field.disableCombing(); field.setText(value);
    const size = input.formId === 'mc031' ? 11 : 9;
    field.acroField.setDefaultAppearance(`/FBFormText ${size} Tf 0 g`);
    field.updateAppearances(font, (_textField, widget) => {
      const { width, height } = widget.getRectangle();
      if (widget.getAppearanceCharacteristics()?.getRotation()) throw new Error(`The template field orientation changed: ${label}.`);
      const padding = multiline ? 1 : 0.1;
      const bounds = { x: padding, y: padding, width: width - padding * 2, height: height - padding * 2 };
      // Use the actual glyph outlines, including accents and descenders, instead of an unrelated global font bounding box.
      const glyphs = fontData.layout(value.replace(/\n/g, ' ')).glyphs;
      const ascent = Math.max(0, ...glyphs.map((glyph) => glyph.path.bbox.maxY || 0)) * size / fontData.unitsPerEm;
      const descent = -Math.min(0, ...glyphs.map((glyph) => glyph.path.bbox.minY || 0)) * size / fontData.unitsPerEm;
      const fullHeight = ascent + descent;
      const overflow = () => new Error(`${label}: the text does not fit the official field at a readable size. Shorten it yourself or use an appropriate attachment in the full official form. Nothing was truncated and no PDF was created.`);
      let wrapped: string[];
      const lineHeight = Math.max(size * 1.25, fullHeight + size * 0.15);
      try { wrapped = multiline ? narrativeLines(value, font, size, bounds.width, Math.floor((bounds.height - fullHeight) / lineHeight) + 1) : [value]; }
      catch { throw overflow(); }
      const lines = wrapped.map((line, index) => ({ encoded: font.encodeText(line), x: padding,
        y: multiline ? bounds.y + bounds.height - ascent - index * lineHeight : (height - fullHeight) / 2 + descent,
        width: font.widthOfTextAtSize(line, size) }));
      if (value && (fullHeight > bounds.height || lines.some((line) => line.width > bounds.width + 0.001 || line.y - descent < padding - 0.001 || line.y + ascent > height - padding + 0.001))) {
        throw overflow();
      }
      widget.setDefaultAppearance(`/FBFormText ${size} Tf 0 g`);
      // Some official forms duplicate values at the widget level. Keep both locations consistent.
      if (widget.dict.has(PDFName.of('V'))) widget.dict.set(PDFName.of('V'), field.acroField.getValue()!);
      return drawTextField({ x: 0, y: 0, width, height, borderWidth: 0, color: undefined, borderColor: undefined,
        textLines: lines, textColor: rgb(0, 0, 0), font: font.name, fontSize: size, padding });
    });
  }
  const now = new Date();
  pdf.setTitle(`${template.id} — ${template.title} — unsigned draft`);
  pdf.setCreator('Family Bench — user-reviewed template filling'); pdf.setModificationDate(now);
  // Do not regenerate untouched fields, flatten, add a signature, or alter court-assigned sections.
  const bytes = await pdf.save({ updateFieldAppearances: false });
  const check = (await PDFDocument.load(bytes)).getForm();
  for (const [name, value] of Object.entries(mapped)) {
    const actual = typeof value === 'boolean' ? check.getCheckBox(name).isChecked() : check.getTextField(name).getText() ?? '';
    if (actual !== value) throw new Error('The filled PDF could not preserve every field value. No form was created.');
  }
  options.assertCurrent?.();
  return { bytes, name: `${template.id.toLowerCase()}-unsigned-${now.toISOString().slice(0, 10)}.pdf`, mimeType: 'application/pdf' };
}
