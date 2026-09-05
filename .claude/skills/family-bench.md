---
name: family-bench-design-system
description: Family Bench design system — Claude.ai-inspired warm minimal UI for a family law evidence app. Use when building ANY UI component, screen, layout, or style. Read BEFORE writing any JSX, any className, any styled component. This overrides generic design defaults from other skills with Family Bench-specific tokens, anti-patterns, and component specs verified from 305 Claude.ai Mobbin screenshots.
---

# Family Bench Design System

**Reference:** Claude.ai's design language. Verified from 107 iOS screenshots, 198 desktop screenshots, assistant-ui clone source code, and shadcn Claude theme.

**Core principle:** A stressed parent at 11pm should feel like they walked into a calm, competent professional's office. Not a startup. Not an app. A tool that takes their situation seriously.

**Test for every component:** "Does it look like it belongs in Claude.ai with a blue accent?" If yes, ship it. If no, fix it.

---

## Colors

### Light Mode
```
Page background:  #F5F5F0  (warm cream — NOT white, NOT gray)
Card/surface:     #FFFFFF
Text primary:     #1A1A18  (warm near-black)
Text muted:       #6B6A68
Text placeholder: #9A9893
Border:           rgba(0,0,0,0.08)  (almost invisible)
Shadow:           0 0.25rem 1.25rem rgba(0,0,0,0.035)
Accent:           #2563EB  (blue — the ONLY accent color)
Accent hover:     #1D4ED8
Accent light bg:  #DBEAFE
Accent lighter:   #EFF6FF
Success:          #059669  / bg #ECFDF5
Warning:          #D97706  / bg #FFFBEB
Danger:           #DC2626  / bg #FEF2F2
```

### Dark Mode
```
Page background:  #2B2A27  (warm dark — NOT pure black)
Card/surface:     #1F1E1B
Surface hover:    #333330
Text primary:     #EEEEEE  (warm white)
Text muted:       #9A9893
Border:           rgba(255,255,255,0.08)
Accent:           #3B82F6  (slightly brighter blue for dark)
```

### NativeWind Classes
Always use Tailwind tokens, NEVER hardcode hex values in components:
```
bg-page          bg-surface        bg-dark-page      bg-dark-surface
text-text-primary text-text-muted   text-accent
border-border    shadow-card       rounded-card      rounded-button
font-display     font-ui           font-mono
```

---

## Typography

### Fonts
- **Serif (font-display):** Georgia — for page titles, headings, greeting text. Gives legal authority.
- **Sans-serif (font-ui):** System font — for body, labels, timestamps, badges, buttons, nav. Better readability for data.
- **Mono (font-mono):** SF Mono — for case numbers, legal references only.

### Scale
```
display:    28px  weight 600  serif    (page greetings, major headings)
title:      22px  weight 600  serif    (page titles: "Journal", "Dashboard")
heading:    18px  weight 600  serif    (section headers, entry titles)
subheading: 16px  weight 500  sans     (card titles, nav items)
body:       15px  weight 400  sans     (entry content, descriptions)
label:      14px  weight 500  sans     (form labels, button text)
caption:    13px  weight 400  sans     (timestamps, metadata)
badge:      11px  weight 500  sans     (badges, fine print)
```

### ABSOLUTE RULE: Maximum weight is 600. NEVER use 700 (bold).

---

## Components

### Entry Card
```
bg-surface, border border-border, rounded-card (12px), p-4, mb-2
Header: [Badge] [timestamp caption muted] [⋯ overflow menu right]
Body: body size, text-primary, leading-relaxed
Metadata: caption size, muted, inline with icons, 16px gap
Flagged: left-3 border-danger OR small red dot
```

### Badge/Pill
```
rounded-md (6px), px-2 py-0.5, badge size (11px), weight 500, no border
Journal:    bg-accent-lighter  text-accent
Incident:   bg-warning-light   text-warning
Denied:     bg-danger-light    text-danger
Expense:    bg-success-light   text-success
Compliance: bg-page            text-muted
```

### Buttons
```
Primary:     bg-[#1A1A18] text-white rounded-button h-[52px] w-full
Accent:      bg-accent text-white rounded-button h-[52px]
Secondary:   bg-[#F0F0EA] text-text-primary rounded-button h-[52px]
Ghost:       bg-transparent text-text-muted px-3 py-2
Destructive: bg-transparent text-danger (always at bottom, after divider)
Icon circle: bg-surface w-11 h-11 rounded-full items-center justify-center

ALL buttons: active:scale-[0.98] transition-all duration-claude ease-claude
```

### Form Fields
```
bg-surface border border-border rounded-input (12px) px-4 py-3 h-12
Label above: caption size, muted, mb-1.5
Focus: border-accent (just color change, no shadow)
Textarea: same styling, min-h-[120px]
```

### Bottom Sheet (capture menu)
```
@gorhom/bottom-sheet
bg-surface rounded-t-modal (16px) p-5
Handle: w-10 h-1 bg-border rounded-full self-center mb-4
Items: icon (20px muted) + label (body) + description (caption muted), py-3
4 options: Voice Entry, Exchange Log, Photo, Text Note
```

### Quick Entry Bar (floating above tab bar)
```
bg-surface rounded-modal (16px) shadow-card mx-4 mb-2 px-4 py-3
Placeholder: "What happened?" in placeholder color
Left: + icon (attach)  Right: mic icon, send button (accent circle)
```

### Tab Bar (mobile, 5 tabs)
```
bg-transparent (sits on cream page background)
NO colored background, NO top border shadow
Icons: 22px Lucide, 1.75px stroke
Active: text-accent    Inactive: text-text-muted
Labels: badge size (11px), below icon
Tabs: Journal, Dashboard, Timeline, Filings, More
```

### Sidebar (desktop, collapsed/expanded)
```
Collapsed: w-12, icons only, bg-page (same as page — seamless)
Expanded: w-60, icons + labels
Top: "Family Bench" in font-display (serif, semibold)
Nav items: icon (20px) + label (subheading), py-3
Active: text-accent, bg-accent-lighter rounded-lg
Bottom: avatar circle (initials) + name + plan type
```

### Page Header
```
h-11 (44px), flex items-center justify-between px-4
Left: back arrow or menu icon (in 44x44 circle)
Center: title (subheading, sans, 500)
Right: action button (in 44x44 circle)
bg-transparent (inherits page bg), no bottom border
```

---

## Navigation
```
Mobile (<768px):  Bottom tab bar (5 tabs)
Desktop (≥768px): Sidebar (collapsed 48px / expanded 240px)

Journal    → BookOpen icon     (home, entry feed)
Dashboard  → LayoutDashboard   (stats, charts)
Timeline   → Clock             (calendar view)
Filings    → FileText          (reports, declarations)
More       → MoreHorizontal    (settings, research, comms)
```

---

## Interaction States

### Every screen MUST have these states:
- **Loading:** Skeleton with opacity pulse (0.5→1.0). NO shimmer.
- **Empty:** Serif heading + muted body text explaining what to do. NO illustrations.
- **Error:** Muted text with retry action. Calm, not alarming.
- **Offline:** Top bar indicator "Syncing..." or "X entries pending"

### Transitions
```
Default: 300ms cubic-bezier(0.165, 0.85, 0.45, 1)
Button press: active:scale-[0.98]
Modal: slide up, 200ms ease
Sidebar: slide in from left, 250ms ease
Page change: simple crossfade, 150ms
Save confirm: checkmark appears → fades after 1.5s
```

---

## Voice → Evidence (Side-by-Side Reveal)
After AI processes a voice entry, show:
- **Top (muted, smaller):** Raw transcript — what they said
- **Bottom (full size, styled):** Structured evidence card with badge, factual summary, metadata
- User confirms or edits the structured version
This is the magic moment. Make the transformation visible.

---

## Icons
Library: lucide-react-native
Size: 20px (default), 16px (compact), 22px (tab bar)
Stroke: 1.75px
Color: always inherits current text color via className

---

## Anti-Patterns — ABSOLUTE RULES (violations invalidate the design)

1. NO gradient backgrounds — anywhere, ever
2. NO colored card backgrounds — cards are ALWAYS white (bg-surface)
3. NO border-radius > 16px except circles (rounded-full)
4. NO multiple accent colors — ONE blue, that's it
5. NO decorative illustrations — empty states use text only
6. NO emoji as UI elements — Lucide icons only
7. NO font-weight 700+ — 600 is the maximum
8. NO uppercase text — not even badges or labels
9. NO excessive shadows — ONE shadow value (shadow-card)
10. NO animated gradients or pulsing glows
11. NO centered content layouts — left-align everything
12. NO purple, teal, or multi-color palettes
13. NO hero sections with large CTA headers
14. NO animated shimmer skeletons — simple opacity pulse only
15. NO stacking toast notifications — one at a time
16. NO colored tab bar backgrounds — transparent on cream
17. NO hardcoded hex values in components — use Tailwind tokens only

---

## Court Document PDFs (separate design — NOT app UI)
```
Font: Georgia, 12pt. Margins: 1 inch. Line numbers on left (CA pleading paper).
Double spacing for declarations, single for exhibits.
Header: case name, case number, doc title.
Footer: "Generated by Family Bench | familybench.com" — 9pt gray.
Exhibit labels: "EXHIBIT [N]" centered, bold, 14pt.
```

---

## Tech Stack Context
- Expo Router (file-based routing) + NativeWind v4 (Tailwind for React Native)
- @gorhom/bottom-sheet for sheets
- lucide-react-native for icons
- react-native-reanimated for gestures
- Zustand for state
- React Hook Form + Zod for forms
- PowerSync + expo-sqlite for offline
- Supabase for backend
