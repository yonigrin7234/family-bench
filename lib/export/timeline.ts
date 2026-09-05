import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { strToU8, zipSync } from 'fflate';
import type { EvidenceAttachment } from '../case-intelligence/types';
import { attachmentsForEntry, createSharedTimeline, selectedEntries, type SharedTimeline, type TimelineSelection } from './model';

export type TimelineFonts = { regular: Uint8Array; bold?: Uint8Array };
export type TimelineArtifact = { bytes: Uint8Array; name: string; mimeType: string };
const PAGE = { width: 612, height: 792, margin: 48, bottom: 64 };
const INK = rgb(0.14, 0.16, 0.14);
const MUTE = rgb(0.37, 0.40, 0.37);

function cleanText(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}

/** Split by measured glyph width, including long unbroken words. No text is truncated. */
export function wrapText(value: string, font: Pick<PDFFont, 'widthOfTextAtSize'>, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of cleanText(value).split('\n')) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '';
    for (const word of paragraph.split(/(\s+)/)) {
      if (font.widthOfTextAtSize(line + word, size) <= width) { line += word; continue; }
      if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
      for (const character of Array.from(word.trimStart())) {
        if (line && font.widthOfTextAtSize(line + character, size) > width) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line.trimEnd());
  }
  return lines;
}

function assertFontCoverage(text: string, font: PDFFont): void {
  const supported = new Set(font.getCharacterSet());
  const missing = [...new Set(Array.from(cleanText(text)).filter((character) => character !== '\n'
    && !supported.has(character.codePointAt(0)!)))];
  if (missing.length) {
    throw new Error(`PDF could not preserve these characters: ${missing.slice(0, 8).map((character) => `U+${character.codePointAt(0)!.toString(16).toUpperCase()}`).join(', ')}. The selected font does not support this text; no export was created.`);
  }
}

export async function createTimelinePdf(timeline: SharedTimeline, fonts: TimelineFonts): Promise<TimelineArtifact> {
  const document = await PDFDocument.create();
  document.registerFontkit(fontkit);
  // Inter's subset glyph mappings are unreliable in some PDF renderers. Embed
  // the complete font so source text renders faithfully across viewers.
  const regular = await document.embedFont(fonts.regular, { subset: false });
  const bold = fonts.bold ? await document.embedFont(fonts.bold, { subset: false }) : regular;
  document.setTitle('Family Bench - factual timeline');
  document.setAuthor('Family Bench');
  document.setSubject('User-recorded events and source references');
  document.setCreator('Family Bench');
  document.setProducer('Family Bench');
  const stamp = new Date(timeline.generatedAt);
  if (!Number.isFinite(stamp.getTime())) throw new Error('Report generation date is invalid.');
  document.setCreationDate(stamp);
  document.setModificationDate(stamp);
  let page: PDFPage;
  let currentReference: string | null = null;
  let y = PAGE.height - PAGE.margin;
  function addPage() {
    page = document.addPage([PAGE.width, PAGE.height]);
    page.drawText(`FAMILY BENCH  /  FACTUAL TIMELINE${currentReference ? `  /  SOURCE ${currentReference}` : ''}`, { x: PAGE.margin, y: PAGE.height - 28, size: 8, font: regular, color: MUTE });
    y = PAGE.height - PAGE.margin - 14;
  }
  function text(value: string, options: { size?: number; bold?: boolean; muted?: boolean; gap?: number } = {}) {
    const size = options.size ?? 10;
    const font = options.bold ? bold : regular;
    const normalized = cleanText(value);
    assertFontCoverage(normalized, font);
    const lines = wrapText(normalized, font, size, PAGE.width - PAGE.margin * 2);
    for (const line of lines) {
      if (y - size * 1.45 < PAGE.bottom) addPage();
      if (line) page.drawText(line, { x: PAGE.margin, y, size, font, color: options.muted ? MUTE : INK });
      y -= size * 1.45;
    }
    y -= options.gap ?? 6;
  }
  addPage();
  text(timeline.title, { size: 22, bold: true, gap: 10 });
  text(`Event dates: ${timeline.fromDate || 'first recorded'} to ${timeline.toDate || 'latest recorded'}`, { muted: true });
  text(`${timeline.entries.length} selected entries | Generated ${stamp.toISOString()}`, { muted: true });
  text('This report reproduces selected user-recorded facts. It does not verify events or determine legal conclusions. Private entries and private notes are excluded. Original evidence files are provided only in a separately selected evidence packet.', { gap: 20 });
  for (const entry of timeline.entries) {
    currentReference = entry.reference;
    if (y < PAGE.bottom + 100) addPage();
    text(`${entry.reference}  ${entry.date}${entry.time ? ` at ${entry.time}` : ''}`, { size: 10, bold: true, muted: true });
    text(entry.title, { size: 14, bold: true });
    text(`Type: ${entry.type}`, { size: 9, muted: true });
    text(entry.text, { gap: 10 });
    text(`Source entry: ${entry.sourceEntryId}`, { size: 8, muted: true });
    text(`Recorded: ${entry.recordedAt} | Last updated: ${entry.updatedAt}`, { size: 8, muted: true });
    if (entry.attachments.length) {
      text(`Evidence references (${entry.attachments.length}):`, { size: 9, bold: true });
      for (const attachment of entry.attachments) text(`${attachment.reference} - ${attachment.name}`, { size: 9 });
    } else text('Evidence references: none attached.', { size: 9, muted: true });
    y -= 12;
  }
  const pages = document.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: PAGE.margin, y: 44 }, end: { x: PAGE.width - PAGE.margin, y: 44 }, color: rgb(0.82, 0.83, 0.80), thickness: 0.5 });
    item.drawText(`Selected user records | Page ${index + 1} of ${pages.length}`, { x: PAGE.margin, y: 29, size: 8, font: regular, color: MUTE });
  });
  return { bytes: await document.save(), name: `family-bench-timeline-${stamp.toISOString().slice(0, 10)}.pdf`, mimeType: 'application/pdf' };
}

const EXTENSIONS: Record<string, string> = {
  'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
  'image/heic': '.heic', 'image/heif': '.heif', 'audio/mp4': '.m4a', 'audio/mpeg': '.mp3',
  'audio/wav': '.wav', 'audio/webm': '.webm', 'video/mp4': '.mp4', 'text/plain': '.txt',
};

export async function createEvidencePacket(input: TimelineSelection, options: {
  fonts: TimelineFonts;
  getAttachmentBytes: (attachment: EvidenceAttachment) => Promise<Uint8Array>;
  sha256: (bytes: Uint8Array) => Promise<string>;
}): Promise<TimelineArtifact> {
  const timeline = createSharedTimeline(input);
  const files: Record<string, Uint8Array> = {};
  const manifest: Array<{ reference: string; entryReference: string; name: string; file: string; mimeType: string | null; bytes: number; sha256: string }> = [];
  const entries = selectedEntries(input);
  let totalBytes = 0;
  for (const [entryIndex, entry] of entries.entries()) {
    const sharedEntry = timeline.entries[entryIndex];
    for (const [attachmentIndex, attachment] of attachmentsForEntry(input, entry).entries()) {
      const shared = sharedEntry.attachments[attachmentIndex];
      let bytes: Uint8Array;
      try { bytes = await options.getAttachmentBytes(attachment); }
      catch { throw new Error(`Evidence ${shared.reference} could not be read. Restore or remove that attachment before exporting; no packet was created.`); }
      if (!bytes.length) throw new Error(`Evidence ${shared.reference} is empty. No packet was created.`);
      totalBytes += bytes.length;
      if (totalBytes > 150 * 1024 * 1024) throw new Error('This evidence packet exceeds 150 MB. Select fewer entries and export separate packets.');
      const digest = await options.sha256(bytes);
      if (!/^[a-f0-9]{64}$/i.test(digest)) throw new Error(`Evidence ${shared.reference} could not be verified. No packet was created.`);
      if (attachment.file_hash && /^[a-f0-9]{64}$/i.test(attachment.file_hash) && attachment.file_hash.toLowerCase() !== digest.toLowerCase()) {
        throw new Error(`Evidence ${shared.reference} does not match its recorded SHA-256 digest. No packet was created.`);
      }
      const file = `evidence/${shared.reference}${EXTENSIONS[attachment.mime_type || ''] || '.bin'}`;
      files[file] = bytes;
      manifest.push({ reference: shared.reference, entryReference: sharedEntry.reference, name: shared.name, file,
        mimeType: shared.mimeType, bytes: bytes.length, sha256: digest.toLowerCase() });
    }
  }
  const pdf = await createTimelinePdf(timeline, options.fonts);
  files['timeline.pdf'] = pdf.bytes;
  files['timeline.json'] = strToU8(JSON.stringify(timeline, null, 2));
  files['evidence-manifest.json'] = strToU8(JSON.stringify({ format: 'family-bench-evidence-v1', generatedAt: timeline.generatedAt, files: manifest }, null, 2));
  files['README.txt'] = strToU8('Family Bench evidence packet\n\nTimeline.pdf and timeline.json contain the same selected factual entries. References such as E001-A001 map to original files in evidence/ and to SHA-256 digests in evidence-manifest.json.\n\nPrivate entries, private notes, raw app metadata, and account details are excluded from the report. Original source files are preserved byte for byte and can contain their own embedded metadata or sensitive content. Review them before sharing.\n\nThis packet is a record of user-provided material, not independent verification or a court filing.\n');
  return { bytes: zipSync(files, { level: 0 }), name: `family-bench-evidence-${timeline.generatedAt.slice(0, 10)}.zip`, mimeType: 'application/zip' };
}
