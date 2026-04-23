---
name: family-bench-design
description: Use this skill to generate well-branded interfaces and assets for Family Bench, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping a pro-se family-law app with a modern-court aesthetic.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Start points:
- `README.md` — voice, foundations, palette, iconography, block pattern
- `colors_and_type.css` — all tokens as CSS vars (production-ready)
- `tokens.js` — tokens as JS object + font injection (for inline React/Babel prototyping)
- `primitives.jsx` + `softkit.jsx` — reference component library (Inline React, not npm)
- `ui_kits/family-bench/index.html` — compact kit landing
- `Family Bench.html` — full design tour with every screen

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Core rules you must never break:**
- Never pure white backgrounds; use `--fb-paper` (#F7F6F3) as base
- Never pure black text; use `--fb-ink` (#14181F)
- Sans (Inter) is the workhorse; serif italic (Instrument Serif) is a guest, used for emotional moments and legal formality only
- Hairlines are 0.5px, never 1px
- Voice: calm, precise, honest — never "you've got this"; no emoji
- Always include the legal-information-not-advice disclaimer on statute-adjacent surfaces
- Block pattern: kicker → title → body → actions
