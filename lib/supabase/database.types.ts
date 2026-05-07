export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: never[];
};

type Timestamp = string;
type DateString = string;

type CaseRow = {
  id: string;
  user_id: string;
  title: string | null;
  case_number: string | null;
  court_name: string | null;
  department: string | null;
  judge_name: string | null;
  case_type: string | null;
  status: string;
  county: string | null;
  state: string | null;
  is_active: boolean;
  next_hearing_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type ChildRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  name: string;
  date_of_birth: DateString | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type PersonRow = {
  id: string;
  user_id: string;
  case_id: string;
  display_name: string;
  role: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  is_primary_client: boolean;
  notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type EntryRow = {
  id: string;
  user_id: string;
  case_id: string;
  child_id: string | null;
  entry_type: string;
  event_date: DateString;
  event_time: string | null;
  event_end_time: string | null;
  custody_period: string | null;
  title: string | null;
  body: string | null;
  child_mood: string | null;
  is_flagged: boolean;
  flag_severity: string | null;
  flag_category: string | null;
  issue_key: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  metadata: Json;
  voice_transcript: string | null;
  capture_method: string | null;
  content_hash: string | null;
  is_edited: boolean;
  private_notes: string | null;
  court_ready_summary: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type AttachmentRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  entry_id: string | null;
  file_name: string;
  file_type: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  description: string | null;
  is_receipt: boolean;
  file_hash: string | null;
  hash_algorithm: string;
  captured_at: Timestamp | null;
  source_device: string | null;
  exif: Json;
  created_at: Timestamp;
  deleted_at: Timestamp | null;
};

type CourtOrderRow = {
  id: string;
  user_id: string;
  case_id: string;
  order_date: DateString | null;
  order_title: string;
  order_type: string | null;
  source_attachment_id: string | null;
  provisions: Json;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type CourtOrderProvisionRow = {
  id: string;
  user_id: string;
  case_id: string;
  court_order_id: string;
  provision_key: string | null;
  category: string | null;
  label: string;
  body: string;
  effective_date: DateString | null;
  end_date: DateString | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type FilingPackageRow = {
  id: string;
  user_id: string;
  case_id: string;
  title: string;
  filing_type: string;
  status: string;
  due_date: DateString | null;
  completion_percent: number;
  court_ready_summary: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type KeyDateRow = {
  id: string;
  user_id: string;
  case_id: string;
  date_type: string;
  event_date: DateString;
  event_time: string | null;
  title: string;
  description: string | null;
  is_completed: boolean;
  related_filing_package_id: string | null;
  related_court_order_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type PatternTagRow = {
  id: string;
  user_id: string;
  case_id: string;
  issue_key: string;
  label: string;
  severity: string | null;
  description: string | null;
  source_entry_ids: string[];
  first_seen_on: DateString | null;
  last_seen_on: DateString | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type AdvisorThreadRow = {
  id: string;
  user_id: string;
  case_id: string;
  title: string;
  topic: string | null;
  scope: string | null;
  status: string;
  last_message_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type AIOutputRow = {
  id: string;
  user_id: string;
  case_id: string;
  advisor_thread_id: string | null;
  output_type: string;
  status: string;
  prompt_key: string | null;
  model_name: string | null;
  title: string | null;
  summary: string | null;
  structured_output: Json;
  grounding_notes: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
};

type UserJoinRow = {
  user_id: string;
  case_id: string;
  created_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      cases: TableDefinition<CaseRow>;
      children: TableDefinition<ChildRow>;
      people: TableDefinition<PersonRow>;
      entries: TableDefinition<EntryRow>;
      attachments: TableDefinition<AttachmentRow>;
      court_orders: TableDefinition<CourtOrderRow>;
      court_order_provisions: TableDefinition<CourtOrderProvisionRow>;
      entry_children: TableDefinition<UserJoinRow & { entry_id: string; child_id: string }>;
      entry_people: TableDefinition<UserJoinRow & { entry_id: string; person_id: string; role: string | null }>;
      entry_court_order_provisions: TableDefinition<
        UserJoinRow & { entry_id: string; provision_id: string; relevance: string | null }
      >;
      filing_packages: TableDefinition<FilingPackageRow>;
      filing_package_entries: TableDefinition<UserJoinRow & { filing_package_id: string; entry_id: string }>;
      filing_package_attachments: TableDefinition<UserJoinRow & { filing_package_id: string; attachment_id: string }>;
      key_dates: TableDefinition<KeyDateRow>;
      pattern_tags: TableDefinition<PatternTagRow>;
      advisor_threads: TableDefinition<AdvisorThreadRow>;
      ai_outputs: TableDefinition<AIOutputRow>;
      ai_output_sources: TableDefinition<
        UserJoinRow & {
          id: string;
          ai_output_id: string;
          entry_id: string | null;
          attachment_id: string | null;
          court_order_provision_id: string | null;
          citation_label: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row'];

export type TablesInsert<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Insert'];

export type TablesUpdate<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Update'];
