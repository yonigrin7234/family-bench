# Surface Architecture

Family Bench is one shared platform with two optimized surfaces:

- Mobile Capture Surface
- Desktop Web Case War Room

This is not a separate-app split. Both surfaces use the same routes, local-first case-intelligence store, persistence model, evidence provenance rules, and legal-information-not-advice positioning.

## Product Principle

Family Bench should feel like one case record that adapts to the device in use.

The mobile surface prioritizes fast, low-friction capture while details are fresh. The desktop web surface prioritizes review, organization, comparison, and preparation work. Shared features should keep the same factual language, source references, local persistence behavior, and offline-first assumptions.

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

This is a navigation-density difference, not a product split.

## Current PR 6C Implementation

PR 6C introduces the first responsive shell:

- `CaseScreen` chooses the mobile or desktop shell from viewport width.
- Mobile keeps the existing centered content column, bottom navigation, and fixed form footer behavior.
- Desktop gets a left sidebar, wider main content area, and optional right context rail placeholder.
- Existing routes keep using the same `CaseScreen` wrapper, so Home, Capture, Voice Capture, Timeline, Entry Detail, Evidence, Case Map, Reports, Advisor, Filings, and Patterns inherit the surface shell without changing their data logic.

## Guardrails

PR 6C does not add:

- AI
- OCR
- file uploads
- remote writes
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
