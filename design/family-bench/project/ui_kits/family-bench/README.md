# Family Bench · UI Kit

This kit contains working React components + screens that demonstrate the Family Bench design system in use. It's the reference implementation — every surface shown here exists in code you can lift.

## Files

- `index.html` — interactive composition showing mobile + desktop side-by-side with key screens
- All components live in the root of the design system (`primitives.jsx`, `softkit.jsx`, `mobile-screens.jsx`, `desktop-screens.jsx`, `home-v2.jsx`, `capture-flow.jsx`, `filing-wizard.jsx`, `v2-surfaces.jsx`, `diagnostic.jsx`, `case-map.jsx`, `safety.jsx`, `integrations.jsx`, `conversations.jsx`) — import them from this kit as `../<file>.jsx`

## The full tour

The main design canvas — `../Family Bench.html` — shows every surface of the app organized by journey (Diagnostic → Home → Capture → Evidence → Pattern → Filing → Advisor → Conversations → Case Map → Integrations → Safety). Open that for the complete tour. `index.html` here is a compact "this is the kit" landing.

## How to use

The system is delivered as **tokens + primitives**, not a component library you npm-install. In production code, import `colors_and_type.css` for the design tokens, then rebuild components against whatever framework you're shipping (React Native for the app, React for the web). Every JSX file in this kit is a reference, not a dependency.

See the root README for voice guidelines, palette, and the block pattern.
