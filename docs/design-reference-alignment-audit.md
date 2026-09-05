# Design Reference Alignment Audit

This audit compares the current Family Bench Expo app against the uploaded design reference kit. The goal is to identify where the implemented app still behaves like a mobile card interface stretched across desktop, and where future work should move it toward the intended desktop "case war room" experience.

This is an implementation planning document. It does not authorize adding AI, OCR, PDF generation, e-filing, remote sync, remote writes, Supabase migrations, RLS changes, or storage changes.

## Reference Files Inspected

The uploaded reference kit was inspected from `design/family-bench/project`.

- `Family Bench.html`
- `capture-flow.jsx`
- `case-map.jsx`
- `integrations.jsx`
- `safety.jsx`
- `softkit.jsx`
- `primitives.jsx`
- `tokens.js`
- `desktop-screens.jsx`
- `mobile-screens.jsx`
- `v2-surfaces.jsx`
- `home-v2.jsx`
- `voice-v2.jsx`
- `conversations.jsx`
- `filing-wizard.jsx`

Two requested filenames were not present under the extracted design kit:

- `filings.jsx`: closest reference file inspected was `filing-wizard.jsx`.
- `advisor.jsx`: closest reference files inspected were `conversations.jsx` and `v2-surfaces.jsx`.

## Executive Summary

The current app has the right product foundation: local-first data, durable entries, attachments, audio, reports, filings, patterns, and a responsive shell. Mobile behavior is generally aligned with the reference direction because capture, review, voice, and quick navigation remain card-based and single-column.

Desktop is only partially aligned. The current shell has a sidebar and several desktop layouts use two columns or context rails, but many routes still rely on stacked mobile cards, large vertical spacing, and single-record focus. The reference kit expects desktop to expose more simultaneous case context: split panes, inspector rails, table-like rows, metadata columns, persistent filters, bulk workflows, document/source sidebars, and top-level command/search affordances.

The strongest current matches are Evidence, Filings, Patterns, and Reports after the density pass. The largest remaining gaps are Home, Advisor, Case Map, Entry Detail, Timeline, and the absence of reference-level Integrations and Safety surfaces.

## Cross-Cutting Findings

### Current Desktop Shell

- Current implementation: a shared responsive shell with mobile bottom nav and desktop sidebar navigation.
- Reference behavior: desktop has a more explicit case workspace with primary navigation, secondary workspace navigation, active case switcher, top command/search bar, quick capture, and workspace context.
- Gap: current desktop nav is functional but does not yet behave like a command center. It exposes routes, but not enough active case context, quick search, counts, or workspace grouping.

### Current Mobile Shell

- Current implementation: bottom nav, stacked cards, one-handed capture-oriented flows.
- Reference behavior: mobile remains capture-first and step-based. It favors full-screen flows, clear progress, and focused review.
- Gap: mobile is broadly aligned. The main missing reference direction is guided step flow for capture and stronger "review before save" moments.

### Data And Logic

- Current implementation: shared local store and route logic across surfaces.
- Reference behavior: shared data, different presentation. Desktop and mobile should not fork business logic.
- Gap: current code follows the intended shared-data approach. Future desktop density should keep using the same stores and route models.

### Design Primitives

- Current implementation: Family Bench tokens and primitives are in place.
- Reference behavior: uses restrained paper/ink tokens, mono metadata, status stamps, rules, chips, soft cards, step rails, and compact evidence markers.
- Gap: the current app uses the tone and many primitives, but desktop screens should use more compact metadata rows, mono IDs, status stamps, and table-like source references.

## Route Audit

### Home

- Current implementation: route works as a case dashboard with setup state, recent entries, quick actions, counts, and cards. Desktop still reads mostly like a widened mobile dashboard.
- Intended reference behavior: desktop home is a three-column case command surface with case caption, next hearing, needs-attention list, custody/time metrics, filing progress, and recent activity visible at once.
- Gaps: no true desktop dashboard grid, no persistent right-side case context, no command/search affordance, limited simultaneous metadata.
- Desktop interaction differences: reference expects scan-and-act behavior from multiple panels; current behavior is mostly open-a-card-or-route.
- Density/layout differences: desktop should move from stacked summary cards to denser dashboard panels with compact rows and metric strips.
- Navigation differences: reference home acts as a launch hub into Evidence, Filings, Advisor, and workspace tools; current home mostly lists quick route cards.
- Context rail/sidebar expectations: desktop should show active case, next hearing, flagged count, filing status, and sync/local mode without requiring navigation.
- Mobile vs desktop expectations: mobile should remain quick-capture and recent-entry focused; desktop should become a command dashboard.

### Capture

- Current implementation: generic manual capture form with entry type, body, severity, flags, child/case context, and route to voice capture.
- Intended reference behavior: mobile capture uses a guided, step-based flow with large choices, progressive disclosure, source metadata, and review before saving.
- Gaps: capture is useful but less guided than the reference. It does not yet use the reference step rail or strong per-entry-type capture paths.
- Desktop interaction differences: capture is primarily mobile-first; desktop should support quick entry but does not need to become the dominant desktop workflow.
- Density/layout differences: desktop can keep capture compact, but should avoid over-expanding the mobile form.
- Navigation differences: reference treats capture as a primary action available from the shell, not just a normal route.
- Context rail/sidebar expectations: desktop capture may benefit from a right rail showing current case, selected child, recent related entries, and local persistence status.
- Mobile vs desktop expectations: mobile should be optimized for fast entry creation; desktop should support deliberate review and organization.

### Voice Capture

- Current implementation: placeholder/manual transcript workflow with local audio recording, transcript/body separation, draft acceptance, and local persistence.
- Intended reference behavior: voice surface has a recording stage, review stage, transcript/source separation, structured preview, metadata cards, and calm guidance that transcription comes later unless real AI is enabled in a future PR.
- Gaps: the current route has the correct source-separation foundation but is less structured visually than the reference voice flow.
- Desktop interaction differences: desktop could show transcript, reviewed body, and metadata side by side; current flow is still mostly stacked.
- Density/layout differences: reference expects source transcript, structured fields, and evidence metadata to be visible together.
- Navigation differences: voice should remain easily reachable from Capture and quick actions.
- Context rail/sidebar expectations: desktop voice capture could show selected case, child, saved audio attachment state, and future-transcription status.
- Mobile vs desktop expectations: mobile should be full-screen and recording-first; desktop should be review-and-edit-first.

### Timeline

- Current implementation: persisted local entries with filters and route links. Desktop has improved layout, but entries still appear mainly as cards.
- Intended reference behavior: desktop timeline should behave more like a case chronology: grouped by day or issue, with compact rows, source markers, flags, attachment counts, and metadata visible without opening every entry.
- Gaps: no table-like chronology rows, no grouping controls, limited bulk actions, limited inline metadata density.
- Desktop interaction differences: reference expects scanning and comparison across many entries; current interaction still favors reading one card at a time.
- Density/layout differences: desktop should use row/list density, date gutters, and metadata columns rather than large stacked cards.
- Navigation differences: timeline should remain a primary review surface, but desktop should cross-link more clearly into Evidence, Patterns, Filings, and Entry Detail.
- Context rail/sidebar expectations: right rail should show active filters, selected range, flagged totals, linked filings, and local sync status.
- Mobile vs desktop expectations: mobile timeline can stay card-based; desktop should become a compact chronology workspace.

### Evidence

- Current implementation: global Evidence route with local search, filters, sorting, entries, attachments, audio metadata, flags, and attachment counts. Desktop density is better than most routes.
- Intended reference behavior: `DesktopEvidenceV2` uses a two-pane layout with persistent filter/lens rail, grouped evidence feed, integration/source counters, and compact evidence rows.
- Gaps: current route does not yet support bulk selection, grouped day sections with richer metadata, inspector details, or source/lens counts at reference density.
- Desktop interaction differences: reference expects filtering, selecting, and linking evidence without leaving the screen. Current route still opens detail routes for deeper work.
- Density/layout differences: evidence rows should expose type, source, timestamp, attachment count, filing links, review state, and sync status more compactly.
- Navigation differences: evidence should be a primary desktop route. It should also be reachable from filings, reports, patterns, and case map source references.
- Context rail/sidebar expectations: desktop should include an inspector rail for selected evidence, source provenance, local attachment metadata, and filing/report links.
- Mobile vs desktop expectations: mobile can remain searchable cards; desktop should support list/table workflows and batch organization.

### Entry Detail

- Current implementation: entry detail shows source body, review state, private notes, court-ready summary, attachments, audio metadata, and local actions.
- Intended reference behavior: desktop should treat entry detail as an evidence inspector, showing immutable source, interpreted/reviewed fields, attachments, provenance, linked filings, and related entries in parallel.
- Gaps: current entry detail is still mostly a single-column document view. Attachments and review state are present, but not arranged as inspector panes.
- Desktop interaction differences: reference direction suggests side-by-side source/review/metadata work; current flow requires vertical scrolling.
- Density/layout differences: desktop should expose attachment rows, source metadata, review status, filing/report links, and pattern links together.
- Navigation differences: entry detail should act as a detail inspector reached from Timeline, Evidence, Reports, Filings, and Patterns.
- Context rail/sidebar expectations: desktop should use a right rail for provenance, attachment metadata, linked filings, report usage, and local sync status.
- Mobile vs desktop expectations: mobile detail can remain stacked and readable; desktop detail should be split into source, review, and metadata zones.

### Case Map

- Current implementation: case map shows local case details, children, key dates, and related case intelligence in structured panels. It supports editing basic case details.
- Intended reference behavior: `case-map.jsx` shows a visual legal/procedural timeline, document library rail, case metadata, extraction/status panels, and intake variants.
- Gaps: current Case Map is a useful local case overview, but not yet a visual map. It lacks a timeline canvas, document rail, court order/provision hierarchy, and source document status.
- Desktop interaction differences: reference expects clicking timeline nodes and documents to inspect related details; current interaction is mostly panel review/edit.
- Density/layout differences: desktop should show case timeline, document list, deadlines, and selected item details simultaneously.
- Navigation differences: case map should be a desktop organizing surface, while mobile should only expose essential case details and upcoming dates.
- Context rail/sidebar expectations: desktop should include document/source rail and selected item inspector.
- Mobile vs desktop expectations: mobile should keep case facts editable and readable; desktop should become a procedural map.

### Reports

- Current implementation: reports preview supports local entries, report types, filters, counts, key facts, source references, attachment counts, and disabled export action.
- Intended reference behavior: desktop reports should work as a preview/workbench with filter pane, source rows, report outline, and export/package placeholders.
- Gaps: no table-like source reference management, no report history, no multi-select source curation, no persistent inspector for selected report/source.
- Desktop interaction differences: reference direction expects users to compare source entries and report sections in one workspace.
- Density/layout differences: source references should be compact rows with date, type, flag, attachments, filing link, and included/excluded state.
- Navigation differences: reports should link clearly to Filings and Evidence, especially where a report is attached to a filing package.
- Context rail/sidebar expectations: desktop should show report scope, date range, included counts, disabled export status, and linked filing placeholder.
- Mobile vs desktop expectations: mobile can preview one report at a time; desktop should support source review and report assembly side by side.

### Advisor

- Current implementation: Advisor route has static/local conversation placeholders, suggested prompts, legal-information-not-advice disclaimer, case context references, and local persistence.
- Intended reference behavior: `conversations.jsx` and `DesktopAdvisorV2` show a conversation workspace with thread list, pinned/history groups, main conversation, composer, linked entries, and a right case context rail.
- Gaps: current Advisor is too single-column for desktop. It lacks a thread list, pinned/history rail, persistent case context rail, and inline linked-entry inspector.
- Desktop interaction differences: reference expects switching threads and reviewing case context while composing; current route behaves like one chat page.
- Density/layout differences: desktop should show thread list, active messages, suggested prompts, linked entries, and case facts simultaneously.
- Navigation differences: Advisor should be primary on desktop, but with strong legal-information-only positioning and no real AI until explicitly implemented.
- Context rail/sidebar expectations: desktop should include current case, next hearing, flagged count, recent entries, linked entries, and disclaimer context.
- Mobile vs desktop expectations: mobile can remain a focused chat-like flow; desktop should be a case-guidance workspace with persistent context.

### Filings

- Current implementation: local filing packages, list/detail views, statuses, checklist placeholders, linked entries, linked reports, linked attachments, and persistence. Desktop density improved but remains foundational.
- Intended reference behavior: `filing-wizard.jsx` uses a three-pane desktop builder: left step rail/checklist, center active stage/source selection, right "why this matters" and draft/packet preview. `desktop-screens.jsx` also shows exhibit groups, exhibit rows, and right-side suggestions/provenance.
- Gaps: no guided step rail, no true filing workspace stages, no table-like source selection, no drag/reorder beyond placeholders, no exhibit inspector.
- Desktop interaction differences: reference expects assembling filings without leaving the builder; current route is mostly list/detail management.
- Density/layout differences: desktop should use package list, checklist, selected package detail, source rows, and inspector/preview together.
- Navigation differences: Filings should be a primary desktop route and should receive links from Evidence, Reports, Patterns, and Entry Detail.
- Context rail/sidebar expectations: desktop should show checklist state, due date placeholder, linked counts, source provenance, and disabled future export/e-filing state.
- Mobile vs desktop expectations: mobile should support status review and simple linking; desktop should be the main preparation workspace.

### Patterns

- Current implementation: local rule-based pattern detection, neutral "possible pattern" language, supporting entries, related filing package where available, and persisted acknowledged/dismissed state.
- Intended reference behavior: `DesktopPatternDetail` uses a dense analysis surface with stats strip, visual timeline, event rows, supporting entries, and right context/action rail.
- Gaps: current route is neutral and local, which is correct, but desktop lacks full pattern detail density, event table rows, visual timeline, and inspector-like source review.
- Desktop interaction differences: reference expects drilling into a pattern and reviewing source events in context; current route is mostly card expansion/detail.
- Density/layout differences: pattern details should use compact supporting entry rows, date range, counts, linked filing/report status, and acknowledgement state.
- Navigation differences: Patterns should connect strongly to Timeline, Evidence, Filings, and Reports.
- Context rail/sidebar expectations: desktop should show why the possible pattern was detected, rule criteria, local-only status, related filing/report placeholders, and source counts.
- Mobile vs desktop expectations: mobile can use stacked pattern cards; desktop should use a pattern workbench with source rows and context rail.

### Onboarding

- Current implementation: local case setup route creates a durable case and takes priority over demo data. Basic case details are editable from Case Map.
- Intended reference behavior: reference onboarding is not represented as a single complete route, but the product direction expects guided setup and surface-specific defaults.
- Gaps: current setup is functional but not yet the full guided onboarding path with situation/conflict/representation/needs branching.
- Desktop interaction differences: desktop onboarding should be efficient and form-like; mobile onboarding should be step-by-step.
- Density/layout differences: desktop can expose more case setup fields at once; mobile should stay progressive.
- Navigation differences: first-run state is correct; later editing should remain anchored in Case Map.
- Context rail/sidebar expectations: desktop setup could show local-first, privacy, and legal-information-not-advice guidance in a side rail.
- Mobile vs desktop expectations: mobile setup should stay simple and focused; desktop setup can include more context without extra steps.

### Integrations

- Current implementation: no implemented Integrations route.
- Intended reference behavior: `integrations.jsx` shows an integrations dashboard with connection cards, sync summaries, provider identity, and a right policy/privacy rail.
- Gaps: this is future scope. Do not implement until remote/import work is explicitly approved.
- Desktop interaction differences: future desktop should show connection status, import scope, privacy summary, and item counts.
- Density/layout differences: future integrations should be card/table hybrid with policy context visible.
- Navigation differences: reference places Integrations in the desktop workspace navigation, not necessarily mobile bottom nav.
- Context rail/sidebar expectations: privacy and source-control rail is expected.
- Mobile vs desktop expectations: mobile should support simple connect/review actions; desktop should manage providers and filters.

### Safety

- Current implementation: no implemented Safety route.
- Intended reference behavior: `safety.jsx` includes mobile safety actions and desktop evidence preservation/trust workflows.
- Gaps: this is future scope and should be handled carefully because it touches safety-sensitive behavior.
- Desktop interaction differences: reference desktop safety focuses on evidence preservation, trust status, and auditability.
- Density/layout differences: desktop should show preservation state, logs, backups, and policy guidance together.
- Navigation differences: safety may belong in secondary workspace navigation and mobile emergency flows.
- Context rail/sidebar expectations: safety resources, privacy mode, and preservation status need persistent context.
- Mobile vs desktop expectations: mobile should prioritize immediate safety actions; desktop should prioritize review, preservation, and trust center visibility.

## Where Desktop Needs Specific War Room Patterns

### Split Panes

Desktop should use split panes in these areas:

- Evidence: filter/source rail plus evidence list plus selected-item inspector.
- Filings: package/checklist rail plus builder stage plus packet/source inspector.
- Advisor: thread list plus conversation plus case context rail.
- Case Map: procedural timeline/document library plus selected case item inspector.
- Reports: report selector/filter pane plus preview/source reference pane plus scope/export rail.
- Patterns: pattern list/detail plus source rows plus rule/context rail.
- Entry Detail: immutable source/review area plus attachment/provenance inspector.
- Future Integrations: provider list plus connection details plus privacy policy rail.
- Future Safety: preservation controls plus logs plus safety/privacy rail.

### Inspector Rails

Desktop inspector rails should expose stable context without forcing navigation:

- Active case and hearing/deadline context.
- Selected entry provenance, attachments, review state, and local sync state.
- Filing package checklist, linked counts, and disabled future export/e-filing state.
- Pattern rule criteria, supporting entry count, acknowledgement state, and related filing/report.
- Report scope, included sources, attachment counts, and disabled export status.
- Advisor linked entries, current case facts, and legal-information-not-advice boundary.

### Table-Like Rows

Desktop should use table-like rows instead of stacked cards where the user needs comparison:

- Evidence entries and attachments.
- Timeline chronology.
- Filing source selection and exhibit placeholders.
- Report source references.
- Case Map documents, hearings, orders, and deadlines.
- Entry attachments and review/history metadata.
- Pattern supporting events.

Rows should expose concise metadata: date, time, entry type, child, flag/severity, attachments, source label, filing links, report links, local sync state, and stable IDs where available.

### Bulk Workflows

Bulk workflows should be added incrementally and only where the underlying local data model is ready:

- Evidence: select multiple entries or attachments for linking to filings/reports.
- Filings: add multiple entries/reports/attachments to a package.
- Reports: include/exclude multiple source entries before future export.
- Patterns: acknowledge/dismiss multiple possible patterns or add supporting entries to a filing.
- Timeline: bulk flag, link, or review entries.
- Case Map: future batch classification of documents/orders once document intake is approved.

### More Metadata Visible At Once

Desktop should expose more metadata simultaneously than mobile:

- Entry IDs or short reference IDs.
- Local created/updated timestamps.
- Capture/source labels.
- Attachment kind, filename, size, local reference, and sync status.
- Audio duration where available.
- Review state, private-note presence, and court-ready-summary presence.
- Flag/severity and category.
- Child/case association.
- Filing/report links.
- Pattern acknowledgement/dismissal state.
- Local persistence and demo/offline indicators.

## Small Safe Alignment Improvements

No app behavior changes were made as part of this audit. The obvious safe improvement for PR 7A is the alignment map itself: it gives future implementation PRs route-by-route guidance without changing UX, business logic, persistence, Supabase state, or remote behavior.

Recommended next implementation PRs should be small and route-specific:

1. Advisor desktop split: add thread list and case context rail using existing local placeholder data.
2. Entry Detail desktop inspector: split immutable source, review fields, and attachment/provenance metadata.
3. Timeline table density: add desktop-only compact chronology rows while preserving mobile cards.
4. Case Map visual timeline foundation: add local-only procedural timeline layout from existing case dates.
5. Filings step rail: adapt existing local filing builder into the reference three-pane desktop structure without PDF/e-filing/AI.

## Validation Notes

- This audit is documentation-only.
- No Supabase migrations, RLS files, storage files, or remote mutation paths are touched.
- No AI, OCR, PDF generation, e-filing, remote sync, or remote writes are introduced.
- Mobile UX should remain unchanged because no app runtime code is changed by this audit.
