export type EntryTypeValue =
  | 'journal'
  | 'pickup_dropoff'
  | 'visit_denied'
  | 'child_statement'
  | 'expense'
  | 'message'
  | 'schedule_change'
  | 'medical'
  | 'school'
  | 'court_order'
  | 'other';

export type EntryTypeOption = {
  value: EntryTypeValue;
  label: string;
  shortLabel: string;
  body: string;
  defaultTitle: string;
  issueKey: string;
  icon: string;
  tone: 'ink' | 'ox' | 'sand' | 'forest' | 'amber' | 'mute';
};

export const ENTRY_TYPE_OPTIONS = [
  {
    value: 'journal',
    label: 'Journal',
    shortLabel: 'Journal',
    body: 'A factual note for the case record.',
    defaultTitle: 'Journal entry recorded',
    issueKey: 'general',
    icon: 'doc',
    tone: 'mute',
  },
  {
    value: 'pickup_dropoff',
    label: 'Exchange',
    shortLabel: 'Exchange',
    body: 'Pickup, dropoff, timing, and location notes.',
    defaultTitle: 'Exchange recorded',
    issueKey: 'exchanges',
    icon: 'home',
    tone: 'forest',
  },
  {
    value: 'visit_denied',
    label: 'Parenting time did not happen',
    shortLabel: 'Missed time',
    body: 'A scheduled visit or exchange did not occur.',
    defaultTitle: 'Scheduled parenting time did not happen',
    issueKey: 'missed_exchanges',
    icon: 'x',
    tone: 'ox',
  },
  {
    value: 'child_statement',
    label: 'Child statement',
    shortLabel: 'Statement',
    body: 'Something a child said that may matter later.',
    defaultTitle: 'Child statement recorded',
    issueKey: 'child_statements',
    icon: 'chat',
    tone: 'sand',
  },
  {
    value: 'expense',
    label: 'Expense',
    shortLabel: 'Expense',
    body: 'Costs, reimbursements, receipts, or payment notes.',
    defaultTitle: 'Expense recorded',
    issueKey: 'expenses',
    icon: 'receipt',
    tone: 'amber',
  },
  {
    value: 'message',
    label: 'Message',
    shortLabel: 'Message',
    body: 'Text, email, app message, or call summary.',
    defaultTitle: 'Communication recorded',
    issueKey: 'communications',
    icon: 'chat',
    tone: 'ink',
  },
  {
    value: 'schedule_change',
    label: 'Schedule change',
    shortLabel: 'Schedule',
    body: 'A requested or agreed change to parenting time.',
    defaultTitle: 'Schedule change recorded',
    issueKey: 'schedule_changes',
    icon: 'clock',
    tone: 'forest',
  },
  {
    value: 'medical',
    label: 'Medical',
    shortLabel: 'Medical',
    body: 'Appointments, medication, symptoms, or health records.',
    defaultTitle: 'Medical note recorded',
    issueKey: 'medical',
    icon: 'shield',
    tone: 'forest',
  },
  {
    value: 'school',
    label: 'School',
    shortLabel: 'School',
    body: 'Attendance, teacher notes, school events, or records.',
    defaultTitle: 'School note recorded',
    issueKey: 'school',
    icon: 'doc',
    tone: 'sand',
  },
  {
    value: 'court_order',
    label: 'Court order',
    shortLabel: 'Order',
    body: 'A provision, deadline, or order-related observation.',
    defaultTitle: 'Court order note recorded',
    issueKey: 'court_orders',
    icon: 'scales',
    tone: 'ink',
  },
  {
    value: 'other',
    label: 'Other',
    shortLabel: 'Other',
    body: 'Anything that belongs in the case record.',
    defaultTitle: 'Case note recorded',
    issueKey: 'general',
    icon: 'flag',
    tone: 'mute',
  },
] as const satisfies readonly EntryTypeOption[];

export type EntryTypeFilterValue = EntryTypeValue | 'all';

export function getEntryTypeOption(entryType?: string | null): EntryTypeOption {
  return (
    ENTRY_TYPE_OPTIONS.find((option) => option.value === entryType) ??
    ENTRY_TYPE_OPTIONS[ENTRY_TYPE_OPTIONS.length - 1]
  );
}
