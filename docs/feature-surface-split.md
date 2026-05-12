# Feature Surface Split

> The canonical product spec is `docs/product-spec.md`. This mapping
> originally tracked the 51-section feature list and remains useful for
> "where does feature X live" questions. Spec sections (1–79) map
> approximately 1:1 to feature-list sections for product capabilities,
> with the spec adding flow/state/behavior detail beyond surface
> placement.

Source-of-truth mapping from `docs/family-bench-complete-feature-list.md`
to the two surfaces defined in `docs/surface-architecture.md`. For every
one of the 51 feature sections, this doc states whether it lives on
**Mobile**, **Desktop**, or **Both** — and *why*.

Read this before adding a feature to a new screen. If the feature does
not appear here, add it (and discuss the placement in the PR).

## Companion documents

- `docs/family-bench-complete-feature-list.md` — what the product does
- `docs/surface-architecture.md` — the two-surface principle + per-route capability matrix
- `docs/prototype-parity-plan.md` — current parity scope and guardrails
- `lib/surface/surfaceRegistry.ts` — machine-readable per-route metadata

## Surface principle (recap)

> Mobile = capture, review, quick guidance.
> Desktop = organize, analyze, prepare, export.
> **Data is shared; presentation changes by surface; business logic must
> never fork.**

## Classification taxonomy

| Class | Meaning |
|---|---|
| **Mobile-Only** | The feature can only meaningfully exist on a phone. Hardware-bound (camera, GPS, watch, panic button) or context-bound (mid-exchange voice capture). Do not attempt on desktop. |
| **Mobile-Primary** | Designed and optimized for phone. Desktop may surface a read-only view or admin control, but the canonical experience is mobile. |
| **Shared** | Equal weight on both surfaces. Same store, same logic, density may differ. |
| **Desktop-Primary** | Designed for the war-room context — multi-column, multi-document, multi-pane. Phone may surface a summary or accept a tap, but the work happens on desktop. |
| **Desktop-Only** | The feature requires desktop affordances: browser extension, multi-tab document editing, multi-pane review, print binders. Do not attempt on mobile. |

## Section-by-section split

Cross-references use the section numbers from `family-bench-complete-feature-list.md`.

### Account & onboarding

| § | Section | Class | Rationale |
|---|---|---|---|
| 1 | Account & onboarding | Shared | Sign in / verify / reset from anywhere. Biometric unlock on mobile, password manager on desktop, but the model is one. |
| 2 | Case setup | Shared | Create cases anywhere. First-run is mobile-friendly; deeper case-spine edits land naturally on Case Map (desktop-strong). |

### Capture

| § | Section | Class | Rationale |
|---|---|---|---|
| 3 | Entry capture — 10 entry types | **Mobile-Primary** | Capture happens in life: an exchange, a denied visit, a courthouse parking lot. Desktop offers the same form for back-fill, but mobile is canonical. |
| 4 | Capture methods | **Mobile-Only / Mobile-Primary** | Camera, voice dictation, Siri shortcut, share sheet, quick-capture widget, screenshot reader — all phone affordances. Bulk import (CSV/JSON) and email-forward capture are the only methods that work cleanly on desktop. |
| 5 | Voice-to-entry | **Mobile-Primary** | Tap-mic, live waveform, offline queue, exchange voice mode. Desktop can show the result and let you edit fields, but recording is mobile. |
| 6 | Forensic evidence metadata | **Mobile-Primary (capture) · Shared (display)** | GPS / EXIF / device-ID hashing happens at capture time = phone. Chain-of-custody review and certificate generation are desktop-strong. |

### Working with entries

| § | Section | Class | Rationale |
|---|---|---|---|
| 7 | Entry management | Shared | Edit, soft-delete, flag, link, change type. Bulk actions feel better on desktop, single-entry actions feel fine on mobile. |
| 8 | Evidence organization | **Desktop-Primary** | One pool, exhibit groups, drag-to-reorder, per-filing labels — multi-column work. Mobile shows the pool and attachment counts. |
| 9 | Search and filter | Shared | Quick search on mobile. Persistent saved filters + cross-field facets on desktop. |
| 10 | Views (feed/calendar/timeline/pattern) | Shared | Density differs by surface; same underlying data and toggles. |

### Filings and forms

| § | Section | Class | Rationale |
|---|---|---|---|
| 11 | Filing packages | **Desktop-Primary** | Multi-tab construction (Documents · Evidence · Checklist), reorder, exhibit grouping, AI suggestions — needs space. Mobile shows package list and progress only. |
| 12 | Court forms / declarations | **Desktop-Only** | Pleading-paper 28-line preview, statute citations, exhibit refs, multi-page editing. Not viable on phone. |
| 23 | E-filing | **Desktop-Only** | Fee waiver, payment, e-filing API submission, rejection handling. Phone may receive a confirmation push, but the workflow is desktop. |
| 24 | Service of process | **Desktop-Primary** | Generate POS forms, track who/how/when/by-whom. Mobile can log a "served" event; everything else is desktop. |

### Reports and analysis

| § | Section | Class | Rationale |
|---|---|---|---|
| 13 | Reports (8 types) | **Desktop-Primary** | Preview / filter / generate / link-to-filing — needs side-by-side preview. Mobile shows a list and can read a generated report. |
| 14 | Custody calculator | **Mobile-Primary** | Quick "what's my time-share right now?" from anywhere. Detailed weekly breakdown view is fine on either surface but starts on mobile. |
| 15 | Automated calculations | Shared | Late minutes, hours lost, totals, response time, deadline countdowns — back-end derivations, both surfaces consume. |
| 26 | Pattern detection | **Desktop-Primary** | Review, acknowledge, cross-reference with filings. Patterns surface as inline hints on mobile home but the workspace is desktop. |

### Advisor & diagnostic

| § | Section | Class | Rationale |
|---|---|---|---|
| 16 | AI Case Advisor | Shared | Conversational on mobile (quick questions). Inspector-style cross-reference UI (clickable entry IDs in side panel) is desktop. |
| 17 | Case Diagnostic flow | **Desktop-Primary** | 2-3 legal paths compared side by side with statutes / forms / evidence / gaps. Phone may show summary cards. |

### Case structure

| § | Section | Class | Rationale |
|---|---|---|---|
| 18 | Case document intake / Case Map | **Desktop-Primary** | Upload PDFs, OCR review, structured timeline of all court events. Mobile shows the Case Map summary. |
| 19 | Court orders | **Desktop-Primary** | Provision-by-provision editing, hierarchy management, expiration. Mobile shows active orders and lets you tap a provision for context. |
| 20 | Key dates | Shared | Mobile is best for countdown + push notifications. Desktop is best for date-by-date management and bulk edits. |

### Notifications & integrations

| § | Section | Class | Rationale |
|---|---|---|---|
| 21 | Notifications | **Mobile-Primary** | Push, SMS, in-app, widget. Email/SMS routing also via server. Desktop shows the notification center. |
| 22 | Integrations (connector hub) | **Desktop-Primary** | OAuth flow + 27-service hub. Phone can approve a connect from a notification, but managing connections is desktop. |
| 40 | External legal tools | **Desktop-Primary** | Docusign, PACER, bar referrals, expert directory, process servers. Admin surfaces. |
| 45 | Docket monitoring | **Desktop-Primary** | Configure, monitor, auto-detect new filings. Phone gets the alerts. |

### Collaboration & sharing

| § | Section | Class | Rationale |
|---|---|---|---|
| 25 | Practitioner sharing | **Desktop-Primary** | Invite, scope, audit, revoke. Practitioner dashboard is desktop-only. Mobile shows shared status and any incoming comments. |
| 46 | Collaboration | **Desktop-Primary** | Co-counsel mode, comment threads, @-mentions. Phone can reply to a mention via push. |

### Home / dashboard

| § | Section | Class | Rationale |
|---|---|---|---|
| 27 | Dashboard / Home | Shared | Different layouts, same data. Mobile = greeting → case strip → next step → countdown → quick capture → today. Desktop = greeting + hearing in hero, multi-column work-session dashboard. |

### Cross-cutting

| § | Section | Class | Rationale |
|---|---|---|---|
| 28 | Multi-child support | Shared | Per-child filtering everywhere. |
| 29 | Multi-case support | Shared | Switch / archive case from anywhere. |
| 30 | Security and privacy | Shared | Biometric on mobile, password manager + 2FA on desktop. Same encryption / audit model. |
| 31 | DV / safety features | **Mobile-Only / Mobile-Primary** | Panic button, decoy mode, hidden icon, emergency dial, silent activation must be reachable in one tap from the phone home screen. Desktop has the resource library and safety-plan editor. |
| 32 | Accessibility | Shared | VoiceOver/TalkBack on mobile; full keyboard navigation on desktop. Same a11y model across. |
| 33 | Localization | Shared | English + Spanish at minimum. Auto-detect, manual switch, both surfaces. |
| 34 | Data management | Shared | Export from anywhere. Scheduled backups configured on desktop, run automatically. |
| 35 | Offline behavior | **Mobile-Primary** | Capture always works offline. Desktop is online-typically; offline graceful but secondary. |
| 36 | Subscription and billing | Shared | Upgrade/downgrade/cancel anywhere. App-Store IAP on iOS, web checkout on desktop — same subscription record. |
| 37 | In-app support | Shared | Help center, chat, bug reporting on both. |
| 38 | Tone and principles | Shared | Server-enforced AI tone, applies to every output regardless of surface. |
| 39 | Analytics and consent | Shared | Same consent model, transparency report viewable on both. |
| 47 | Account lifecycle | Shared | Sign up / pause / resume / delete from anywhere. |
| 48 | Versioning | **Desktop-Primary** | Document / filing / order version compare needs side-by-side. Mobile shows version history list. |
| 49 | AI capabilities (back-end) | Shared | Server-side; both surfaces consume. |
| 51 | Memory | Shared | The whole point is that memory follows the user across devices. Surface differences are presentation only. |

### Platform-bound surfaces

| § | Section | Class | Rationale |
|---|---|---|---|
| 41 | Apple Watch / wearable | **Mobile-Only** | By definition. Quick capture, exchange timer, deadline view, panic button. |
| 42 | Browser extension | **Desktop-Only** | By definition. Capture from Gmail/OFW/WhatsApp Web. |
| 43 | Print and physical | **Desktop-Only** | Exhibit binders, pleading paper, mailing labels. |
| 44 | Court-specific workflows | **Desktop-Primary** | State/county form library, local rules, tentative ruling lookup. Mobile shows holiday/closure alerts. |
| 50 | Platforms | n/a | Inventory section — every other class consumes it. |

## Hard splits that should never move

These exist on exactly one surface forever. If a future spec contradicts
this, raise it as a scope question before implementing.

**Mobile-Only forever:**
- Camera, GPS, EXIF capture (§4, §6)
- Voice capture mid-exchange, hands-free dictation (§5)
- Siri Shortcut / quick-capture widget / share-sheet entry (§4)
- Apple Watch surfaces (§41)
- Panic button, decoy mode, hidden icon, emergency dial (§31)

**Desktop-Only forever:**
- Multi-document filing wizard with form rendering (§11, §12)
- Pleading-paper PDF generation and preview (§12)
- E-filing submission flow (§23)
- Browser extension (§42)
- Exhibit binder print, mailing-label print (§43)
- Multi-pane version compare (§48)

## Implementation status reality check

Of the 51 sections, the MVP currently has (per `family-bench-complete-feature-list.md` lines 5–15):

- §1 account / §2 case setup (local only, no remote auth yet)
- §3 entry capture (single form, not the prototype's guided multi-step interview)
- §7 entry management (partial)
- §8 evidence organization (local pool, no filing-package drag-yet)
- §10 views (feed, timeline)
- §11 filings (drafts only, no PDF output)
- §13 reports (preview only, no PDF generation)
- §14 custody calculator (foundation)
- §19 court orders / §20 key dates (foundation)
- §27 home (post-mobile-parity-pass, prototype-aligned)
- §31 safety (placeholder)
- §35 offline (local-first throughout)
- §51 memory index (foundation)

The parity plan (`docs/prototype-parity-plan.md`) explicitly defers
**AI · OCR · PDF generation · e-filing · remote sync · Supabase migrations
· RLS changes · storage policy changes**. That means most Desktop-Primary
work in this doc is intentionally on the roadmap, not the current
sprint.

## Process for adding a new feature

1. Find the section in `family-bench-complete-feature-list.md`. If it's
   not there, add it.
2. Decide the class using the rationale framework above. If unclear,
   default to Shared and split later.
3. Update this doc and `lib/surface/surfaceRegistry.ts` together — the
   registry drives navigation visibility, this doc drives feature
   placement.
4. Ship behind whatever feature flag or surface gate makes sense.

## Open questions for future review

- Should §16 Advisor evolve into a Mobile-Primary canonical "quick
  questions" surface and Desktop-Primary "long-form research workspace"?
  Currently classed Shared but the surfaces may diverge.
- §17 Case Diagnostic currently Desktop-Primary; on mobile we may want a
  read-only "show me my last result" view.
- §26 Pattern detection — the *review* is desktop, but *acknowledgement*
  could be a mobile push action. Consider when wiring real patterns.
- §22 Integrations OAuth approval from mobile push notifications —
  hybrid surface flow. Worth a dedicated design pass.
