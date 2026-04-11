import { z } from 'zod';

export const entryTypes = [
  'journal', 'pickup_dropoff', 'visit_denied', 'expense',
  'medical', 'child_statement', 'communication', 'incident',
  'compliance', 'witness',
] as const;

export const custodyPeriods = ['my_time', 'their_time', 'transition', 'neutral'] as const;
export const childMoods = ['great', 'good', 'okay', 'upset', 'distressed'] as const;
export const flagSeverities = ['low', 'medium', 'high', 'emergency'] as const;
export const flagCategories = [
  'late', 'denied_visit', 'safety', 'verbal', 'medical',
  'financial', 'communication', 'substance', 'other',
] as const;

// Base schema for all entry types
export const baseEntrySchema = z.object({
  entry_type: z.enum(entryTypes),
  event_date: z.string().min(1, 'Date is required'),
  event_time: z.string().optional(),
  custody_period: z.enum(custodyPeriods).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  child_mood: z.enum(childMoods).optional(),
  is_flagged: z.boolean().default(false),
  flag_severity: z.enum(flagSeverities).optional(),
  flag_category: z.enum(flagCategories).optional(),
  location_name: z.string().optional(),
  people_present: z.array(z.string()).optional(),
  child_id: z.string().optional(),
});

// Per-type metadata schemas
export const pickupDropoffMetadata = z.object({
  exchange_type: z.enum(['pickup', 'dropoff']).optional(),
  transfer_method: z.enum(['in_person', 'school', 'third_party']).optional(),
  scheduled_time: z.string().optional(),
  actual_time: z.string().optional(),
  late_minutes: z.number().optional(),
  who_picked_up: z.string().optional(),
  who_dropped_off: z.string().optional(),
  child_condition: z.string().optional(),
});

export const visitDeniedMetadata = z.object({
  reason_given: z.string().optional(),
  no_reason: z.boolean().optional(),
  actions_taken: z.array(z.string()).optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  hours_lost: z.number().optional(),
  witnesses: z.array(z.string()).optional(),
});

export const expenseMetadata = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.enum(['medical', 'education', 'extracurricular', 'clothing', 'childcare', 'other']).optional(),
  paid_by: z.enum(['me', 'other_parent', 'split']).optional(),
  reimbursement_requested: z.boolean().optional(),
  reimbursement_received: z.boolean().optional(),
  description: z.string().optional(),
});

export const childStatementMetadata = z.object({
  verbatim_quote: z.string().min(1, 'Quote is required'),
  context: z.string().optional(),
  emotional_state: z.string().optional(),
  ec_1240_classification: z.string().optional(),
});

export const medicalMetadata = z.object({
  provider_name: z.string().optional(),
  visit_type: z.enum(['routine', 'urgent', 'emergency', 'dental', 'therapy']).optional(),
  both_parents_notified: z.boolean().optional(),
  consent_given_by: z.enum(['both', 'me', 'other_parent', 'neither']).optional(),
  diagnosis_notes: z.string().optional(),
  next_appointment: z.string().optional(),
});

export const incidentMetadata = z.object({
  severity: z.enum(flagSeverities).optional(),
  incident_category: z.string().optional(),
  description: z.string().optional(),
  immediate_action: z.string().optional(),
  witnesses: z.array(z.string()).optional(),
  police_report_filed: z.boolean().optional(),
  police_report_number: z.string().optional(),
});

export const communicationMetadata = z.object({
  platform: z.enum(['ofw', 'text', 'email', 'whatsapp', 'phone']).optional(),
  direction: z.enum(['sent', 'received']).optional(),
  response_time_hours: z.number().optional(),
  tone_flags: z.array(z.string()).optional(),
});

export type EntryType = z.infer<typeof baseEntrySchema>['entry_type'];
export type BaseEntry = z.infer<typeof baseEntrySchema>;
export type PickupDropoffMetadata = z.infer<typeof pickupDropoffMetadata>;
export type ExpenseMetadata = z.infer<typeof expenseMetadata>;
export type VisitDeniedMetadata = z.infer<typeof visitDeniedMetadata>;
