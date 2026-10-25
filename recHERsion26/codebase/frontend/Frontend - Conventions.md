---
tags: [codebase, frontend]
---
# Frontend - Conventions
From `AGENTS.md` / `CLAUDE.md` (`@AGENTS.md`) and observed code. See [[Frontend Overview]].

## AGENTS.md rules
- Figma Make project; dev server assumed already running on `$PORT` (default 8443); do not start it manually.
- Follow the listed structure; only chase imports as needed: `src/main.tsx` -> `src/App.tsx` (main UI), `src/index.css` (Tailwind v4 import), `index.html` shell, `vite.config.ts`, `.mise.toml`.
- AGENTS.md claims vite.config has React, Tailwind v4, Figma Make plugins and `@` alias to `src`; actual config has only react + proxy (tsconfig does define `@/*`). Reconcile before relying on it.
- Stack: React 19, Tailwind v4 via `@tailwindcss/vite`, Vite 8, TS 5.7, oxfmt for formatting (`pnpm format`).
- Styling: put `@import`/`@font-face` first in CSS. Tailwind utilities live in `@layer utilities`; unlayered CSS beats them. Put global element resets/defaults (body, headings, button, input) inside `@layer base { }`. Preflight already handles box-sizing, margins, `font: inherit` - do not repeat.
- Observed deviation: `index.css` has large unlayered global rules (`*{box-sizing}`, `h1`, `a`...). Add new styles consistently with existing class-per-component CSS, and prefer `@layer base` for new element rules.

## Code conventions observed
- Function components, props typed inline, named exports; pages take `onBack`, `navigate`.
- Navigation only via `navigate(page, focus?)`; add new pages to both `Page` and `PAGE_IDS` (types.ts) and the switch in App.tsx.
- State lives in App; no persistence. Keep "details stay in this session" copy truthful if persistence is added.
- All HTTP through `src/api/client.ts`; abort-aware (`AbortController`), errors via `ApiError`, UI messages via `friendly()`.
- Tone: educational, non-diagnostic disclaimers, optional fields, no weight-judgement language.
- Single-quote, semicolons, 2-space indent; Button component for all buttons.
- Palette CSS vars: `--cream --blush --pink --rose --red --wine --coral`; fonts DM Sans / DM Serif Display.
- Blocked in this vault by hooks: reading/writing `.md` via Bash/Read/Write; use Obsidian MCP.
