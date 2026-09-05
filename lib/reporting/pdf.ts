import { PDFDocument, rgb, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createSharedTimeline, selectedEntries, type TimelineSelection } from '../export/model';
import { wrapText, type TimelineArtifact, type TimelineFonts } from '../export/timeline';
import type { ReportPreviewType } from '../case-intelligence/types';
import { buildFactualReports, reportDateRange } from './reports';

/** Re-derive every fact from the exact selected records before creating the artifact. */
export async function createFactualReportPdf(input: TimelineSelection, options: {
  reportType: ReportPreviewType; ownerId: string; fonts: TimelineFonts; assertCurrent?: () => void;
}): Promise<TimelineArtifact> {
  options.assertCurrent?.();
  const selected = selectedEntries(input);
  if (selected.some((entry) => entry.user_id !== options.ownerId)) throw new Error('A selected record belongs to another account.');
  const report = buildFactualReports(selected)[options.reportType];
  if (!report || !report.entries.length) throw new Error('Select at least one matching record for this report.');
  // A type-specific report must not silently omit a selected record.
  if (report.entries.length !== selected.length) throw new Error('A selected record does not match this report type. Review the selection.');
  const timeline = createSharedTimeline({ ...input, entries: report.entries });
  const stamp = new Date(timeline.generatedAt);
  if (!Number.isFinite(stamp.getTime())) throw new Error('Report generation time is invalid.');
  const document = await PDFDocument.create(); document.registerFontkit(fontkit);
  const regular = await document.embedFont(options.fonts.regular, { subset: false });
  const bold = options.fonts.bold ? await document.embedFont(options.fonts.bold, { subset: false }) : regular;
  const supported = new Map([[regular, new Set(regular.getCharacterSet())], [bold, new Set(bold.getCharacterSet())]]);
  document.setTitle(`Family Bench — ${report.title}`); document.setAuthor('Family Bench');
  document.setSubject('Selected user-recorded facts and reproducible calculations'); document.setCreationDate(stamp); document.setModificationDate(stamp);
  let page: PDFPage; let y = 0; let currentReference: string | null = null;
  const ink = rgb(20 / 255, 24 / 255, 31 / 255); const mute = rgb(0.35, 0.36, 0.38);
  function addPage() { page = document.addPage([612, 792]); y = 726; page.drawText(`FAMILY BENCH / FACTUAL REPORT${currentReference ? ` / SOURCE ${currentReference}` : ''}`, { x: 48, y: 764, size: 8, font: regular, color: mute }); }
  function text(value: string, strong = false, size = 10) {
    const font = strong ? bold : regular;
    const cleaned = value.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
    const unsupported = Array.from(cleaned).find((character) => character !== '\n' && !supported.get(font)!.has(character.codePointAt(0)!));
    if (unsupported) throw new Error(`The PDF font cannot preserve character U+${unsupported.codePointAt(0)!.toString(16).toUpperCase()}. No report was created.`);
    for (const line of wrapText(cleaned, font, size, 516)) {
      if (y < 70 + size * 1.45) addPage();
      if (line) page.drawText(line, { x: 48, y, size, font, color: ink });
      y -= size * 1.45;
    }
    y -= 7;
  }
  addPage();
  text(report.title, true, 20); text(input.caseTitle || 'Case record', true, 13);
  text(`Selected event dates: ${reportDateRange(report.entries)} | ${report.entries.length} records`);
  text(`Generated: ${stamp.toISOString()}`); text(report.description);
  text('User-recorded material; events are not independently verified. Calculations use only the valid structured facts identified below. Private entries and private notes are excluded. Original files are available only through a separately selected evidence ZIP. This is not an official form, legal conclusion, or proof of court acceptance.');
  text('Summary', true, 14);
  report.keyFacts.forEach((fact) => text(fact));
  if (report.calculationRows.length) {
    text('Calculations and sources', true, 14);
    report.calculationRows.forEach((row) => text(`${row.text}\nSource entry: ${row.entryId}`));
  }
  addPage(); text('Source appendix', true, 18);
  for (const entry of timeline.entries) {
    currentReference = entry.reference;
    if (y < 160) addPage();
    text(`${entry.reference} — ${entry.date}${entry.time ? ` ${entry.time}` : ''}`, true, 11);
    text(entry.title, true, 13); text(entry.text);
    text(`Source entry: ${entry.sourceEntryId}\nRecorded: ${entry.recordedAt}\nLast updated: ${entry.updatedAt}`, false, 8);
    for (const attachment of entry.attachments) text(`${attachment.reference}: ${attachment.name}`, false, 9);
  }
  document.getPages().forEach((item, i, pages) => item.drawText(`Selected user records | Page ${i + 1} of ${pages.length}`, { x: 48, y: 32, size: 8, font: regular, color: mute }));
  const bytes = await document.save();
  options.assertCurrent?.();
  return { bytes, name: `family-bench-${options.reportType}-${stamp.toISOString().slice(0, 10)}.pdf`, mimeType: 'application/pdf' };
}
