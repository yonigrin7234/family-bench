# Family Bench — Design System

Family Bench is an app for a pro-se parent navigating a complex, months-to-years-long family-law case. It turns the lived experience of co-parenting — every missed exchange, every difficult handoff, every call with an attorney — into court-ready evidence, filings, and strategy.

The design system serves a person who is exhausted, afraid, and under-resourced, but who has to show up in a courtroom and be taken seriously. So the aesthetic is **modern court**: official enough to be credible in front of a judge, soft enough to survive daily use at 11 pm on a bad day.

## Files in this system

| File | Purpose |
|---|---|
| `README.md` | This file — voice, foundations, usage |
| `colors_and_type.css` | All design tokens as CSS variables (no Tailwind dependency) |
| `tokens.js` | Same tokens as JS object (`window.FB`) for inline React |
| `primitives.jsx` | Low-level primitives: `Rule`, `Chip`, `Seal`, `Icon`, `Display` |
| `softkit.jsx` | Claude-style soft primitives: `PillButton`, `SoftCard`, `StepRail`, `ProgressBar`, `HelpTip`, `InfoCallout`, `BigChoice`, `MoodPicker`, `Segment`, `NextStepCard`, `FBStatusBar` |
| `ui_kits/family-bench/` | Full working UI kit with core screens as click-thru prototype |
| `preview/` | Cards for the Design System tab |
| `SKILL.md` | Agent-invocable skill manifest |

## Products designed against this system

- **Mobile app** (iOS-first, React Native/Expo) — the primary capture and check-in surface. Pocket-size, one-handed, crisis-ready.
- **Desktop web** (familybench.app) — the war room: case map, evidence feed with lenses, filing wizard, document intake, advisor conversations.

Both share tokens and most primitives. Density differs (mobile is generous, desktop is information-rich) but the visual vocabulary is one system.

---

## CONTENT FUNDAMENTALS

### Voice

The app speaks **as a calm, precise advisor who has seen a thousand cases**. Not a legal oracle. Not a hype-bot. Not a therapist. It says what it knows, flags what it doesn't, and stays on the user's side.

**Rules:**
- **Second person.** The user is "you," always. Not "the parent."
- **Active voice.** "You'd need three contemporaneous declarations" — not "Three declarations would be required."
- **Never reassure falsely.** We do not say "you've got this!" or "don't worry." We say what's true.
- **Name what's hard.** When something is expensive, slow, or unlikely to work, say so.
- **Legal information, not legal advice.** Every statute-adjacent surface includes the italic reminder.
- **Italic for asides.** When the system acknowledges feeling — *"this is hard"*, *"you don't need to be polished"* — use italic serif, never bold sans.

### Copy examples (approved)

> *"Tell me what's happening. I'll walk you through a few questions, then show you the two or three paths the law actually gives you."*

> "Your pattern is **consistent but not yet willful-by-a-reasonable-doubt**. Modification wants a pattern that's here. Contempt wants willfulness I can't confirm from your log alone."

> "This is legal information, not advice. A California family lawyer would refine this further in an hour."

> *"You're protected. Because you've opted into preservation mode, every entry is signed with three independent timestamps."*

### Copy examples (rejected)

- ❌ "We've got your back!" — false reassurance, emoji-adjacent cheer
- ❌ "Simply file your RFO in three easy steps" — minimizes; nothing about this is simple
- ❌ "Pro tip: make sure to document everything" — talks down
- ❌ "Your case is strong 💪" — emoji, false certainty

### Emoji

**Effectively none.** The only acceptable glyphs are:
- `✓` inside solid colored circles for completed steps
- `·` as a bullet/separator in microcopy
- Logo glyphs drawn as inline SVG in the integrations surface

No faces, no hands, no decorative emoji anywhere. The app is used in evidence-producing moments; emoji read as frivolous.

### Casing

- **All-caps tracked labels** (0.1em tracking, 10.5px) for section kickers: `CASE DIAGNOSTIC`, `YOUR CASE`, `WHAT'S NEXT`
- **Sentence case** for titles and buttons: `Add evidence`, not `Add Evidence`
- **Title Case** never, except in the case caption: `In re: Marriage of Chen`
- **Legal formatting preserved:** case numbers in mono (`FL-24-0918`), statute citations as-is (`CCP § 367.3`, `§ 4(c)`)

---

## VISUAL FOUNDATIONS

### Palette vibe

A **paper system**, not a pixel system. Off-white paper, near-black ink, minimal shadow, precise hairlines. Think: good legal stationery at a small firm, not corporate SaaS. Accents are oxblood (seals, attention), forest (verified, signed), sand (sub-headers), and amber (caution).

### Palette

| Role | Token | Value | Use |
|---|---|---|---|
| Paper | `--fb-paper` | `#F7F6F3` | Base background |
| Paper deep | `--fb-paper-deep` | `#EFEDE7` | Recessed panels, cards-within-cards |
| Ink | `--fb-ink` | `#14181F` | Primary text, near-black, never pure black |
| Ink soft | `--fb-ink-soft` | `#2B323D` | Secondary text |
| Ink mute | `--fb-ink-mute` | `rgba(20,24,31,0.58)` | Tertiary labels |
| Rule | `--fb-rule` | `rgba(20,24,31,0.10)` | Dividers — 0.5px preferred |
| Oxblood | `--fb-ox` | `#B44028` | Attention, seals, CTAs, kickers |
| Forest | `--fb-forest` | `#2F5A3A` | Verified, completed, success |
| Sand | `--fb-sand` | `#C9B892` | Quiet accent, fills for chips |
| Amber | `--fb-amber` | `#A76A14` | Caution, pending, warm warning |
| Urgent BG | `--fb-urgent-bg` | `#0A0B0F` | DV/panic mode only |

### Type

| Role | Family | Use |
|---|---|---|
| Display (sans) | **Inter 600, -0.03em, 1.05** | Default for titles in the Claude-soft system |
| Display (serif) | **Instrument Serif 500, -0.03em, 1.05** | Only for softer moments: "I'm with you", the Advisor opener, the safety screen |
| Kicker | Inter 600, 10.5px, 0.1em UPPERCASE | Section labels, always in oxblood or ink-mute |
| Body | Inter 400/500, 14px, 1.55 | Main reading text |
| Caption (italic serif) | Instrument Serif italic, 15-17px | *"This is hard"* moments, Advisor voice, case caption |
| Figures | JetBrains Mono, tabular, 12-16px | Case numbers, hashes, dates, custody-time percentages |

The rule: **sans is the workhorse, serif is a guest**. Italic serif shows up for emotional acknowledgment and legal formality (the case caption, the *legal information not advice* disclaimer). Never both at once.

### Backgrounds

- **Cream paper** (`#F7F6F3`) or white cards on cream — never pure white backgrounds
- **No gradients** on surfaces. The only gradients in the system are brand logos (Google Calendar, iCloud) in SVG
- **No textures**. The "paper" feel comes from the warm off-white hex alone
- **No imagery** as background. All illustration is typographic.

### Borders & radii

- **Hairlines are `0.5px solid rgba(20,24,31,0.10)`** — critical. 1px looks heavy and bureaucratic; 0.5px looks intentional
- **Radii:** 8 / 12 / 14 / 18 / 999. Cards default to 14. Pill buttons use 999. Hero cards use 18.
- **Never mix radii on adjacent elements.** A 14-radius card should contain 12- or 8-radius children, never 20.

### Elevation

Almost none. The system uses **hairlines + background tone shifts** for hierarchy, not shadows. The two shadows that exist are:
- `--fb-shadow-1` for a single subtle lift (toggle knobs, tooltip)
- `--fb-shadow-2` for modals and menus only

### Corners & composition

- **Left-aligned everything.** Centered text is reserved for confirmations and empty states.
- **Kicker → title → body** is the canonical block pattern: all-caps tracked label (10.5px oxblood), then title (sans or serif display), then 14px body.
- **Two-panel desktop layouts** are standard. Left sidebar is navigation + case spine; main is the content; right rail for context/help when needed.

### Motion

- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` — a soft ease-out with a tiny bit of motion at the end
- **Duration:** 150ms (fast) or 220ms (default)
- **Use for:** opacity fades on reveal, toggle thumbs sliding, accordion expands, step-rail progression
- **Never use:** springy bounces, parallax, sliding-up-from-the-bottom overlays with physics
- **No entrance animations** on page load. Content is there when you need it.

### Hover & press

- **Ghost buttons on hover:** background goes from transparent to `var(--fb-paper-deep)`, no other change
- **Primary buttons on hover:** background goes from `--fb-ink` to `#000`, no shadow change
- **Press:** scale 0.98, duration 80ms, release 120ms. Reserved for CTAs and big choice cards.

### Transparency & blur

- **Blur:** none in UI. The iOS status bar is the only place backdrop-blur appears, and it's device chrome, not our system.
- **Transparency:** used for ink-mute/ink-faint (rgba on `#14181F`) and on destructive-on-paper warnings (oxblood at ~15% opacity wash). Never used to create frosted panels.

### Iconography

- **Inline SVG, 1.5–1.8 stroke weight, rounded caps, `currentColor`**. Never filled, never outlined from a third-party pack.
- **Size:** 14px (inline with body), 18px (tappable), 22px (brand logos in integrations).
- **Stroke color** matches text color in the same context — icons disappear into hierarchy, don't fight it.
- **Brand logos** (for integrations surface only) are hand-drawn SVG with authentic colors: Google Calendar blue + 31, Gmail envelope, iCloud gradient, etc. These are the only "colorful" surfaces in the app.

### Layout rules

- **Mobile frame:** 402 × 874 (iOS device), 54px top padding for status bar, 82px bottom for tab bar
- **Desktop frame:** 1440-ish, sidebar 280px, main flex, optional right rail 320px
- **Slide deck / artboard:** 1360 × 874 for desktop artboards (inside a Chrome browser frame)
- **Grid:** 4pt spacing. 20px is the standard horizontal padding on mobile. 40px on desktop.

---

## ICONOGRAPHY

Icons are **inline SVG with `stroke="currentColor"`**, weight 1.5–1.8, round caps, round joins. The full set lives in `primitives.jsx` as the `I` object (one path string per icon). Common ones:

- `I.mic`, `I.plus`, `I.check`, `I.chev`, `I.clock`, `I.lock`, `I.shield`, `I.calendar`, `I.chat`, `I.file`, `I.eye`, `I.spark`, `I.bolt`, `I.waveform`

Brand logos for connectors live in `integrations.jsx` as the `Logos` object — authentic-color SVG for Google Calendar, Gmail, iCloud, Dropbox, Google Drive, Docusign, Zoom, Ring, Nest, OurFamilyWizard, TalkingParents, TurboCourt, Alameda Superior Court seal, iMessage, WhatsApp, Apple Health, Venmo, Stripe, Apple.

If a new icon is needed and not in the set, draw it in the same style (1.5 stroke, round caps, currentColor) — don't import from a third-party pack.

---

## Usage — two entry points

### For prototyping / design artifacts (HTML)

Pull `tokens.js` + `primitives.jsx` + `softkit.jsx` into a Babel-loaded HTML file. Everything namespaces under `window.FB` and the component globals (`PillButton`, `SoftCard`, etc). See `ui_kits/family-bench/index.html`.

### For production (CSS variables)

Import `colors_and_type.css` and reference `var(--fb-ink)`, `var(--fb-paper)`, etc. All tokens are available. Components can be rebuilt in React Native / Tailwind / whatever — the tokens are the contract.

---

## Status

Designed surfaces so far: Home, Voice capture, Guided event-capture flow (Who → Scheduled → Actual → Mood → Witnesses → Review), Evidence feed + lenses, Pattern detection, Advisor chat, Case Diagnostic (3 legal paths compared), Case Map + Document Intake, Filing Builder wizard, DV Safety (panic mode + stealth + resources + evidence preservation), Integrations / Connectors, Conversations / thread history.

Still to do: Onboarding / first-run, Chain-of-custody certificate PDF preview, E-filing submit confirmation, Court portal status sync, Notary flow.

---

## Caveats

- **Typography:** Instrument Serif + Inter + JetBrains Mono are Google Fonts — no license flag. If Instrument Serif isn't available, fall back to Source Serif 4 or Georgia; the aesthetic holds.
- **Brand logos** in `integrations.jsx` are approximations of real company marks. For production you should swap to official SVG from each brand's developer portal.
- **Alameda Superior Court seal** is a generic stand-in — replace with the real court seal in production.
- **No React Native components yet** — the design is expressed in React-for-web + inline styles. Porting to RN Stylesheet/NativeWind is a mechanical lift; tokens map directly.
