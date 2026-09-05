import { isCalendarDate, normalizeOptionalTime } from '../utils/dateInput';
import type { EntryTypeValue } from '../case-intelligence/entryTypes';

type Base<K extends string> = { version: 1; kind: K };
export type TypedCaptureDetails =
  | (Base<'pickup_dropoff'> & { scheduledAt: string | null; actualAt: string; exchangeType: 'pickup' | 'dropoff'; transferMethod: 'in_person' | 'school' | 'third_party'; people: string })
  | (Base<'visit_denied'> & { scheduledStartAt: string; scheduledEndAt: string; reason: string; actions: string; witnesses: string })
  | (Base<'expense'> & { amountCents: number; currency: 'USD'; category: string; paidBy: 'me' | 'other_parent' | 'split'; reimbursementRequestedCents: number | null; reimbursementReceivedCents: number | null })
  | (Base<'medical'> & { provider: string; visitType: string; parentNotification: 'both' | 'one' | 'none' | 'unknown'; consent: 'both' | 'me' | 'other_parent' | 'neither' | 'unknown'; nextAppointmentDate: string | null; medications: string })
  | (Base<'message'> & { platform: string; direction: 'sent' | 'received'; correspondent: string; occurredAt: string; replyToEntryId: string | null; tone: string })
  | (Base<'child_statement'> & { quote: string; context: string })
  | Base<'journal' | 'schedule_change' | 'school' | 'court_order' | 'other'>;

export type CaptureDraft = Record<string, string>;
export type CaptureField = { key: string; label: string; required?: boolean; placeholder?: string; multiline?: boolean; options?: readonly string[] };
export const TYPED_CAPTURE_FIELDS: Partial<Record<EntryTypeValue, CaptureField[]>> = {
  pickup_dropoff: [
    { key: 'scheduledAt', label: 'Scheduled date and time (optional)', placeholder: 'YYYY-MM-DD HH:MM' },
    { key: 'exchangeType', label: 'Exchange', options: ['pickup', 'dropoff'], required: true },
    { key: 'transferMethod', label: 'Transfer method', options: ['in_person', 'school', 'third_party'], required: true },
    { key: 'people', label: 'Who picked up and who dropped off?', multiline: true },
  ],
  visit_denied: [
    { key: 'scheduledStartAt', label: 'Scheduled start', placeholder: 'YYYY-MM-DD HH:MM', required: true },
    { key: 'scheduledEndAt', label: 'Scheduled end', placeholder: 'YYYY-MM-DD HH:MM', required: true },
    { key: 'reason', label: 'Reason given, or “No reason given”', required: true, multiline: true },
    { key: 'actions', label: 'Actions you took (optional)', multiline: true },
    { key: 'witnesses', label: 'People who observed it (optional)', multiline: true },
  ],
  expense: [
    { key: 'amount', label: 'Amount (USD)', placeholder: '0.00', required: true },
    { key: 'category', label: 'Expense category', required: true, options: ['medical', 'school', 'childcare', 'activities', 'transport', 'other'] },
    { key: 'paidBy', label: 'Paid by', required: true, options: ['me', 'other_parent', 'split'] },
    { key: 'reimbursementRequested', label: 'Reimbursement requested (USD; optional)', placeholder: '0.00' },
    { key: 'reimbursementReceived', label: 'Reimbursement received (USD; optional)', placeholder: '0.00' },
  ],
  medical: [
    { key: 'provider', label: 'Provider name', required: true },
    { key: 'visitType', label: 'Visit type', required: true, options: ['routine', 'urgent', 'emergency', 'dental', 'therapy', 'specialist', 'other'] },
    { key: 'parentNotification', label: 'Parents notified', required: true, options: ['both', 'one', 'none', 'unknown'] },
    { key: 'consent', label: 'Consent recorded from', required: true, options: ['both', 'me', 'other_parent', 'neither', 'unknown'] },
    { key: 'nextAppointmentDate', label: 'Next appointment date (optional)', placeholder: 'YYYY-MM-DD' },
    { key: 'medications', label: 'Prescription or medication notes (optional)', multiline: true },
  ],
  message: [
    { key: 'platform', label: 'Platform', required: true, options: ['OFW', 'text', 'email', 'WhatsApp', 'phone', 'other'] },
    { key: 'direction', label: 'Direction', required: true, options: ['sent', 'received'] },
    { key: 'correspondent', label: 'Other person in this communication', required: true },
    { key: 'tone', label: 'Your tone description', required: true, options: ['not_assessed', 'normal', 'hostile', 'threatening', 'involves_children', 'other'] },
  ],
  child_statement: [
    { key: 'quote', label: 'Exact words (without added interpretation)', required: true, multiline: true },
    { key: 'context', label: 'What was happening when they said it?', required: true, multiline: true },
  ],
};

export function captureChoiceLabel(value: string): string {
  const labels: Record<string, string> = { me: 'Me', other_parent: 'Other parent', in_person: 'In person', third_party: 'Third party', not_assessed: 'Not assessed', involves_children: 'Involves children', none: 'None', unknown: 'Unknown' };
  return labels[value] ?? `${value[0]?.toUpperCase() ?? ''}${value.slice(1).replaceAll('_', ' ')}`;
}

/** Calendar times without an offset use this device's zone. Reject DST gaps/folds instead of guessing. */
export function recordedInstant(value: string, label = 'Date and time'): string {
  const normalized = value.trim().replace(' ', 'T');
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.exec(normalized);
  if (!match || !isCalendarDate(match[1])) throw new Error(`${label}: use YYYY-MM-DD HH:MM.`);
  normalizeOptionalTime(`${match[2]}:${match[3] ?? '00'}`);
  const offset = match[4];
  if (offset && offset !== 'Z') {
    const h = Number(offset.slice(1, 3)); const m = Number(offset.slice(4));
    if (h > 14 || m > 59 || (h === 14 && m !== 0)) throw new Error(`${label}: the UTC offset is invalid.`);
  }
  const date = new Date(normalized);
  if (!Number.isFinite(date.getTime())) throw new Error(`${label}: enter a real date and time.`);
  if (!offset) {
    const sameLocal = (candidate: Date) => candidate.getFullYear() === Number(match[1].slice(0, 4))
      && candidate.getMonth() + 1 === Number(match[1].slice(5, 7)) && candidate.getDate() === Number(match[1].slice(8))
      && candidate.getHours() === Number(match[2].slice(0, 2)) && candidate.getMinutes() === Number(match[2].slice(3));
    if (!sameLocal(date)) throw new Error(`${label}: this clock time does not exist because the clocks change. Check the time.`);
    if ([-120, -60, -30, 30, 60, 120].some((minutes) => sameLocal(new Date(date.getTime() + minutes * 60_000)))) {
      throw new Error(`${label}: this clock time occurs twice. Add its UTC offset, for example -07:00 or -08:00.`);
    }
  }
  return date.toISOString();
}

export function moneyCents(value: string, label = 'Amount'): number {
  const text = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error(`${label}: enter a non-negative amount with at most two decimal places.`);
  const [whole, fraction = ''] = text.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 999_999_999) throw new Error(`${label}: the amount is too large.`);
  return cents;
}

function text(value: unknown, label: string, required = false): string {
  if (typeof value !== 'string' || value.length > 10_000) throw new Error(`${label}: enter valid text under 10,000 characters.`);
  if (required && !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}
function choice<T extends string>(value: unknown, options: readonly T[], label: string): T {
  if (typeof value !== 'string' || !options.includes(value as T)) throw new Error(`Choose ${label}.`);
  return value as T;
}
function instant(value: unknown, label: string): string {
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error(`${label} must include a recorded time zone.`);
  return recordedInstant(value, label);
}
function cents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 999_999_999) throw new Error('Invalid expense amount.');
  return value;
}

/** Allowlist reconstruction prevents capture details from overwriting protected provenance. */
export function validateTypedCaptureDetails(entryType: string, value: unknown): TypedCaptureDetails {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Capture details are invalid.');
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || v.kind !== entryType) throw new Error('Capture details do not match the entry type.');
  switch (v.kind) {
    case 'pickup_dropoff': return { version: 1, kind: v.kind,
      scheduledAt: v.scheduledAt === null ? null : instant(v.scheduledAt, 'Scheduled time'), actualAt: instant(v.actualAt, 'Actual time'),
      exchangeType: choice(v.exchangeType, ['pickup', 'dropoff'], 'pickup or dropoff'), transferMethod: choice(v.transferMethod, ['in_person', 'school', 'third_party'], 'the transfer method'), people: text(v.people, 'People') };
    case 'visit_denied': {
      const start = instant(v.scheduledStartAt, 'Scheduled start'); const end = instant(v.scheduledEndAt, 'Scheduled end');
      if (Date.parse(end) <= Date.parse(start)) throw new Error('Scheduled end must be after scheduled start.');
      return { version: 1, kind: v.kind, scheduledStartAt: start, scheduledEndAt: end, reason: text(v.reason, 'Reason given', true), actions: text(v.actions, 'Actions'), witnesses: text(v.witnesses, 'Witnesses') };
    }
    case 'expense': {
      const amount = cents(v.amountCents);
      const requested = v.reimbursementRequestedCents === null ? null : cents(v.reimbursementRequestedCents);
      const received = v.reimbursementReceivedCents === null ? null : cents(v.reimbursementReceivedCents);
      if (amount <= 0) throw new Error('Expense amount must be greater than zero.');
      if ((requested !== null && requested > amount) || (received !== null && (received > amount || (requested !== null && received > requested)))) throw new Error('Reimbursement cannot exceed the expense, and received cannot exceed a recorded requested amount.');
      return { version: 1, kind: v.kind, amountCents: amount, currency: choice(v.currency, ['USD'], 'USD'), category: choice(v.category, ['medical', 'school', 'childcare', 'activities', 'transport', 'other'], 'an expense category'), paidBy: choice(v.paidBy, ['me', 'other_parent', 'split'], 'who paid'), reimbursementRequestedCents: requested, reimbursementReceivedCents: received };
    }
    case 'medical': {
      const date = v.nextAppointmentDate === null ? null : text(v.nextAppointmentDate, 'Next appointment');
      if (date !== null && !isCalendarDate(date)) throw new Error('Next appointment: enter a real date in YYYY-MM-DD format.');
      return { version: 1, kind: v.kind, provider: text(v.provider, 'Provider name', true), visitType: choice(v.visitType, ['routine', 'urgent', 'emergency', 'dental', 'therapy', 'specialist', 'other'], 'a visit type'), parentNotification: choice(v.parentNotification, ['both', 'one', 'none', 'unknown'], 'notification status'), consent: choice(v.consent, ['both', 'me', 'other_parent', 'neither', 'unknown'], 'consent status'), nextAppointmentDate: date, medications: text(v.medications, 'Medication notes') };
    }
    case 'message': return { version: 1, kind: v.kind, platform: choice(v.platform, ['OFW', 'text', 'email', 'WhatsApp', 'phone', 'other'], 'a platform'), direction: choice(v.direction, ['sent', 'received'], 'a direction'), correspondent: text(v.correspondent, 'Correspondent', true), occurredAt: instant(v.occurredAt, 'Communication time'), replyToEntryId: v.replyToEntryId === null ? null : text(v.replyToEntryId, 'Reply source', true), tone: choice(v.tone, ['not_assessed', 'normal', 'hostile', 'threatening', 'involves_children', 'other'], 'your tone description') };
    case 'child_statement': return { version: 1, kind: v.kind, quote: text(v.quote, 'Exact words', true), context: text(v.context, 'Context', true) };
    case 'journal': case 'schedule_change': case 'school': case 'court_order': case 'other': return { version: 1, kind: v.kind };
    default: throw new Error('Unsupported capture details.');
  }
}

export function buildTypedCaptureDetails(entryType: EntryTypeValue, draft: CaptureDraft, eventDate: string, eventTime: string): TypedCaptureDetails {
  const v: Record<string, unknown> = { ...draft, version: 1, kind: entryType };
  if (entryType === 'pickup_dropoff') Object.assign(v, { scheduledAt: draft.scheduledAt?.trim() ? recordedInstant(draft.scheduledAt, 'Scheduled time') : null, actualAt: recordedInstant(`${eventDate.trim()}T${eventTime.trim()}`, 'Actual time'), people: draft.people ?? '' });
  if (entryType === 'visit_denied') Object.assign(v, { scheduledStartAt: recordedInstant(draft.scheduledStartAt ?? '', 'Scheduled start'), scheduledEndAt: recordedInstant(draft.scheduledEndAt ?? '', 'Scheduled end'), actions: draft.actions ?? '', witnesses: draft.witnesses ?? '' });
  if (entryType === 'expense') Object.assign(v, { amountCents: moneyCents(draft.amount ?? ''), currency: 'USD', reimbursementRequestedCents: draft.reimbursementRequested?.trim() ? moneyCents(draft.reimbursementRequested, 'Requested reimbursement') : null, reimbursementReceivedCents: draft.reimbursementReceived?.trim() ? moneyCents(draft.reimbursementReceived, 'Received reimbursement') : null });
  if (entryType === 'medical') Object.assign(v, { nextAppointmentDate: draft.nextAppointmentDate?.trim() || null, medications: draft.medications ?? '' });
  if (entryType === 'message') Object.assign(v, { occurredAt: recordedInstant(`${eventDate.trim()}T${eventTime.trim()}`, 'Communication time'), replyToEntryId: draft.replyToEntryId?.trim() || null });
  return validateTypedCaptureDetails(entryType, v);
}

export function formatMoney(cents: number | null): string { return cents === null ? 'Not recorded' : `USD ${(cents / 100).toFixed(2)}`; }
export function typedCaptureSummary(details: TypedCaptureDetails): Array<[string, string]> {
  const time = (value: string) => `${new Date(value).toLocaleString()} (${value})`;
  switch (details.kind) {
    case 'pickup_dropoff': return [['Exchange', captureChoiceLabel(details.exchangeType)], ['Transfer', captureChoiceLabel(details.transferMethod)], ['Scheduled', details.scheduledAt ? time(details.scheduledAt) : 'Not recorded'], ['Actual', time(details.actualAt)], ...(details.people ? [['People', details.people] as [string, string]] : [])];
    case 'visit_denied': return [['Scheduled start', time(details.scheduledStartAt)], ['Scheduled end', time(details.scheduledEndAt)], ['Reason given', details.reason], ['Actions taken', details.actions || 'Not recorded'], ['Witnesses', details.witnesses || 'Not recorded']];
    case 'expense': return [['Amount', formatMoney(details.amountCents)], ['Category', captureChoiceLabel(details.category)], ['Paid by', captureChoiceLabel(details.paidBy)], ['Reimbursement requested', formatMoney(details.reimbursementRequestedCents)], ['Reimbursement received', formatMoney(details.reimbursementReceivedCents)]];
    case 'medical': return [['Provider', details.provider], ['Visit', captureChoiceLabel(details.visitType)], ['Parents notified', captureChoiceLabel(details.parentNotification)], ['Consent recorded', captureChoiceLabel(details.consent)], ['Next appointment', details.nextAppointmentDate || 'Not recorded'], ['Medication notes', details.medications || 'Not recorded']];
    case 'message': return [['Platform', details.platform], ['Direction', captureChoiceLabel(details.direction)], ['Correspondent', details.correspondent], ['Communication time', time(details.occurredAt)], ['Tone (your description)', captureChoiceLabel(details.tone)], ...(details.replyToEntryId ? [['Reply to source entry', details.replyToEntryId] as [string, string]] : [])];
    case 'child_statement': return [['Exact words', `“${details.quote.replace(/^[“"]|[”"]$/g, '')}”`], ['Context', details.context]];
    default: return [];
  }
}
