import { column, Schema, Table } from '@powersync/common';

// PowerSync schema — mirrors the Supabase tables that need offline access.
// Only tables the app actively reads/writes are synced.
// Reference tables (court_forms, state_configs, etc.) are fetched on-demand.

const profiles = new Table({
  full_name: column.text,
  email: column.text,
  role: column.text,
  state: column.text,
  county: column.text,
  timezone: column.text,
  case_stage: column.text,
  conflict_level: column.text,
  representation_status: column.text,
  notifications_enabled: column.integer, // boolean as 0/1
  onboarding_completed_at: column.text,
});

const cases = new Table({
  user_id: column.text,
  case_number: column.text,
  court_name: column.text,
  department: column.text,
  judge_name: column.text,
  case_type: column.text,
  status: column.text,
});

const children = new Table({
  user_id: column.text,
  name: column.text,
  date_of_birth: column.text,
});

const entries = new Table({
  user_id: column.text,
  case_id: column.text,
  child_id: column.text,
  entry_type: column.text,
  event_date: column.text,
  event_time: column.text,
  custody_period: column.text,
  title: column.text,
  body: column.text,
  child_mood: column.text,
  is_flagged: column.integer,
  flag_severity: column.text,
  flag_category: column.text,
  location_name: column.text,
  location_lat: column.real,
  location_lng: column.real,
  metadata: column.text, // JSONB stored as text in SQLite
  voice_transcript: column.text,
  capture_method: column.text,
  content_hash: column.text,
  is_edited: column.integer,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const attachments = new Table({
  user_id: column.text,
  entry_id: column.text,
  file_name: column.text,
  file_type: column.text,
  storage_path: column.text,
  thumbnail_path: column.text,
  description: column.text,
  is_receipt: column.integer,
  file_hash: column.text,
  created_at: column.text,
});

const court_orders = new Table({
  user_id: column.text,
  case_id: column.text,
  order_date: column.text,
  order_title: column.text,
  order_type: column.text,
  provisions: column.text, // JSONB as text
});

const compliance_checks = new Table({
  user_id: column.text,
  court_order_id: column.text,
  entry_id: column.text,
  provision_id: column.text,
  check_date: column.text,
  is_compliant: column.integer,
  notes: column.text,
});

const key_dates = new Table({
  user_id: column.text,
  case_id: column.text,
  date_type: column.text,
  event_date: column.text,
  event_time: column.text,
  title: column.text,
  description: column.text,
  is_completed: column.integer,
});

const reports = new Table({
  user_id: column.text,
  case_id: column.text,
  document_category: column.text,
  report_type: column.text,
  title: column.text,
  date_range_start: column.text,
  date_range_end: column.text,
  pdf_storage_path: column.text,
  generated_at: column.text,
});

export const AppSchema = new Schema({
  profiles,
  cases,
  children,
  entries,
  attachments,
  court_orders,
  compliance_checks,
  key_dates,
  reports,
});
