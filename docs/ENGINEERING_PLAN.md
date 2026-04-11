# Engineering Plan: Family Bench — Full Product

## Context

Family Bench (Custody Record) is the documentation tool for self-represented parents in custody disputes. It turns daily chaos (pickups, dropoffs, expenses, incidents, court orders) into organized, timestamped, court-admissible evidence, and generates professional court documents.

**Source of truth documents:**
- Product Plan (Doc 1) — vision, features, competitive landscape, go-to-market
- Verified Design Spec (Doc 2) — Claude.ai-inspired design system (Georgia/#F5F5F0)
- Technical Blueprint (Doc 3) — database schema, project structure, build order
- Evidence Capture Engine (Doc 4) — universal capture pipeline

**Resolved conflicts:**
- Design system: Doc 2 (Verified Design Spec) overrides Doc 1 Section 4B
- Sync: PowerSync (approved in eng review) overrides Doc 3's custom sync
- Scope: Full product per Doc 3 sprint plan, not the earlier "Full Loop MVP"

Branch: `claude/gallant-johnson`

## Architecture (approved, updated)

```
SYSTEM ARCHITECTURE — FAMILY BENCH
═══════════════════════════════════════════════════════════

  CAPTURE (on-device, offline via PowerSync)
  ┌──────────────────────────────────────────────┐
  │  10 entry types:                             │
  │    journal, pickup_dropoff, visit_denied,    │
  │    expense, medical, child_statement,        │
  │    communication, incident, compliance,      │
  │    witness                                   │
  │                                              │
  │  Capture methods:                            │
  │    Voice (dictation/exchange modes)           │
  │    Photo (camera + gallery + receipt scan)    │
  │    Text (manual entry, all 10 types)         │
  │    Exchange timer (GPS + late calc)           │
  │    Siri Shortcut (background record, iOS)    │
  │    Forward-to-email (capture@familybench.com)│
  │    AI Screenshot Reader (any platform)       │
  │    File import (OFW/WhatsApp/CSV parsers)    │
  └──────────┬───────────────────────────────────┘
             │
             ▼
  LOCAL DB (PowerSync + expo-sqlite)
  ┌──────────────────────────────────────────────┐
  │  42 tables: core + structural + practitioner  │
  │  + filing + court forms + case intelligence  │
  │  + integrations + docket + capture + AI infra│
  │  (legal_knowledge_base w/ pgvector, prompts, │
  │  advisor_conversations) + evidence integrity │
  │  (entry_edits append-only) + security        │
  │  (audit_log append-only, retention policies) │
  │  Soft deletes on entries, case_docs, filings │
  │  Edit history JSONB on entries               │
  │  SHA-256 hashing on all file uploads         │
  └──────────┬───────────────────────────────────┘
             │ PowerSync CRDT auto-sync
             ▼
  SUPABASE (remote)
  ┌──────────────────────────────────────────────┐
  │  Auth: Google + Apple OAuth + email/password │
  │  Postgres (RLS on every table)               │
  │  Storage: receipts/, documents/, reports/,   │
  │           voice/ (per user_id paths)         │
  │  Edge Functions (7):                          │
  │    ├── process-voice/ (Deepgram + Claude)    │
  │    ├── generate-report/ (pdf-lib → data rpts)│
  │    ├── generate-declaration/ (pdf-lib → legal)│
  │    ├── render-form-pdf/ (fill court forms)   │
  │    ├── case-diagnostic/ (AI case analysis)   │
  │    ├── integration-sync/ (reserved)          │
  │    └── document-ocr/ (reserved)              │
  └──────────────────────────────────────────────┘

  DEPLOY
  ┌──────────────────────────────────────────────┐
  │  Mobile: EAS Build → App Store + Google Play │
  │  Web: Expo Router web → Vercel               │
  │  Edge Functions: Supabase                    │
  └──────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Source |
|----------|--------|--------|
| Framework | Expo SDK 54 + Expo Router | Blueprint |
| Styling | NativeWind v4 + Doc 2 design tokens | Eng review + Doc 2 |
| Offline sync | PowerSync (CRDT, Supabase-native) | Eng review |
| Auth | Google + Apple OAuth + email/password + biometric | Eng review + Doc 1 |
| Voice | Deepgram Nova-3 + Claude API via Edge Functions | Eng review |
| PDF | Server-side via Supabase Edge Functions (pdf-lib). Two functions: generate-report/ (data reports) and generate-declaration/ (legal documents) | Eng review + user correction |
| Bare workflow | Yes (expo prebuild for Siri Shortcuts) | Eng review |
| Design system | Doc 2 — Georgia serif, #F5F5F0 warm cream, Claude.ai DNA | Design review |
| Recording modes | Dictation (no consent) + Exchange (jurisdiction-aware consent) | Eng review |
| Web | Included from day one (Expo Router web → Vercel) | Design review + Doc 3 |
| Icons | Lucide React, 20px, 1.75px stroke | Doc 2 |

## Data Model — 42 Tables

Final architecture. 42 tables, 11 Edge Functions, 9 storage buckets, pgvector extension. Supports every feature through Phase 5 without schema changes.

### Core Tables (Sprint 0-2, built and used immediately)

1. **profiles** — extends auth.users. State, county, timezone, preferences. Additional fields: case_stage, conflict_level, representation_status, immediate_needs[], onboarding_completed_at.
2. **cases** — case_number, court_name, department, judge_name, filing_date. FK to profiles. A user can have multiple cases (custody + DV restraining order, or cases with different ex-partners).
3. **parties** — per-case parties. role (self/other_parent/attorney/opposing_attorney/evaluator/mediator/etc), name, email, phone, firm_name, bar_number. FK to cases.
4. **children** — name, date_of_birth, FK to profiles. Referenced by entries, exchange_logs, compliance_checks.
5. **entries** — the core journal. 10 entry types, per-type metadata JSONB, flagging, people_present, voice_transcript, linked_entry_ids, soft delete, `edit_history jsonb default '[]'`. FK to cases via case_id. voice_entry_id FK to voice_entries. Forensic metadata: capture_timestamp (server UTC), device_timestamp, device_timezone, device_id (hashed), device_model, device_os, app_version, capture_method (enum: manual_text/voice_dictation/voice_exchange/camera_photo/gallery_import/screenshot_ai/file_upload/integration_sync/ofw_import/whatsapp_import/email_forward/siri_shortcut), ip_address_hash, location_lat/lng (decimal 10,7), location_accuracy_meters, location_altitude, location_source (gps/wifi/cell/manual/none), location_address (reverse geocoded), content_hash (SHA-256), metadata_hash (SHA-256), hash_algorithm, is_edited, original_content_hash, timestamp_consistency (verified/minor_drift/suspicious/offline_capture).
6. **attachments** — photos, receipts, documents. Supabase Storage paths + thumbnails. Forensic EXIF: exif_timestamp, exif_gps_lat/lng, exif_device_make/model/software, original_filename, file_hash (SHA-256), file_hash_verified_at, is_original, original_file_hash.
7. **court_orders** — provisions as JSONB array of checkable items. FK to cases.
8. **compliance_checks** — per-provision compliance records linked to entries.
9. **key_dates** — hearings, deadlines, mediations. Auto-calculated deadlines with state rules. FK to cases.
10. **reports** — generated documents. `document_category check ('report','declaration')`. Report types: late_incidents, expense_summary, flagged_incidents, custody_timeshare, full_journal, compliance_summary, bench_brief, exhibit_packet, communication_summary. Declaration types: declaration_mc031, declaration_generic. includes `included_entry_ids uuid[]`.
11. **subscriptions** — Stripe billing. user_id, stripe_customer_id, stripe_subscription_id, plan (free/pro/legal), status (active/cancelled/past_due), current_period_start, current_period_end, created_at.
12. **notification_log** — all sent notifications. user_id, notification_type (deadline/reminder/gap_detection/sync_status/filing_update/docket_alert), title, body, sent_at, read_at, action_url, related_entity_type, related_entity_id.

### Practitioner Portal Tables (Sprint 0 migration, build features Sprint 12+)

13. **practitioners** — role (attorney/evaluator/coordinator/judge), firm_name, bar_number, license_number, state.
14. **practitioner_access** — granular access grants. granted_by, access_level, access_scope JSONB, requires_both_parents, second_parent_consent.
15. **practitioner_comments** — attorney notes, evaluator observations. visibility (attorney_client/evaluator_private).
16. **access_log** — audit trail. Every view/export/comment logged with timestamp and IP.
17. **submitted_packets** — formally filed packets (what judges see, NEVER raw data). digital_hash SHA-256, status (draft/submitted/filed).

### Filing System Tables (Sprint 0 migration, build features Sprint 11+)

18. **filing_packages** — e-filing packages. filing_type, forms JSONB, status, efiling_provider, efiling_reference_id, filing_fee_amount. Additional: checklist_status JSONB, ready_to_file, filed_at, served_at, service_deadline, total_pages, file_size_bytes, state_code, county, court_name, ai_draft_status.
19. **filing_evidence** — global evidence-to-filing join table. exhibit_group, exhibit_label, display_order, usage_note, declaration_paragraph, ai_relevance_score, ai_relevance_reason, ai_suggested_exhibit_group, dismissed, added_by (manual/ai_suggested/auto). UNIQUE(filing_package_id, entry_id).
20. **filing_documents** — individual documents within a filing package. document_type, document_order, form_id (FK to court_forms), form_data JSONB, pdf_storage_path, is_complete.
21. **filing_ai_suggestions** — AI evidence recommendations per filing. suggestion_type (strong_match/possible_match/cross_reference/discrepancy/missing_document/deadline_warning), reason, statute_reference, relevance_score, status (pending/accepted/dismissed).

### Court Forms & State Config Tables (Sprint 0 migration, build features Sprint 11+)

22. **court_forms** — form library. state_code, form_number, form_name, form_category, fields JSONB, field_groups JSONB, auto_fill_mapping JSONB, pdf_template_storage_path, required_for_filing_types[].
23. **state_configs** — per-state legal configuration. terminology JSONB, statutes JSONB, forms JSONB, consent_type, local_rules JSONB, efiling_system, available_remedies JSONB, filing_type_forms JSONB, statute_references JSONB.
24. **court_evidence_systems** — digital evidence portal specs per court. state_code, county, system_name, system_url, status (mandatory/optional/pilot/none), accepted_file_types JSONB, max_file_size_mb, exhibit_labeling_format, requires_index, submission_deadline_rules, last_verified.

### Case Intelligence Tables (Sprint 0 migration, build features Sprint 8+)

25. **case_documents** — full case history intake. document_type (court_order/filed_motion/responsive_declaration/minute_order/custody_evaluation/etc), filed_by, provisions_extracted JSONB, ocr_text, ai_summary, related_entry_ids[], related_filing_package_id FK, storage_path, file_hash, page_count.
26. **diagnostic_trees** — guided "what should I do?" flows. state_code, situation_type, trigger_phrases[], tree JSONB, output_template JSONB, statutes_referenced[], remedies JSONB, required_forms_per_remedy JSONB, self_audit_questions JSONB, evidence_scoring_criteria JSONB.
27. **ai_context_requests** — AI interaction log. context_type (filing_suggestions/missing_evidence/pattern_detection/hearing_prep/diagnostic/case_assessment), input_data JSONB, ai_response JSONB.

### Integration Hub Tables (Sprint 0 migration, build features Sprint 10+)

28. **connected_integrations** — MCP-style connectors. case_id FK. integration_type (gmail/google_calendar/google_drive/imessage/ofw/whatsapp/instagram/bank_plaid/phone_contacts/photo_library/medical_portal/school_portal/venmo/paypal/docusign), status (connected/disconnected/syncing/error), auth_token_encrypted, other_parent_identifier, last_sync_at, items_captured, settings JSONB.
29. **sync_log** — per-integration sync history. sync_started_at, sync_completed_at, items_found, items_new, status (running/completed/failed), error_message.

### Docket & Monitoring Tables (Sprint 0 migration, build features Phase 4+)

30. **docket_monitoring** — court docket tracking config. case_number, court_portal_url, monitoring_method, check_frequency, last_checked_at, is_active.
31. **docket_events** — detected docket changes. event_type, filing_party, auto_detected, response_deadline, linked_filing_log_id, user_notified, detected_at.

### Evidence Capture Tables (Sprint 0 migration, build features Sprint 6+)

32. **voice_entries** — voice recording metadata. audio_file_path, audio_duration_seconds, raw_transcript, ai_parsed_result JSONB, language_detected, audio_quality_score, entries_generated[], user_reviewed, user_edited.
33. **communications** — imported messages from all platforms. platform, direction, sender, recipient, content, response_time_minutes, ai_tone_score, ai_flags JSONB, import_method.
34. **call_records** — call history. phone_number, direction, duration_seconds, status, recording_url, transcript.

### AI Infrastructure Tables (Sprint 0 migration)

35. **ai_prompt_templates** — per-Edge-Function AI config. function_name (unique), model (haiku/sonnet/opus), system_prompt, user_prompt_template, temperature, max_tokens, zod_schema_name, rag_config JSONB (search_legal_kb, search_entries, search_court_orders, search_filings, search_case_documents, max results, iterative_retrieval), version, is_active.
36. **legal_knowledge_base** — RAG for statutes. state_code, knowledge_type (statute/court_rule/local_rule/form_instruction/judicial_council_comment/legal_definition), citation, title, full_text, summary, topics[], effective_date, superseded_by, embedding vector(1536). Indexes: ivfflat on embedding, GIN on full_text. Requires pgvector extension.
37. **advisor_conversations** — case advisor chat history. case_id FK. title, messages JSONB (role, content, timestamp, referenced_entries[], referenced_statutes[], referenced_documents[], suggested_actions[]), context_snapshot JSONB, is_archived.

### Evidence Integrity Tables (Sprint 0 migration)

38. **entry_edits** — append-only edit audit trail. entry_id FK, edited_at, field_name, old_value, new_value, old_content_hash, new_content_hash, edit_reason, device_id, ip_address_hash. APPEND-ONLY RLS: INSERT only, no UPDATE or DELETE.

### Security Tables (Sprint 0 migration)

39. **security_audit_log** — append-only. action, resource_type, resource_id, ip_address_hash, device_id, session_id, timestamp. APPEND-ONLY RLS: INSERT only, no UPDATE or DELETE.
40. **data_retention_policies** — CCPA/SOC2 compliance. data_type, retention_period_days, deletion_method, legal_basis.

### Billing & Notifications (Sprint 0 migration, build features Phase 3+)

41. **subscriptions** (listed above as #11)
42. **notification_log** (listed above as #12)

### Extensions
- `pgvector` — required for legal_knowledge_base vector embeddings

### Indexes
- entries: user_id+event_date DESC, user_id+entry_type, flagged (partial), full-text search (GIN)
- filing_evidence: filing_package_id, entry_id (covered by UNIQUE constraint)
- case_documents: user_id+document_type, user_id+filed_date
- legal_knowledge_base: ivfflat on embedding (vector_cosine_ops, lists=100), GIN on full_text
- entry_edits: entry_id+edited_at
- All FK columns indexed

### RLS on ALL 42 tables
- Same pattern: `auth.uid() = user_id` for parent tables
- Practitioner access: attorney sees ONLY granted entries where revoked_at IS NULL
- Evaluator sees ONLY entries where BOTH parents granted access
- Judge queries ONLY submitted_packets, NEVER raw entries
- All access through access_log
- connected_integrations: encrypted tokens, user-only access
- **Append-only tables (entry_edits, security_audit_log):** INSERT only RLS. No UPDATE or DELETE policies. Ever.
- **Supabase Vault:** column-level encryption for auth_token_encrypted, witness contact_info, medical info

### AI Model Selection (per Edge Function)
- process-voice/ transcription: Deepgram Nova-3
- process-voice/ structuring: Claude Sonnet
- generate-report/: Claude Sonnet
- generate-declaration/: Claude Opus (legal precision)
- render-form-pdf/: No AI (pdf-lib only)
- case-diagnostic/: Claude Opus (legal analysis)
- ai-assist/: Claude Haiku (quick coaching)
- analyze-communications/: Claude Sonnet (tone analysis)
- detect-patterns/: Claude Sonnet (batch)
- submit-filing/: No AI (API calls only)
- document-ocr/: Claude Sonnet with vision

### Rate Limits (per user per day)
- process-voice: 50, case-diagnostic: 20, generate-declaration: 10
- ai-assist: 100, detect-patterns: 1 (nightly), analyze-communications: 50
- generate-report: 20

### Global AI Rules (prepend to every Claude call)
- Output factual, non-emotional, court-appropriate language only
- NEVER "hostile/abusive/narcissistic" — use "non-cooperative/contrary to court order"
- NEVER give legal advice — "legal information" or "legal research"
- NEVER "you should" — "options include" or "one approach is"
- NEVER fabricate citations — ONLY from legal_knowledge_base via RAG
- UPL disclaimer on every output. Zod validation on every response.

### Storage Buckets (9)
- `receipts/{user_id}/{entry_id}/` — expense receipt photos
- `documents/{user_id}/` — general uploaded docs
- `case_documents/{user_id}/` — court filings, opposing party docs, evaluations (separate retention from general docs)
- `reports/{user_id}/{report_id}.pdf` — data reports
- `declarations/{user_id}/{report_id}.pdf` — sworn legal documents
- `voice/{user_id}/{entry_id}.m4a` — voice recordings
- `submitted_packets/{user_id}/` — formally filed court packets
- `form_templates/` — official court form PDF templates (shared, not per-user)
- `screenshots/{user_id}/` — AI Screenshot Reader uploads

### Edge Functions (11)
1. `process-voice/` — Deepgram Nova-3 transcription + Claude structuring → structured JSON
2. `generate-report/` — data reports (late incidents, expense summary, custody timeshare, bench brief, exhibit packet, communication_summary) → pdf-lib → PDF
3. `generate-declaration/` — legal documents (MC-031 declarations, numbered paragraphs, penalty of perjury, signature blocks, exhibit references) → pdf-lib → PDF
4. `render-form-pdf/` — fill official court forms: form_data + PDF template → exact coordinate placement → completed PDF. Uses pdf-lib.
5. `case-diagnostic/` — situation + answers + full case data → state statute analysis → evidence strength scoring → assessment with legal options, forms, gaps, deadlines. UPL guardrails.
6. `ai-assist/` — real-time entry assistance. Smart journaling coach: suggests missing details ("you mentioned a late pickup but didn't note the scheduled time"), auto-categorization, statute references in context.
7. `analyze-communications/` — processes imported communications for tone analysis, hostile language flagging, response time tracking, pattern detection across messages.
8. `detect-patterns/` — nightly batch: behavioral pattern detection across entries (late pickup clustering, denied visit escalation after filings, child mood correlations). Writes to ai_context_requests.
9. `submit-filing/` — submits filing package to e-filing providers (1eFile, One Legal APIs). Formats per court specs, handles fees, returns court-stamped confirmation. Updates filing_packages status.
10. `integration-sync/` (reserved) — background sync for connected integrations
11. `document-ocr/` (reserved) — OCR + AI extraction for uploaded case documents

### Filings Tab Structure
- Filing Packages: active and past filings, each with documents + evidence + exhibit checklist + AI suggestions
- Case Documents: court orders, opposing filings, reports, declarations — organized by type
- "+New Filing" → pick form type OR "I don't know" → Case Diagnostic flow
- Each filing detail has 3 sub-tabs: Documents, Evidence, Notes

### Evidence Organization
- One global evidence pool (entries table)
- Entries get LINKED to filings via filing_evidence join table
- Same entry can appear in multiple filings with different exhibit labels
- Three views: Journal (global feed), Filing → Evidence tab (per-filing), Unassigned filter
- AI scans entire vault per filing, suggests relevant unlinked entries with legal reasoning

## Design System (Doc 2 — Source of Truth)

```
COLORS (light):
  Page: #F5F5F0 (warm cream)    Surface: #FFFFFF
  Text: #1A1A18                  Muted: #6B6A68
  Border: rgba(0,0,0,0.08)      Accent: #2563EB
  Shadow: 0 0.25rem 1.25rem rgba(0,0,0,0.035)
  Success: #059669  Warning: #D97706  Danger: #DC2626

COLORS (dark):
  Page: #2B2A27  Surface: #1F1E1B  Text: #EEEEEE  Muted: #9A9893

TYPOGRAPHY:
  Headings: Georgia serif (display/title/heading tokens) — legal authority
  Body: System sans-serif (subheading/body/label/caption/badge) — readability
  Max weight: 600. NEVER 700+.

COMPONENTS:
  Border-radius: 12px cards/buttons/inputs, 16px modals/input bar
  Touch targets: 44px min. Icons: 20px Lucide, 1.75px stroke
  Entry badges: blue=journal, amber=incident, red=denied, green=expense
  Buttons: active scale(0.98), 300ms cubic-bezier(0.165,0.85,0.45,1)

ANTI-PATTERNS (absolute):
  No gradients. No colored card backgrounds. No multiple accents.
  No emoji as UI. No uppercase. No bold 700+. No radius >16px (except circles).
  No shimmer. No centered content layouts. No purple/teal.
```

## Navigation

```
MOBILE: Bottom tab bar (5 tabs)
├── Journal (home) — entry feed, FAB → bottom sheet capture menu
├── Dashboard — stats, charts, compliance score
├── Timeline — calendar/chronological view
├── Filings — reports, declarations, filing history
└── More — settings, case setup, research, communications

DESKTOP/WEB: Sidebar (collapsed 48px / expanded 240px)
  Same 5 sections, sidebar instead of tabs

  Collapsed (48px, icon-only):
    Background: #F5F5F0 (same warm cream, seamless with page)
    No border — seamless edge
    Icons stacked vertically: sidebar toggle, + new entry (accent circle),
      Journal, Dashboard, Timeline, Filings, More
    Bottom: user avatar circle (initials, 32px)
    Icon size: 20px Lucide, muted gray

  Expanded (240px):
    Background: #F5F5F0 (same warm cream, NO different color)
    Top: [toggle icon] "Family Bench" (Georgia serif, 600 weight)
    Nav items: icon + label, 15px sans, 500 weight, generous vertical spacing
      Active item: accent text + accent-lighter background pill
    Section divider: 1px rgba(0,0,0,0.08)
    "Recents" section label: caption size, muted
    Recent entries: single line, truncated, no borders between
    Bottom: [YG] Yoni Grin (avatar + name + "Pro plan" subtitle)

RESPONSIVE: Bottom tabs <768px, sidebar ≥768px
```

## Project Structure (from Doc 3, verified)

```
app/
  _layout.tsx                    # Root (providers, fonts, theme)
  (auth)/                        # Login, signup, onboarding wizard (5 steps)
  (app)/                         # Authenticated shell (tabs/sidebar)
    (journal)/                   # Tab 1: feed, [id] detail, new entry
    dashboard.tsx                # Tab 2: stats
    (timeline)/                  # Tab 3: calendar view
    (filings)/                   # Tab 4: reports, filing wizard
    (more)/                      # Tab 5: settings, research, comms
    entry-form.tsx               # Full-screen entry form (modal)
components/
  ui/                            # Button, Card, Input, Badge, BottomSheet, etc.
  layout/                        # AppShell, Sidebar, TabBar, PageHeader
  entries/                       # EntryCard, EntryFeed, EntryForm, all type forms
  dashboard/                     # StatCard, ComplianceScore, DeadlineAlert
  capture/                       # VoiceRecorder, CameraCapture, ScreenshotReader
  shared/                        # DatePicker, TimePicker, SearchBar, EmptyState
lib/
  supabase/                      # Client, auth helpers, generated types
  hooks/                         # useEntries, useProfile, useCourtOrders, etc.
  utils/                         # dates, custody calcs, export, constants
  ai/                            # voice-capture, entry-parser, screenshot-reader
  capture/                       # ofw-parser, whatsapp-parser, email-capture
supabase/
  migrations/                    # 42 SQL migrations + pgvector extension
  seed.sql                       # Dev sample data
```

## Sprint Plan (from Doc 3, adapted with eng review decisions)

### Sprint 0: Foundation (Day 1-2)

**Step 0: Install Claude Code skills (15 + custom)**
```bash
# Design + UI
/plugin install frontend-design@claude-plugins-official
git clone --depth 1 https://github.com/ehmo/platform-design-skills.git ~/.claude/skills/platform-design
git clone --depth 1 https://github.com/awesome-skills/mobile-app-design.git ~/.claude/skills/mobile-app-design
mkdir -p ~/.claude/skills/nativewind-ui && curl -o ~/.claude/skills/nativewind-ui/SKILL.md https://raw.githubusercontent.com/toddbadams/SBFoundation/main/nativewind/SKILL.md
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git ~/.claude/skills/ui-ux-pro-max

# React Native + Expo
npx expo-atlas skills install
/plugin install react-native-best-practices@callstack-agent-skills
git clone --depth 1 https://github.com/gigs-slc/react-native-skills.git ~/.claude/skills/react-native-skills

# Backend
git clone --depth 1 https://github.com/secondsky/claude-skills.git /tmp/secondsky && cp -r /tmp/secondsky/skills/supabase-postgres-best-practices ~/.claude/skills/supabase-postgres && rm -rf /tmp/secondsky

# Security
git clone --depth 1 https://github.com/BehiSecc/vibesec.git ~/.claude/skills/vibesec
git clone --depth 1 https://github.com/fullstackcrew-alpha/privacy-mask.git ~/.claude/skills/privacy-mask

# Quality + Shipping
git clone --depth 1 https://github.com/truongduy2611/app-store-preflight-skills.git ~/.claude/skills/app-store-preflight
git clone --depth 1 https://github.com/ramzesenok/iOS-Accessibility-Audit-Skill.git ~/.claude/skills/ios-accessibility
/plugin install web-design-guidelines@vercel-agent-skills
/plugin install composition-patterns@vercel-agent-skills

# Custom project skill (user provides content)
# → .claude/skills/family-bench.md (full design system + project rules)
```

**Skill coverage matrix:**
| Layer | Skill | Catches |
|-------|-------|---------|
| Project design | family-bench.md | Wrong colors/fonts/spacing/components |
| Anti-AI-slop | frontend-design | Purple gradients, Inter font, generic layouts |
| Platform rules | platform-design | Apple HIG / Material Design violations |
| Mobile UX | mobile-app-design | Touch targets, contrast, platform conventions |
| NativeWind | nativewind-ui | Incorrect Tailwind/NativeWind patterns |
| UX patterns | ui-ux-pro-max | Bad UX, wrong charts, poor font pairings |
| Expo | expo-atlas | Wrong Expo patterns, deployment issues |
| RN perf | callstack + rn-skills | Janky lists, missing memos, bundle bloat |
| Database | supabase-postgres | Bad queries, missing indexes, RLS gaps |
| Security | vibesec | IDOR, XSS, SQL injection, weak auth |
| Privacy | privacy-mask | PII leaks in screenshots/logs |
| App Store | app-store-preflight | Rejection reasons before submission |
| Accessibility | ios-accessibility | VoiceOver, accessibility labels |
| Web a11y | vercel-guidelines | ARIA, focus states, keyboard nav |
| Components | composition-patterns | Boolean prop sprawl, bad architecture |
| Code/QA/Ship | gstack | Review, QA, security audit, shipping |

**Step 1: Expo project setup**
- `npx expo prebuild` (bare workflow for Siri Shortcuts)
- Install deps: PowerSync, expo-sqlite, expo-location, expo-local-authentication, @config-plugins/react-native-siri-shortcut, lucide-react-native
- Configure NativeWind with Doc 2 Tailwind tokens (full config from Doc 2 Section 8)
- Create Supabase project:
  - Auth providers: Google + Apple + email/password
  - Enable pgvector extension
  - Run 42 table migrations (core + structural + practitioner + filing + court forms + case intelligence + integrations + docket + capture + AI infrastructure + evidence integrity + security + billing + notifications)
  - Create 9 storage buckets (receipts, documents, case_documents, reports, declarations, voice, submitted_packets, form_templates, screenshots)
  - Enable RLS on all 42 tables (including append-only on entry_edits + security_audit_log)
  - Configure Supabase Vault for column-level encryption (auth tokens, witness contacts, medical info)
  - Deploy 11 Edge Functions as stubs (process-voice, generate-report, generate-declaration, render-form-pdf, case-diagnostic, ai-assist, analyze-communications, detect-patterns, submit-filing, integration-sync, document-ocr)
- Set up PowerSync connector + schema matching all active tables
- Configure EAS Build (eas.json)
- Deploy web to Vercel
- Test on iPhone via dev client + web via browser

### Sprint 1: Component Library (Day 3-5)
- Build every base component per Doc 2 specs before any screens
- Foundation: color tokens, typography scale, spacing scale, border-radius, shadows
- Atoms: Button (5 variants), Input, TextArea, Badge (5 types), IconButton, Select, Toggle
- Molecules: EntryCard, StatCard, TimelineItem, DeadlineAlert, EmptyState, QuickEntryBar
- Organisms: EntryFeed, AppShell (responsive tabs/sidebar), Sidebar, TabBar, PageHeader
- Dark mode from day one (both themes in component library)
- Test screen showing every component

### Sprint 2: Journal (Day 6-10)
- Entry creation form supporting all 10 entry types
- Per-type forms: PickupDropoffForm, ExpenseForm, VisitDeniedForm, etc.
- Entry feed (FlatList virtualized, pull-to-refresh)
- Entry detail view (push navigation)
- Entry editing + soft delete
- QuickEntryBar (floating above tab bar)
- Custody period selector, mood selector
- Photo capture (expo-camera + expo-image-picker)
- Search + filter (date range, type, flagged)
- Offline: entries persist via PowerSync, sync when online
- SHA-256 hash on file capture (chain of custody)

### Sprint 3: Case Setup (Day 11-13)
- Onboarding wizard (5 steps: state, court, your info, children, schedule)
- Settings screens (edit all profile fields)
- Court order input (add orders, add provisions as checklist)
- Key dates input (hearings, deadlines)
- Push notification reminders (expo-notifications)

### Sprint 4: Dashboard (Day 14-17)
- Stat cards: total entries, flagged, denied visits, expenses
- Custody time split (scheduled vs actual)
- Late pickup stats (count, average, worst)
- Expense totals by category
- Compliance score from court order checks
- Deadline alerts with countdown
- Date range selector

### Sprint 5: Court Output (Day 18-23)
- Report generator UI (type + date range + entry selection)
- Report types: late incidents, expense summary, flagged incidents, custody timeshare, full journal, compliance summary
- MC-031 Declaration draft generator (AI-formatted numbered paragraphs)
- PDF generation via Supabase Edge Function
- PDF viewing in-app
- Share sheet (email, print, save, AirDrop)
- CSV export

### Sprint 6: Timeline + Compliance + Capture (Day 24-30)
- Case timeline (visual, scrollable)
- Court order compliance tracking (per-provision)
- Calendar heatmap
- AI Screenshot Reader (photo → structured messages)
- Voice recording + Deepgram transcription + Claude structuring
- OFW export parser, WhatsApp export parser

### Sprint 7: App Store + Polish (Day 31-35)
- App icon and splash screen
- Dark mode verification
- EAS Build: production iOS + Android
- App Store screenshots and description
- TestFlight beta → EAS Submit
- familybench.com marketing page on Vercel

## Interaction States (from design review)

```
FEATURE              | LOADING              | EMPTY                         | ERROR
---------------------|----------------------|-------------------------------|---------------------------
Journal Feed         | Opacity pulse cards  | "No entries yet. Start by     | "Couldn't load. Pull to
                     |                      | recording what happened."     | retry."
Voice Recording      | —                    | —                             | "Mic access needed."
Transcription        | "Processing..." badge| —                             | "Couldn't process. Retry."
Exchange Log         | —                    | "No exchanges logged yet."    | GPS: "Location unavailable."
Hearing Prep         | —                    | "Add your next court date."   | —
Report Generation    | Indeterminate pulse  | —                             | "Generation failed. Check
                     | "Usually 15-30 sec"  |                               | connection and try again."
Dashboard            | Opacity pulse layout | "Start logging to see your    | "Couldn't load stats."
                     |                      | compliance score."            |
Sync                 | "Syncing..." top bar | —                             | "Sync failed. X pending."
```

## Magic Moment: Voice → Evidence Transformation

Side-by-side reveal after AI processes a voice entry:
- Top (muted): raw transcript
- Bottom (full size): structured evidence card with type badge, factual summary, metadata
- User confirms or edits the structured version

## Tests (alongside each sprint)

- **Unit:** Jest + RNTL for stores, schemas, AI response validation, late-minute calcs
- **E2E:** Maestro for critical flows (onboarding, capture, hearing prep, generate, offline sync)
- **Eval:** Custom golden transcript set for Claude structuring (>80% accuracy)

## Performance

- FlatList virtualization (target 60fps with 1000+ entries)
- 64kbps AAC for voice recording (~1MB/min)
- Optimistic UI: audio saved locally, "Processing..." badge until structured
- PowerSync pagination: 50 entries/page, cursor-based

## NOT in scope (deferred to future sprints)

- Case Analyzer / legal research (Sprint 8)
- Mac iMessage auto-sync (Sprint 9)
- Gmail/Outlook OAuth (Sprint 10)
- Filing wizard + e-filing (Sprint 11)
- Practitioner portal (Sprint 12)
- Bench brief + exhibit packet automation (Sprint 13)
- Smart notifications + deadline engine (Sprint 14)
- 50-state config expansion (Sprint 15)
- capture@familybench.com inbound email (Sprint 16)
- Dedicated phone number (Phase 4)
- Docket monitoring (Phase 4)
- Court digital evidence system integration (Phase 4)

## What Already Exists (reuse)

- `app/_layout.tsx` — root layout, extend don't replace
- `app/(tabs)/_layout.tsx` — tab structure, replace names/icons
- `components/Themed.tsx` — theme-aware components, extend with NativeWind
- `constants/Colors.ts` — replace with Doc 2 palette
- All expo-* packages already installed (camera, av, image-picker, file-system, secure-store)
- @gorhom/bottom-sheet, react-hook-form, zod, zustand — all installed

## Verification

1. `npx expo prebuild` succeeds, dev client builds
2. PowerSync connects, sync status "connected"
3. All 10 entry types create/read/update/soft-delete correctly
4. Voice memo → "Processing..." → structured entry appears
5. Dashboard shows real stats from entries
6. Generate declaration → preview PDF → share works
7. Offline entry → come online → sync completes
8. Web version at familybench.com matches mobile layout
9. `npx jest --coverage` >80% on lib/
10. Maestro E2E: full capture-to-declaration flow

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 9 issues, 3 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score: 3/10 → 8/10, 7 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |
| Outside Voice | `codex-plan-review` | Independent plan challenge | 1 | issues_found (claude) | 11 findings, 2 accepted |

**VERDICT:** ENG + DESIGN CLEARED — plan updated with full product spec. Ready to implement Sprint 0.
