import { ENTRY_TYPE_OPTIONS } from '../case-intelligence/entryTypes';
import type { TypedCaptureDetails } from '../reporting/capture';

/** Concrete, validator-checked examples for the optional typed_details CSV cell. */
export const CSV_TYPED_EXAMPLES: TypedCaptureDetails[] = [
  { version: 1, kind: 'pickup_dropoff', scheduledAt: null, actualAt: '2026-09-01T14:30:00-07:00', exchangeType: 'pickup', transferMethod: 'in_person', people: '' },
  { version: 1, kind: 'visit_denied', scheduledStartAt: '2026-09-01T14:30:00-07:00', scheduledEndAt: '2026-09-01T16:30:00-07:00', reason: 'No reason given', actions: '', witnesses: '' },
  { version: 1, kind: 'expense', amountCents: 1200, currency: 'USD', category: 'school', paidBy: 'me', reimbursementRequestedCents: null, reimbursementReceivedCents: null },
  { version: 1, kind: 'medical', provider: 'Example provider', visitType: 'routine', parentNotification: 'unknown', consent: 'unknown', nextAppointmentDate: null, medications: '' },
  { version: 1, kind: 'message', platform: 'email', direction: 'received', correspondent: 'Other parent', occurredAt: '2026-09-01T14:30:00-07:00', replyToEntryId: null, tone: 'not_assessed' },
  { version: 1, kind: 'child_statement', quote: 'Exact words here', context: 'Describe what was happening' },
  ...(['journal', 'schedule_change', 'school', 'court_order', 'other'] as const).map((kind) => ({ version: 1 as const, kind })),
];

export const CSV_FIELD_GUIDE = `Family Bench CSV import — version 1

Use a UTF-8 .csv file. Maximum: 4 MiB and 500 data records, plus the header.
Required headers: entry_type,event_date,body
Optional headers: event_time,title,private_notes,is_flagged,typed_details
Do not add other headers or duplicate any header. Header spelling is exact.
Supported entry_type values: ${ENTRY_TYPE_OPTIONS.map((option) => option.value).join(', ')}.

event_date: a real YYYY-MM-DD date. event_time: blank, HH:MM, or HH:MM:SS (24-hour).
body: required factual text. title: optional; blank uses the entry type's default title.
private_notes: optional. is_flagged: true, false, or blank (false).
Leading/trailing field whitespace is normalized; original source bytes are preserved.
Surround fields containing commas, quotes, or newlines with double quotes. Double every quote inside a quoted field. LF and CRLF record endings are supported.

The complete original CSV is permanently private because it may contain private notes. New rows are private until individually reviewed. One explicit child or whole-case scope applies to every row. There is no automatic provider mapping or downloading of links/embedded files.

typed_details may be blank. If present, use a JSON object with version:1 and kind equal to entry_type. Every field in the relevant example below is required unless specifically described otherwise. Unknown and duplicate JSON fields are rejected. JSON null is different from an empty string or the string "null".

Recorded timestamps in typed details must include Z or an explicit UTC offset. Do not invent times that were not recorded. If a required structured detail is unknown, leave the entire typed_details cell blank and explain the known facts in body.
Expense amounts use integer USD cents (1200 = $12.00), must be positive, and cannot exceed 999999999. Reimbursement amounts may be omitted or null when unknown; 0 means a known zero. They cannot exceed the expense, and received cannot exceed a recorded requested amount.
Message replyToEntryId must be null; select entry links after import.

Allowed choices:
pickup_dropoff.exchangeType: pickup, dropoff
pickup_dropoff.transferMethod: in_person, school, third_party
expense.category: medical, school, childcare, activities, transport, other
expense.paidBy: me, other_parent, split
medical.visitType: routine, urgent, emergency, dental, therapy, specialist, other
medical.parentNotification: both, one, none, unknown
medical.consent: both, me, other_parent, neither, unknown
message.platform: OFW, text, email, WhatsApp, phone, other
message.direction: sent, received
message.tone: not_assessed, normal, hostile, threatening, involves_children, other

Examples (replace invented values with your own records; a spreadsheet CSV export will escape the JSON cell):
${CSV_TYPED_EXAMPLES.map((example) => `${example.kind}\n${JSON.stringify(example)}`).join('\n\n')}

Exact duplicates are compared only among CSV imports in the same account, case, and child scope. Matches retain later edits/review decisions. The source is kept even if every row is a duplicate. Import saves one record at a time; failures can leave a partial import. Choose the same original bytes and scope to resume. A different file encoding changes the source identity. Original files are never overwritten.
`;
