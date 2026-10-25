---
tags: [codebase, frontend]
---
# Frontend - Components (`src/components/`, `src/utils/`)
Part of [[Frontend Overview]]. All function components, props typed inline, no context.

| File | Role |
|---|---|
| Button.tsx | single button/link; `kind` = primary/outline/text; exports `Arrow` |
| Nav.tsx | sticky nav; links Home, My Cycle, Care Budget, Report Simplifier, Learn More (6-12); mobile menu state; Profile/Edit Profile + Get Started buttons |
| Footer.tsx | static link groups; only "Cycle Analysis" navigates (13-14); rest `href="#"`; `id="about"` |
| Logo.tsx | SVG wordmark |
| PageIntro.tsx | page header with back button + optional `ConcernIcon` |
| ConcernIcon.tsx | SVG per concern (`pcos`, `endometriosis`, `dysmenorrhea`, `heavy-bleeding`, ...) |
| FormFields.tsx | `ChoiceGroup` (button choices), `TextField` - values keyed by `name`, `onChange(name,value)` |
| HealthContext.tsx | read-only card summarising profile + latest entry (props `profile`, `entries`) |
| ProfileSetup.tsx | profile form; validation ranges age 10-100, height 80-250, weight 20-350, cycle 15-90 (16-25); text says "details stay in this session" |
| ResearchWordCloud.tsx (231) | the only API-connected component |

## ResearchWordCloud.tsx
- State machines: `CloudState`, `PassageState`, `MatchState` (6-8) - `idle|loading|ready|error`.
- Effects: fetch cloud on mount/`attempt` (50-57, limit 150, abortable); font readiness (62-69); ResizeObserver width (72-83).
- Layout via `utils/cloudLayout.ts` (`layoutCloud` spiral placement, `createMeasurer` canvas); `fontFor` picks DM Sans/DM Serif.
- Actions: `selectWord` -> drill-down (93-107, cancels prior request); `findTheme` -> classify (110-124, min 3 chars, input maxLength 300); `downloadImage` (127-140); chart tabs iframe (222-229) only when `source==='api'`.
- Highlights search term in passages (`Highlight`, `excerpt` 13-25).
- Error UI includes setup hint: `uvicorn main:app --port 8000` (171).

## utils
- `dates.ts`: `todayInput`, `formatDate`, `formatShortDate`, `daysBetween` (local-time based).
- `cloudLayout.ts`: `PlacedWord`, `layoutCloud`, `createMeasurer`.
