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
  title: column.text,
  case_number: column.text,
  court_name: column.text,
  department: column.text,
  judge_name: column.text,
  case_type: column.text,
  status: column.text,
  county: column.text,
  state: column.text,
  is_active: column.integer,
  next_hearing_at: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const children = new Table({
  user_id: column.text,
  case_id: column.text,
  name: column.text,
  date_of_birth: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const people = new Table({
  user_id: column.text,
  case_id: column.text,
  display_name: column.text,
  role: column.text,
  relationship: column.text,
  email: column.text,
  phone: column.text,
  is_primary_client: column.integer,
  notes: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const entries = new Table({
  user_id: column.text,
  case_id: column.text,
  child_id: column.text,
  entry_type: column.text,
  event_date: column.text,
  event_time: column.text,
  event_end_time: column.text,
  custody_period: column.text,
  title: column.text,
  body: column.text,
  child_mood: column.text,
  is_flagged: column.integer,
  flag_severity: column.text,
  flag_category: column.text,
  issue_key: column.text,
  location_name: column.text,
  location_lat: column.real,
  location_lng: column.real,
  metadata: column.text, // JSONB stored as text in SQLite
  voice_transcript: column.text,
  capture_method: column.text,
  content_hash: column.text,
  is_edited: column.integer,
  private_notes: column.text,
  court_ready_summary: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const attachments = new Table({
  user_id: column.text,
  case_id: column.text,
  entry_id: column.text,
  file_name: column.text,
  file_type: column.text,
  mime_type: column.text,
  file_size_bytes: column.integer,
  storage_path: column.text,
  thumbnail_path: column.text,
  description: column.text,
  is_receipt: column.integer,
  file_hash: column.text,
  hash_algorithm: column.text,
  captured_at: column.text,
  source_device: column.text,
  exif: column.text,
  created_at: column.text,
  deleted_at: column.text,
});

const court_orders = new Table({
  user_id: column.text,
  case_id: column.text,
  order_date: column.text,
  order_title: column.text,
  order_type: column.text,
  source_attachment_id: column.text,
  provisions: column.text, // JSONB as text
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const court_order_provisions = new Table({
  user_id: column.text,
  case_id: column.text,
  court_order_id: column.text,
  provision_key: column.text,
  category: column.text,
  label: column.text,
  body: column.text,
  effective_date: column.text,
  end_date: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
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
  related_filing_package_id: column.text,
  related_court_order_id: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const filing_packages = new Table({
  user_id: column.text,
  case_id: column.text,
  title: column.text,
  filing_type: column.text,
  status: column.text,
  due_date: column.text,
  completion_percent: column.integer,
  court_ready_summary: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const pattern_tags = new Table({
  user_id: column.text,
  case_id: column.text,
  issue_key: column.text,
  label: column.text,
  severity: column.text,
  description: column.text,
  source_entry_ids: column.text,
  first_seen_on: column.text,
  last_seen_on: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const advisor_threads = new Table({
  user_id: column.text,
  case_id: column.text,
  title: column.text,
  topic: column.text,
  scope: column.text,
  status: column.text,
  last_message_at: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const ai_outputs = new Table({
  user_id: column.text,
  case_id: column.text,
  advisor_thread_id: column.text,
  output_type: column.text,
  status: column.text,
  prompt_key: column.text,
  model_name: column.text,
  title: column.text,
  summary: column.text,
  structured_output: column.text,
  grounding_notes: column.text,
  created_at: column.text,
  updated_at: column.text,
  deleted_at: column.text,
});

const entry_children = new Table({
  user_id: column.text,
  case_id: column.text,
  entry_id: column.text,
  child_id: column.text,
  created_at: column.text,
});

const entry_people = new Table({
  user_id: column.text,
  case_id: column.text,
  entry_id: column.text,
  person_id: column.text,
  role: column.text,
  created_at: column.text,
});

const entry_court_order_provisions = new Table({
  user_id: column.text,
  case_id: column.text,
  entry_id: column.text,
  provision_id: column.text,
  relevance: column.text,
  created_at: column.text,
});

const filing_package_entries = new Table({
  user_id: column.text,
  case_id: column.text,
  filing_package_id: column.text,
  entry_id: column.text,
  created_at: column.text,
});

const filing_package_attachments = new Table({
  user_id: column.text,
  case_id: column.text,
  filing_package_id: column.text,
  attachment_id: column.text,
  created_at: column.text,
});

const ai_output_sources = new Table({
  user_id: column.text,
  case_id: column.text,
  ai_output_id: column.text,
  entry_id: column.text,
  attachment_id: column.text,
  court_order_provision_id: column.text,
  citation_label: column.text,
  created_at: column.text,
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
  people,
  entries,
  attachments,
  court_orders,
  court_order_provisions,
  compliance_checks,
  entry_children,
  entry_people,
  entry_court_order_provisions,
  filing_packages,
  filing_package_entries,
  filing_package_attachments,
  key_dates,
  pattern_tags,
  advisor_threads,
  ai_outputs,
  ai_output_sources,
  reports,
});
