create extension if not exists pgcrypto;

-- Core tables already represented in PowerSync are created only when missing,
-- then lightly enriched for case-intelligence queries.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  case_number text,
  court_name text,
  department text,
  judge_name text,
  case_type text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.cases add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.cases add column if not exists title text;
alter table public.cases add column if not exists case_number text;
alter table public.cases add column if not exists court_name text;
alter table public.cases add column if not exists department text;
alter table public.cases add column if not exists judge_name text;
alter table public.cases add column if not exists case_type text;
alter table public.cases add column if not exists status text not null default 'active';
alter table public.cases add column if not exists county text;
alter table public.cases add column if not exists state text;
alter table public.cases add column if not exists is_active boolean not null default true;
alter table public.cases add column if not exists next_hearing_at timestamptz;
alter table public.cases add column if not exists created_at timestamptz not null default now();
alter table public.cases add column if not exists updated_at timestamptz not null default now();
alter table public.cases add column if not exists deleted_at timestamptz;

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  name text not null,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.children add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.children add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.children add column if not exists name text;
alter table public.children add column if not exists date_of_birth date;
alter table public.children add column if not exists created_at timestamptz not null default now();
alter table public.children add column if not exists updated_at timestamptz not null default now();
alter table public.children add column if not exists deleted_at timestamptz;

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  display_name text not null,
  role text not null,
  relationship text,
  email text,
  phone text,
  is_primary_client boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.people add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.people add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.people add column if not exists display_name text;
alter table public.people add column if not exists role text;
alter table public.people add column if not exists relationship text;
alter table public.people add column if not exists email text;
alter table public.people add column if not exists phone text;
alter table public.people add column if not exists is_primary_client boolean not null default false;
alter table public.people add column if not exists notes text;
alter table public.people add column if not exists created_at timestamptz not null default now();
alter table public.people add column if not exists updated_at timestamptz not null default now();
alter table public.people add column if not exists deleted_at timestamptz;

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  child_id uuid references public.children(id) on delete set null,
  entry_type text not null,
  event_date date not null,
  event_time time,
  custody_period text,
  title text,
  body text,
  child_mood text,
  is_flagged boolean not null default false,
  flag_severity text,
  flag_category text,
  issue_key text,
  location_name text,
  location_lat double precision,
  location_lng double precision,
  metadata jsonb not null default '{}'::jsonb,
  voice_transcript text,
  capture_method text,
  content_hash text,
  is_edited boolean not null default false,
  private_notes text,
  court_ready_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.entries add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.entries add column if not exists child_id uuid references public.children(id) on delete set null;
alter table public.entries add column if not exists entry_type text;
alter table public.entries add column if not exists event_date date;
alter table public.entries add column if not exists event_time time;
alter table public.entries add column if not exists custody_period text;
alter table public.entries add column if not exists title text;
alter table public.entries add column if not exists body text;
alter table public.entries add column if not exists child_mood text;
alter table public.entries add column if not exists is_flagged boolean not null default false;
alter table public.entries add column if not exists flag_severity text;
alter table public.entries add column if not exists flag_category text;
alter table public.entries add column if not exists issue_key text;
alter table public.entries add column if not exists location_name text;
alter table public.entries add column if not exists location_lat double precision;
alter table public.entries add column if not exists location_lng double precision;
alter table public.entries add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.entries add column if not exists voice_transcript text;
alter table public.entries add column if not exists capture_method text;
alter table public.entries add column if not exists content_hash text;
alter table public.entries add column if not exists is_edited boolean not null default false;
alter table public.entries add column if not exists private_notes text;
alter table public.entries add column if not exists court_ready_summary text;
alter table public.entries add column if not exists event_end_time time;
alter table public.entries add column if not exists created_at timestamptz not null default now();
alter table public.entries add column if not exists updated_at timestamptz not null default now();
alter table public.entries add column if not exists deleted_at timestamptz;

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete set null,
  file_name text not null,
  file_type text,
  mime_type text,
  file_size_bytes bigint,
  storage_bucket text,
  storage_path text not null,
  thumbnail_path text,
  description text,
  is_receipt boolean not null default false,
  file_hash text,
  hash_algorithm text not null default 'sha256',
  captured_at timestamptz,
  source_device text,
  exif jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.attachments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.attachments add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.attachments add column if not exists entry_id uuid references public.entries(id) on delete set null;
alter table public.attachments add column if not exists file_name text;
alter table public.attachments add column if not exists file_type text;
alter table public.attachments add column if not exists mime_type text;
alter table public.attachments add column if not exists file_size_bytes bigint;
alter table public.attachments add column if not exists storage_bucket text;
alter table public.attachments add column if not exists storage_path text;
alter table public.attachments add column if not exists thumbnail_path text;
alter table public.attachments add column if not exists description text;
alter table public.attachments add column if not exists is_receipt boolean not null default false;
alter table public.attachments add column if not exists file_hash text;
alter table public.attachments add column if not exists hash_algorithm text not null default 'sha256';
alter table public.attachments add column if not exists captured_at timestamptz;
alter table public.attachments add column if not exists source_device text;
alter table public.attachments add column if not exists exif jsonb not null default '{}'::jsonb;
alter table public.attachments add column if not exists created_at timestamptz not null default now();
alter table public.attachments add column if not exists deleted_at timestamptz;

create table if not exists public.court_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  order_date date,
  order_title text not null,
  order_type text,
  source_attachment_id uuid references public.attachments(id) on delete set null,
  provisions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.court_orders add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.court_orders add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.court_orders add column if not exists order_date date;
alter table public.court_orders add column if not exists order_title text;
alter table public.court_orders add column if not exists order_type text;
alter table public.court_orders add column if not exists source_attachment_id uuid references public.attachments(id) on delete set null;
alter table public.court_orders add column if not exists provisions jsonb not null default '[]'::jsonb;
alter table public.court_orders add column if not exists created_at timestamptz not null default now();
alter table public.court_orders add column if not exists updated_at timestamptz not null default now();
alter table public.court_orders add column if not exists deleted_at timestamptz;

create table if not exists public.court_order_provisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  court_order_id uuid not null references public.court_orders(id) on delete cascade,
  provision_key text,
  category text,
  label text not null,
  body text not null,
  effective_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.court_order_provisions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.court_order_provisions add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.court_order_provisions add column if not exists court_order_id uuid references public.court_orders(id) on delete cascade;
alter table public.court_order_provisions add column if not exists provision_key text;
alter table public.court_order_provisions add column if not exists category text;
alter table public.court_order_provisions add column if not exists label text;
alter table public.court_order_provisions add column if not exists body text;
alter table public.court_order_provisions add column if not exists effective_date date;
alter table public.court_order_provisions add column if not exists end_date date;
alter table public.court_order_provisions add column if not exists created_at timestamptz not null default now();
alter table public.court_order_provisions add column if not exists updated_at timestamptz not null default now();
alter table public.court_order_provisions add column if not exists deleted_at timestamptz;

create table if not exists public.entry_children (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, child_id)
);

alter table public.entry_children add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.entry_children add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.entry_children add column if not exists entry_id uuid references public.entries(id) on delete cascade;
alter table public.entry_children add column if not exists child_id uuid references public.children(id) on delete cascade;
alter table public.entry_children add column if not exists created_at timestamptz not null default now();

create table if not exists public.entry_people (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  primary key (entry_id, person_id)
);

alter table public.entry_people add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.entry_people add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.entry_people add column if not exists entry_id uuid references public.entries(id) on delete cascade;
alter table public.entry_people add column if not exists person_id uuid references public.people(id) on delete cascade;
alter table public.entry_people add column if not exists role text;
alter table public.entry_people add column if not exists created_at timestamptz not null default now();

create table if not exists public.entry_court_order_provisions (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  provision_id uuid not null references public.court_order_provisions(id) on delete cascade,
  relevance text,
  created_at timestamptz not null default now(),
  primary key (entry_id, provision_id)
);

alter table public.entry_court_order_provisions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.entry_court_order_provisions add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.entry_court_order_provisions add column if not exists entry_id uuid references public.entries(id) on delete cascade;
alter table public.entry_court_order_provisions add column if not exists provision_id uuid references public.court_order_provisions(id) on delete cascade;
alter table public.entry_court_order_provisions add column if not exists relevance text;
alter table public.entry_court_order_provisions add column if not exists created_at timestamptz not null default now();

create table if not exists public.filing_packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  filing_type text not null,
  status text not null default 'draft',
  due_date date,
  completion_percent integer not null default 0 check (completion_percent >= 0 and completion_percent <= 100),
  court_ready_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.filing_packages add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.filing_packages add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.filing_packages add column if not exists title text;
alter table public.filing_packages add column if not exists filing_type text;
alter table public.filing_packages add column if not exists status text not null default 'draft';
alter table public.filing_packages add column if not exists due_date date;
alter table public.filing_packages add column if not exists completion_percent integer not null default 0 check (completion_percent >= 0 and completion_percent <= 100);
alter table public.filing_packages add column if not exists court_ready_summary text;
alter table public.filing_packages add column if not exists created_at timestamptz not null default now();
alter table public.filing_packages add column if not exists updated_at timestamptz not null default now();
alter table public.filing_packages add column if not exists deleted_at timestamptz;

create table if not exists public.filing_package_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  filing_package_id uuid not null references public.filing_packages(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (filing_package_id, entry_id)
);

alter table public.filing_package_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.filing_package_entries add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.filing_package_entries add column if not exists filing_package_id uuid references public.filing_packages(id) on delete cascade;
alter table public.filing_package_entries add column if not exists entry_id uuid references public.entries(id) on delete cascade;
alter table public.filing_package_entries add column if not exists created_at timestamptz not null default now();

create table if not exists public.filing_package_attachments (
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  filing_package_id uuid not null references public.filing_packages(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (filing_package_id, attachment_id)
);

alter table public.filing_package_attachments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.filing_package_attachments add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.filing_package_attachments add column if not exists filing_package_id uuid references public.filing_packages(id) on delete cascade;
alter table public.filing_package_attachments add column if not exists attachment_id uuid references public.attachments(id) on delete cascade;
alter table public.filing_package_attachments add column if not exists created_at timestamptz not null default now();

create table if not exists public.key_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  date_type text not null,
  event_date date not null,
  event_time time,
  title text not null,
  description text,
  is_completed boolean not null default false,
  related_filing_package_id uuid references public.filing_packages(id) on delete set null,
  related_court_order_id uuid references public.court_orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.key_dates add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.key_dates add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.key_dates add column if not exists date_type text;
alter table public.key_dates add column if not exists event_date date;
alter table public.key_dates add column if not exists event_time time;
alter table public.key_dates add column if not exists title text;
alter table public.key_dates add column if not exists description text;
alter table public.key_dates add column if not exists is_completed boolean not null default false;
alter table public.key_dates add column if not exists related_filing_package_id uuid references public.filing_packages(id) on delete set null;
alter table public.key_dates add column if not exists related_court_order_id uuid references public.court_orders(id) on delete set null;
alter table public.key_dates add column if not exists created_at timestamptz not null default now();
alter table public.key_dates add column if not exists updated_at timestamptz not null default now();
alter table public.key_dates add column if not exists deleted_at timestamptz;

create table if not exists public.pattern_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  issue_key text not null,
  label text not null,
  severity text,
  description text,
  source_entry_ids uuid[] not null default '{}'::uuid[],
  first_seen_on date,
  last_seen_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.pattern_tags add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.pattern_tags add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.pattern_tags add column if not exists issue_key text;
alter table public.pattern_tags add column if not exists label text;
alter table public.pattern_tags add column if not exists severity text;
alter table public.pattern_tags add column if not exists description text;
alter table public.pattern_tags add column if not exists source_entry_ids uuid[] not null default '{}'::uuid[];
alter table public.pattern_tags add column if not exists first_seen_on date;
alter table public.pattern_tags add column if not exists last_seen_on date;
alter table public.pattern_tags add column if not exists created_at timestamptz not null default now();
alter table public.pattern_tags add column if not exists updated_at timestamptz not null default now();
alter table public.pattern_tags add column if not exists deleted_at timestamptz;

create table if not exists public.advisor_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  title text not null,
  topic text,
  scope text,
  status text not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.advisor_threads add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.advisor_threads add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.advisor_threads add column if not exists title text;
alter table public.advisor_threads add column if not exists topic text;
alter table public.advisor_threads add column if not exists scope text;
alter table public.advisor_threads add column if not exists status text not null default 'open';
alter table public.advisor_threads add column if not exists last_message_at timestamptz;
alter table public.advisor_threads add column if not exists created_at timestamptz not null default now();
alter table public.advisor_threads add column if not exists updated_at timestamptz not null default now();
alter table public.advisor_threads add column if not exists deleted_at timestamptz;

create table if not exists public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  advisor_thread_id uuid references public.advisor_threads(id) on delete set null,
  output_type text not null,
  status text not null default 'draft',
  prompt_key text,
  model_name text,
  title text,
  summary text,
  structured_output jsonb not null default '{}'::jsonb,
  grounding_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.ai_outputs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.ai_outputs add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.ai_outputs add column if not exists advisor_thread_id uuid references public.advisor_threads(id) on delete set null;
alter table public.ai_outputs add column if not exists output_type text;
alter table public.ai_outputs add column if not exists status text not null default 'draft';
alter table public.ai_outputs add column if not exists prompt_key text;
alter table public.ai_outputs add column if not exists model_name text;
alter table public.ai_outputs add column if not exists title text;
alter table public.ai_outputs add column if not exists summary text;
alter table public.ai_outputs add column if not exists structured_output jsonb not null default '{}'::jsonb;
alter table public.ai_outputs add column if not exists grounding_notes text;
alter table public.ai_outputs add column if not exists created_at timestamptz not null default now();
alter table public.ai_outputs add column if not exists updated_at timestamptz not null default now();
alter table public.ai_outputs add column if not exists deleted_at timestamptz;

create table if not exists public.ai_output_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  ai_output_id uuid not null references public.ai_outputs(id) on delete cascade,
  entry_id uuid references public.entries(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete cascade,
  court_order_provision_id uuid references public.court_order_provisions(id) on delete cascade,
  citation_label text,
  created_at timestamptz not null default now(),
  check (entry_id is not null or attachment_id is not null or court_order_provision_id is not null)
);

alter table public.ai_output_sources add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.ai_output_sources add column if not exists case_id uuid references public.cases(id) on delete cascade;
alter table public.ai_output_sources add column if not exists ai_output_id uuid references public.ai_outputs(id) on delete cascade;
alter table public.ai_output_sources add column if not exists entry_id uuid references public.entries(id) on delete cascade;
alter table public.ai_output_sources add column if not exists attachment_id uuid references public.attachments(id) on delete cascade;
alter table public.ai_output_sources add column if not exists court_order_provision_id uuid references public.court_order_provisions(id) on delete cascade;
alter table public.ai_output_sources add column if not exists citation_label text;
alter table public.ai_output_sources add column if not exists created_at timestamptz not null default now();

create index if not exists cases_user_active_idx on public.cases(user_id, is_active, deleted_at);
create index if not exists children_case_idx on public.children(case_id, deleted_at);
create index if not exists people_case_idx on public.people(case_id, role, deleted_at);
create index if not exists entries_case_date_idx on public.entries(case_id, event_date desc, deleted_at);
create index if not exists entries_case_type_idx on public.entries(case_id, entry_type, deleted_at);
create index if not exists entries_case_issue_idx on public.entries(case_id, issue_key, deleted_at);
create index if not exists entries_case_flag_idx on public.entries(case_id, is_flagged, flag_severity, deleted_at);
create index if not exists attachments_case_idx on public.attachments(case_id, deleted_at);
create index if not exists court_orders_case_idx on public.court_orders(case_id, deleted_at);
create index if not exists court_order_provisions_case_idx on public.court_order_provisions(case_id, category, deleted_at);
create index if not exists filing_packages_case_idx on public.filing_packages(case_id, status, deleted_at);
create index if not exists key_dates_case_date_idx on public.key_dates(case_id, event_date, is_completed, deleted_at);
create index if not exists pattern_tags_case_idx on public.pattern_tags(case_id, issue_key, deleted_at);
create index if not exists advisor_threads_case_idx on public.advisor_threads(case_id, last_message_at desc, deleted_at);
create index if not exists ai_outputs_case_idx on public.ai_outputs(case_id, output_type, deleted_at);
