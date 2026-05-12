# Build Roadmap

Cross-references `docs/family-bench-complete-feature-list.md` (51 sections)
against the current implementation, then groups remaining work into
execution phases. This is the working contract for "what to build next"
once parity polish is done.

## Companion docs

- `docs/family-bench-complete-feature-list.md` — every feature the product does
- `docs/feature-surface-split.md` — which surface owns each section
- `docs/surface-architecture.md` — per-route capability matrix
- `docs/prototype-parity-plan.md` — parity rules + currently deferred items
- `lib/surface/surfaceRegistry.ts` — typed per-route metadata

## Status legend

| Code | Meaning |
|---|---|
| ✅ Built | Feature is shipped with real wiring |
| 🟡 Partial | Some sub-features exist, others missing |
| ⏳ Placeholder | Route or stub exists, no real wiring |
| ⚪ Not started | Nothing exists |
| 🚫 Deferred | Explicitly out of parity-pass scope per prototype-parity-plan.md |

## Status — section by section

| § | Section | Status | Notes |
|---|---|---|---|
| 1 | Account & onboarding | 🟡 | Local case setup works; no auth/biometric/2FA/email-verify |
| 2 | Case setup | ✅ (local) | Single case, basic fields. §29 multi-case is gap. |
| 3 | Entry capture · 10 types | 🟡 | Guided wizard built; data model has subset of type-specific fields |
| 4 | Capture methods | 🟡 | Manual + voice placeholder + photo picker + web doc picker |
| 5 | Voice-to-entry | 🟡 | Transcript flow placeholder; AI structuring 🚫 |
| 6 | Forensic metadata | 🟡 | content_hash + timestamps; GPS/EXIF capture not wired |
| 7 | Entry management | 🟡 | Edit body, mark reviewed, soft delete via hooks; no bulk actions UI |
| 8 | Evidence organization | 🟡 | Pool exists; no exhibit groups, no drag-reorder |
| 9 | Search & filter | 🟡 | Basic search on Evidence; no saved presets, no facets |
| 10 | Views | 🟡 | Feed/Timeline ✅; calendar/pattern views not built |
| 11 | Filing packages | 🟡 | List + detail; no documents tab, no exhibits tab, no PDF |
| 12 | Court forms | ⚪ | Needs state-specific form library |
| 13 | Reports · 8 types | 🟡 | Timeline summary only; other 7 reports not wired |
| 14 | Custody calculator | 🟡 | Calculation foundation exists; no dedicated screen yet |
| 15 | Automated calculations | 🟡 | Some derivations via selectors |
| 16 | AI Advisor | ⏳ / 🚫 | Static placeholder. Real AI 🚫. |
| 17 | Case Diagnostic | ⚪ / 🚫 | Real version needs AI. Rule-based simulation possible. |
| 18 | Document intake | 🚫 | Needs OCR |
| 19 | Court orders | 🟡 | Local model + provision linking |
| 20 | Key dates | 🟡 | Local model; UI for managing them is thin |
| 21 | Notifications | ⚪ | Needs background runtime |
| 22 | Integrations · 27 services | 🚫 | OAuth/parsers all out of scope for parity pass |
| 23 | E-filing | 🚫 | Needs court APIs |
| 24 | Service of process | 🚫 | Needs court APIs |
| 25 | Practitioner sharing | ⏳ | Placeholder UI |
| 26 | Pattern detection | 🟡 | Rule-based; AI patterns 🚫 |
| 27 | Dashboard / Home | ✅ | Parity-aligned mobile + desktop |
| 28 | Multi-child support | 🟡 | Children defined; per-child filtering UI thin |
| 29 | Multi-case support | ⚪ | Single case only |
| 30 | Security & privacy | 🟡 | Local-first; no biometric/2FA/auto-lock |
| 31 | DV / safety | ⏳ | Placeholder. Real panic/decoy/stealth 🚫 (sensitive scope) |
| 32 | Accessibility | 🟡 | aria-labels present; no contrast/dyslexia/reader audit |
| 33 | Localization | ⚪ | English only |
| 34 | Data management | 🟡 | JSON preview; no scheduled backup |
| 35 | Offline | ✅ | Local-first throughout |
| 36 | Subscription | ⚪ | No billing |
| 37 | Support | ⚪ | No help center |
| 38 | Tone enforcement | ✅ | Manual; no AI to enforce against yet |
| 39 | Analytics | ⚪ | No analytics |
| 40 | External legal tools | ⚪ / 🚫 | All external integrations 🚫 |
| 41 | Apple Watch | ⚪ | Future work |
| 42 | Browser extension | ⚪ | Future work |
| 43 | Print & physical | 🚫 | Needs PDF pipeline |
| 44 | Court-specific workflows | 🚫 | Needs state form library |
| 45 | Docket monitoring | 🚫 | Needs court APIs |
| 46 | Collaboration | 🚫 | Needs accounts + comments |
| 47 | Account lifecycle | ⚪ | No accounts yet |
| 48 | Versioning | 🟡 | Entry edit audit; no side-by-side compare |
| 49 | AI capabilities | 🚫 | Voice/OCR/drafting/patterns all need AI |
| 50 | Platforms | 🟡 | iOS/Android/Web ✅; Watch/extension ⚪ |
| 51 | Memory | 🟡 | Memory index UI exists; cross-device sync 🚫 |

## Execution phases

Each phase is a coherent shippable PR-set. We stay within the parity-plan
guardrails (no AI, no OCR, no remote writes, no PDF generation, no
e-filing, no migrations) until a future scope expansion explicitly
authorizes those.

### Phase 1 · Foundation depth (3–5 PRs)

Goal: turn the partial sections into real product surfaces with their
own data wiring, no new infra.

1. **Custody Calculator** (§14) — new mobile-primary route. Pulls
   `entry.custody_period` from existing entries, calculates breakdown
   by period (mine/theirs/transition/neutral) over a date range,
   shows BarCompare. "Scheduled vs actual" comparison waits for a
   custody-schedule data model in Phase 2.
2. **Key Dates manager** (§20) — list, add, edit, mark priority, link
   to court order. Already in Case Map; promote to dedicated section
   with countdowns on Home (already done) and inline edit.
3. **Court Orders manager** (§19) — list, add, edit provisions, mark
   active/superseded, expiration dates with countdown.
4. **Multi-child + Multi-case** (§28, §29) — child filter pill on
   Home/Timeline/Evidence/Reports; case switcher in TopChrome.
5. **Reports drilldown** (§13) — wire the 7 remaining report types
   (Late incidents, Expenses, Flagged incidents, Compliance,
   Communication, Full journal, Bench brief) on top of existing
   `useReportPreviewState` hook. All preview-only, no PDF.

### Phase 2 · Workspace density (3–4 PRs)

Goal: make Evidence, Filings, and Timeline feel like real war-room
surfaces.

6. **Exhibit groups** (§8) — local data model for grouping attachments
   into A/B/C exhibits, per-filing labels.
7. **Filing package tabs** (§11) — Documents tab (ordered form
   placeholders), Evidence tab (linked entries by exhibit group),
   Checklist tab (completion).
8. **Bulk actions** (§7) — multi-select on Timeline/Evidence, bulk
   flag/unflag, bulk-link-to-filing, bulk-export-preview.
9. **Calendar view** (§10) — monthly heatmap on Timeline.
10. **Search saved presets** (§9) — name a filter combo, recall it.

### Phase 3 · Capture depth (2–3 PRs)

Goal: every entry type gets its prototype-spec fields.

11. **Type-specific fields** (§3) — Pickup/Dropoff: scheduled_at +
    actual_at + late_minutes derivation. Visit Denied: scheduled
    start/end + reason + actions taken. Child Statement: spontaneous
    flag + EC 1240 candidate. Medical: provider + visit type + both
    parents notified. Expense: amount + category + reimbursement
    status. Communication: platform + direction + response time.
12. **GPS + EXIF capture** (§6) — capture device GPS at save time
    when permission granted; preserve photo EXIF on attachment.
    Mobile-only.
13. **Witness model** (§3) — local witness records linked to entries,
    contact info encrypted-at-rest placeholder.

### Phase 4 · Safety + accessibility + memory (2 PRs)

14. **Safety surface depth** (§31) — emergency resources directory,
    safety plan editor (local), restraining order tracking list, panic
    placeholder. Real panic/decoy/stealth stays 🚫 until explicitly
    scoped.
15. **Accessibility + memory index** (§32, §51) — full a11y audit,
    contrast pass, screen-reader labels, dyslexia-friendly toggle,
    settings memory index view.

### Phase 5 · Non-AI versions of advanced surfaces (3 PRs)

16. **Diagnostic — rule-based** (§17, no AI) — interactive branching
    questionnaire that maps answers to 2–3 deterministic legal-path
    summaries (Modification / Contempt / Mediation / Fee Waiver).
    Phrased as "options" not "advice." No statute interpretation —
    just route the user to relevant filings.
17. **Integrations shell** (§22, no OAuth) — UI for each of the 27
    connector cards with Connect/Disconnect buttons that go to a
    "Coming later" placeholder. Local "imported items" counter wired
    to existing entries with `source_label`.
18. **Practitioner sharing depth** (§25) — local-only invite + scope
    matrix + audit log placeholders. Real backend permissions remain
    🚫.

### Deferred (require explicit go-ahead)

- AI advisor & all AI capabilities (§16, §17 real, §26 AI, §49)
- OCR + document intake (§18)
- E-filing + service automation (§23, §24)
- Court PDF generation (§11 final, §12, §13 final, §43)
- Real OAuth integrations (§22 actual connections)
- Real account system & billing (§1, §36, §47)
- Notification runtime (§21)
- Real practitioner permissions with row-level security (§25 backend)
- Localization (§33)
- Docket monitoring (§45)
- Court-specific form library (§44)
- Apple Watch + browser extension (§41, §42)
- Real DV panic / decoy / stealth (§31 real-functioning)

## What ships in this current sprint

The next chunk of work this session focuses on Phase 1 items, starting
with §14 Custody Calculator since it has the most data wiring already
present and the highest-visibility benefit per minute of work.

The rest of Phase 1 follows in subsequent PRs in this same branch.

## Update process

When any item ships, move it from 🟡/⏳/⚪ to ✅ here AND update the
corresponding status entry in
`docs/family-bench-complete-feature-list.md` lines 5–15 ("Current
implemented MVP includes").
