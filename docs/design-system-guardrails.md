# Family Bench Design System Guardrails

Family Bench uses an existing design system. Future UI work should extend that system instead of introducing a new visual language.

## Source Of Truth

- Browser/reference tokens: `design/family-bench/project/colors_and_type.css`
- Browser/reference JS tokens: `design/family-bench/project/tokens.js`
- Browser/reference primitives: `design/family-bench/project/primitives.jsx`
- Browser/reference soft primitives: `design/family-bench/project/softkit.jsx`
- React Native token port: `components/ui/fb/tokens.ts`
- React Native primitives: `components/ui/fb`

The browser files are the design reference. The React Native token module and primitives are the Expo implementation contract.

## Visual Direction

Family Bench is modern court: official enough to feel credible in front of a judge, soft enough to use late at night during a stressful family-law situation.

Use the paper/ink palette:

- Paper: `#F7F6F3`
- Ink: `#14181F`
- Oxblood: `#B44028`
- Forest: `#2F5A3A`
- Sand: `#C9B892`
- Amber: `#A76A14`

Use tokens from `components/ui/fb/tokens.ts` in React Native code. Do not place raw color values in app screens or primitives.

## Component Rules

- Compose screens from `components/ui/fb` primitives where possible.
- Add a new primitive only when it represents a reusable Family Bench pattern.
- Keep icons inline SVG/currentColor through `components/ui/fb/Icon.tsx`.
- Do not import third-party icon packs or UI kits.
- Keep touch targets at least 44px where the element is interactive.
- Prefer hairline borders and paper tone shifts over shadows.
- Use `SafeAreaProvider` and safe-area insets for top and bottom mobile chrome.

## Typography Rules

- Sans is the workhorse.
- Serif is used sparingly for captions, formal case references, and quiet editorial moments.
- UI text should use weights 400, 500, or 600.
- Do not use 700/bold UI styling unless the design system is updated intentionally.

## Tone Rules

- No emoji.
- No hype language.
- No false reassurance.
- No decorative gradients.
- No heavy SaaS-style cards.
- No inflammatory words such as narcissistic, abusive, or hostile.
- Use calm, factual copy.
- Use legal-information-not-advice framing on statute-adjacent or advisor-like surfaces.
- Separate private emotional notes from lawyer/court-ready content.

## PR Checklist

- Screen code imports tokens or primitives from `components/ui/fb`.
- No raw hex, `rgba(...)`, or ad hoc shadow values appear outside token files.
- No third-party UI kit or icon library was added.
- Interactive controls have accessibility labels when the visible text is not sufficient.
- Bottom navigation and fixed actions account for safe-area insets.
- Capture flows remain one-handed and low-friction.
- Copy is factual, non-inflammatory, and avoids promises about outcomes.
