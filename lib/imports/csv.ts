import { ENTRY_TYPE_OPTIONS, getEntryTypeOption, type EntryTypeValue } from '../case-intelligence/entryTypes';
import { validateTypedCaptureDetails, type TypedCaptureDetails } from '../reporting/capture';
import { isCalendarDate, normalizeOptionalTime } from '../utils/dateInput';
import { MAX_CSV_BYTES, MAX_CSV_RECORDS } from './model';

export const CSV_HEADERS = ['entry_type', 'event_date', 'body', 'event_time', 'title', 'private_notes', 'is_flagged', 'typed_details'] as const;
export type CsvRow = { rowIndex: number; entryType: EntryTypeValue; eventDate: string; eventTime: string | null; title: string; body: string; privateNotes: string | null; isFlagged: boolean; typedDetails?: TypedCaptureDetails };
export type CsvIssue = { rowIndex: number | null; message: string };
export class CsvValidationError extends Error {
  constructor(public issues: CsvIssue[]) { super(issues.map((issue) => `${issue.rowIndex ? `Data row ${issue.rowIndex}: ` : ''}${issue.message}`).join('\n')); this.name = 'CsvValidationError'; }
}

/** Strict decoder also works on native runtimes without a fatal TextDecoder. */
export function decodeCsvUtf8(bytes: Uint8Array): string {
  if (!bytes.length || bytes.length > MAX_CSV_BYTES) throw new Error('Choose a non-empty UTF-8 CSV file no larger than 4 MiB.');
  const parts: string[] = [], points: number[] = [];
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++]; let cp = first, count = 0, min = 0;
    if (first < 0x80) { /* ASCII */ }
    else if (first >= 0xc2 && first <= 0xdf) { cp = first & 31; count = 1; min = 0x80; }
    else if (first >= 0xe0 && first <= 0xef) { cp = first & 15; count = 2; min = 0x800; }
    else if (first >= 0xf0 && first <= 0xf4) { cp = first & 7; count = 3; min = 0x10000; }
    else throw new Error('The CSV is not valid UTF-8. Export it as UTF-8 and select it again.');
    for (let n = 0; n < count; n++) {
      if (i >= bytes.length || (bytes[i] & 0xc0) !== 0x80) throw new Error('The CSV is not valid UTF-8. Export it as UTF-8 and select it again.');
      cp = (cp << 6) | (bytes[i++] & 63);
    }
    if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff) || cp === 0) throw new Error('The CSV contains invalid UTF-8 or a null character.');
    points.push(cp);
    if (points.length === 1024) { parts.push(String.fromCodePoint(...points)); points.length = 0; }
  }
  parts.push(String.fromCodePoint(...points));
  return parts.join('').replace(/^\uFEFF/, '');
}

/** RFC 4180 quoting; CRLF and LF record separators are accepted. Blank records are validated. */
function records(text: string): string[][] {
  const result: string[][] = []; let row: string[] = [], field = '', state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';
  const endField = () => { row.push(field); field = ''; state = 'start'; };
  const endRow = () => { endField(); result.push(row); row = []; if (result.length > MAX_CSV_RECORDS + 1) throw new Error('The CSV has more than 500 data records. Split it into smaller files.'); };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (state === 'quoted') {
      if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else state = 'closed'; }
      else field += char;
      continue;
    }
    if (char === ',') { endField(); continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r') { if (text[i + 1] !== '\n') throw new Error('Use CRLF or LF record separators; a bare carriage return was found.'); i++; }
      endRow(); continue;
    }
    if (state === 'closed') throw new Error(`CSV record ${result.length + 1}: unexpected text after a closing quote.`);
    if (char === '"') { if (state !== 'start') throw new Error(`CSV record ${result.length + 1}: quotes must enclose the entire field.`); state = 'quoted'; }
    else { state = 'plain'; field += char; }
  }
  if (state === 'quoted') throw new Error('The CSV ends inside a quoted field.');
  if (state !== 'start' || field.length || row.length) endRow();
  return result;
}

function typedJson(raw: string, entryType: EntryTypeValue): TypedCaptureDetails {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('typed_details must contain valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('typed_details must be a JSON object.');
  // Scan JSON string tokens, not a regex: escaped quotes inside values are not keys.
  const keys = new Set<string>(); let depth = 0, expectingKey = false;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"') {
      const start = i++;
      for (; i < raw.length; i++) { if (raw[i] === '\\') i++; else if (raw[i] === '"') break; }
      if (depth === 1 && expectingKey) {
        const key = JSON.parse(raw.slice(start, i + 1)) as string;
        if (keys.has(key)) throw new Error(`typed_details repeats the field ${key}.`);
        keys.add(key); expectingKey = false;
      }
    } else if (char === '{' || char === '[') { depth++; if (depth === 1) expectingKey = true; }
    else if (char === '}' || char === ']') depth--;
    else if (char === ',' && depth === 1) expectingKey = true;
  }
  const input = value as Record<string, unknown>;
  if (entryType === 'expense') {
    if (!Object.hasOwn(input, 'reimbursementRequestedCents')) input.reimbursementRequestedCents = null;
    if (!Object.hasOwn(input, 'reimbursementReceivedCents')) input.reimbursementReceivedCents = null;
  }
  const validated = validateTypedCaptureDetails(entryType, input);
  for (const key of keys) if (!Object.hasOwn(validated, key)) throw new Error(`typed_details has an unknown field: ${key}.`);
  if (validated.kind === 'message' && validated.replyToEntryId !== null) throw new Error('CSV message imports cannot link to another entry. Set replyToEntryId to null and review links afterward.');
  return validated;
}

export function parseCsvImport(bytes: Uint8Array): CsvRow[] {
  const all = records(decodeCsvUtf8(bytes));
  if (all.length < 2) throw new Error('The CSV needs a header and at least one data record.');
  const headers = all[0];
  if (new Set(headers).size !== headers.length) throw new Error('The CSV has duplicate headers. Each field may appear once.');
  for (const header of headers) if (!(CSV_HEADERS as readonly string[]).includes(header)) throw new Error(`Unknown CSV header: ${header || '(empty)'}. Use the supplied template headers exactly.`);
  for (const required of ['entry_type', 'event_date', 'body']) if (!headers.includes(required)) throw new Error(`Missing required CSV header: ${required}.`);
  const issues: CsvIssue[] = [], rows: CsvRow[] = [];
  all.slice(1).forEach((fields, i) => {
    const rowIndex = i + 1;
    try {
      if (fields.length !== headers.length) throw new Error(`Expected ${headers.length} fields; found ${fields.length}.`);
      const value = Object.fromEntries(headers.map((key, j) => [key, fields[j]]));
      const entryType = value.entry_type.trim() as EntryTypeValue;
      if (!ENTRY_TYPE_OPTIONS.some((option) => option.value === entryType)) throw new Error('entry_type is not a supported Family Bench type.');
      const eventDate = value.event_date.trim();
      if (!isCalendarDate(eventDate)) throw new Error('event_date must be a real date in YYYY-MM-DD format.');
      if (!value.body.trim()) throw new Error('body is required.');
      const flag = value.is_flagged?.trim() || 'false';
      if (!['true', 'false'].includes(flag)) throw new Error('is_flagged must be true, false, or blank.');
      rows.push({ rowIndex, entryType, eventDate, eventTime: normalizeOptionalTime(value.event_time), title: value.title?.trim() || getEntryTypeOption(entryType).defaultTitle,
        body: value.body.trim(), privateNotes: value.private_notes?.trim() || null, isFlagged: flag === 'true', ...(value.typed_details?.trim() ? { typedDetails: typedJson(value.typed_details, entryType) } : {}) });
    } catch (failure) { issues.push({ rowIndex, message: failure instanceof Error ? failure.message : 'Invalid CSV data.' }); }
  });
  if (issues.length) throw new CsvValidationError(issues);
  return rows;
}

export const CSV_TEMPLATE = 'entry_type,event_date,body,event_time,title,private_notes,is_flagged,typed_details\r\njournal,2026-09-01,"Describe what you directly observed.",14:30,Example factual record,,false,\r\n';
