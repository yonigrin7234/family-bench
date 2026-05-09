# Surface Architecture

Family Bench is one shared platform with two optimized surfaces:

- Mobile Capture Surface
- Desktop Web Case War Room

This is not a separate-app split. Both surfaces use the same routes, local-first case-intelligence store, persistence model, evidence provenance rules, and legal-information-not-advice positioning.

## Surface Principles

- Mobile = capture, review, and quick guidance.
- Desktop = organize, analyze, prepare, and export.
- Data is shared; presentation changes by surface.
- Business logic must never fork by surface.
- Surface-specific layout may change density, navigation, and context placement.
- Surface-specific UI must not introduce remote writes, provenance shortcuts, or legal conclusions.

## Source Of Truth

Route capability metadata lives in `lib/surface/surfaceRegistry.ts`.

The registry defines every current route with:

- route path
- label
- mobile role
- desktop role
- mobile complexity level
- desktop complexity level
- mobile behavior
- desktop behavior
- mobile navigation visibility
- desktop navigation visibility
- future notes

Navigation should read from the registry where practical. Mobile and desktop can expose different navigation density, but they still point to the same route modules and shared data/store contracts.

## Mobile Capture Surface

Mobile-first features are optimized for quick entry, touch ergonomics, and in-the-moment source preservation.

- Capture entry
- Voice Capture
- Entry Detail
- Local attachment selection
- Local audio recording
- Timeline quick review
- Evidence attachment count visibility
- Basic Home summary
- First-run case setup
- Fast navigation through bottom tabs

Mobile UX rules:

- Keep the bottom navigation.
- Keep primary capture actions easy to reach.
- Keep forms narrow, stacked, and touch-friendly.
- Preserve source separation between raw input, reviewed body, private notes, and future interpreted data.
- Avoid desktop-only density on small screens.

## Desktop Web Case War Room

Web-first features are optimized for broader context, side-by-side review, and structured case preparation.

- Evidence browsing and local search
- Reports preview
- Filing Builder
- Patterns
- Case Map
- Advisor placeholder
- Timeline review
- Entry review and source references
- Cross-linking entries, attachments, reports, and filing packages
- Future document review, exhibit organization, and court package preparation

Desktop UX rules:

- Use a left sidebar for persistent navigation.
- Use a wider main content area for review and organization.
- Use a right context rail when helpful for case status, key dates, linked records, or review context.
- Keep content dense enough for repeated work without becoming visually noisy.
- Do not stretch mobile cards across the full browser width without structure.

## Shared Features

These features belong to both surfaces and must use the same business logic:

- Local onboarding and case setup
- Durable local persistence
- Entries
- Entry review state
- Private notes
- Court-ready summaries
- Children and case metadata
- Timeline
- Evidence attachments and voice memos
- Reports preview
- Filing packages
- Pattern detection state
- Advisor placeholder conversation state
- Local diagnostics

Shared architecture rules:

- Keep one store for case-intelligence state.
- Keep one persistence format that can migrate cleanly later.
- Keep immutable source evidence separate from reviewed or interpreted data.
- Keep local-created IDs and sync-safe metadata in local records.
- Do not introduce remote writes from surface-specific UI.
- Do not duplicate business logic between mobile and desktop.

## Navigation Model

Mobile navigation remains capture-centered:

- Home
- Capture
- Timeline
- Evidence
- Reports
- Case Map

Desktop navigation exposes more of the case workspace:

- Home
- Capture
- Voice Capture
- Timeline
- Evidence
- Case Map
- Reports
- Advisor
- Filings
- Patterns

Entry Detail and Onboarding are reachable workflow routes, not persistent navigation destinations.

## Route Capability Matrix

| Route | Path | Mobile role | Desktop role | Mobile complexity | Desktop complexity | Mobile behavior | Desktop behavior | Mobile nav | Desktop nav | Future notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/` | Quick case status and capture entry point. | Case overview for the broader work session. | Low | Medium | Compact current-case summary, recent entries, and next steps. | Shared shell opening workspace. | Yes | Yes | Can become the adaptive command center without forking store logic. |
| Capture | `/capture` | Primary in-the-moment entry capture. | Manual entry creation during review or preparation work. | Medium | Medium | Stacked, reachable, one-handed capture controls. | Same data flow fitted to the wider shell. | Yes | Yes | Future capture modes stay source-first and local-first. |
| Voice Capture | `/voice-capture` | Hands-light transcript and voice memo placeholder flow. | Voice capture review for typed transcripts and saved audio metadata. | Medium | Medium | Recorder, manual transcript, and accept/reject controls in one stack. | Same voice draft state without transcription services. | No | Yes | Real transcription, AI interpretation, and uploads remain future work. |
| Timeline | `/timeline` | Quick chronological review. | Dense chronological case review with filters and source counts. | Medium | High | Card-based entries with simple filters. | Persistent filters beside entry list, with context rail when width allows. | Yes | Yes | Can support denser grouping and saved views later. |
| Evidence | `/evidence` | Evidence browsing and attachment-count visibility. | Searchable evidence workspace for entries, attachments, and voice memos. | Medium | High | Stacked filters and result cards for touch scanning. | Search and filters stay visible beside a wider evidence result column. | Yes | Yes | OCR and AI search must preserve provenance rules. |
| Entry Detail | `/entry/[id]` | Focused review, notes, summaries, and local source attachments. | Source-record inspection from timeline, evidence, reports, filings, or patterns. | Medium | High | Entry-focused stack for review actions and attachment metadata. | Shared entry data and route context without desktop-only editing logic. | No | No | Future exhibit linkage should reuse entry IDs and attachment metadata. |
| Case Map | `/case-map` | Basic case details and setup edit access. | Structured map for parties, children, key dates, orders, and filing packages. | Medium | High | Case sections remain stacked and easy to scan. | Two-column organization with a case context rail where available. | Yes | Yes | Document intake and order extraction should feed this route through shared data. |
| Reports | `/reports` | Preview factual report groupings from local entries. | Report preparation workspace with filters, preview, and source references. | Medium | High | Report type, filters, and preview stay stacked. | Report filters sit beside the preview with active report context. | Yes | Yes | Final PDF export and filing insertion remain later phases. |
| Advisor | `/advisor` | Quick legal-information-not-advice guidance placeholder. | Case companion thread placeholder with broader case context. | Medium | Medium | Suggested prompts and message input stay simple and restrained. | Same placeholder conversation state inside the case workspace. | No | Yes | Real AI must be grounded, cautious, and added later. |
| Filings | `/filings` | Limited filing-package visibility and simple linking when needed. | Primary filing-package organization workspace. | High | High | Package list and detail sections stack without side-by-side density. | List/detail columns for package creation, selection, checklist, and source linking. | No | Yes | AI drafting, final PDFs, and e-filing remain future work. |
| Patterns | `/patterns` | Review possible local patterns when prompted. | Rule-based pattern review and acknowledgement workspace. | Medium | High | Stats, context, and possible pattern cards stay stacked. | Context and pattern columns support denser review with neutral language. | No | Yes | Pattern detection must stay factual and avoid legal conclusions. |
| Onboarding | `/onboarding` | First-run local case setup and quick case edits. | Local case setup and basic case details editing. | Medium | Medium | Setup fields remain stacked and touch-friendly. | Shared setup route inside the desktop shell when reached from Case Map. | No | No | Account onboarding can layer later without replacing local case setup. |

## Current Implementation

The responsive shell and route capability map currently provide:

- `CaseScreen` chooses mobile or desktop shell from viewport width.
- Mobile keeps the centered content column, bottom navigation, and fixed form footer behavior.
- Desktop gets a left sidebar, wider main content area, and optional right context rail.
- Desktop-heavy routes can request wider content through `desktopMaxWidth`.
- Navigation items are derived from `lib/surface/surfaceRegistry.ts`.
- Home, Capture, Voice Capture, Timeline, Entry Detail, Evidence, Case Map, Reports, Advisor, Filings, Patterns, and Onboarding remain shared route modules.

## Guardrails

This surface architecture does not add:

- AI
- OCR
- file uploads
- remote writes
- remote sync
- Supabase migrations
- RLS changes
- storage policy changes
- e-filing
- final court PDF generation

Future surface work should remain incremental and preserve:

- Family Bench design-system guardrails
- local-first/offline-first architecture
- evidence provenance separation
- legal-information-not-advice positioning
- calm, factual, child-centered tone
