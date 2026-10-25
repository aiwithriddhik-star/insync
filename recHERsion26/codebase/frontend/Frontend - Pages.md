---
tags: [codebase, frontend]
---
# Frontend - Pages (`src/pages/`)
Routing in `App.tsx:46-76` (switch on `page`). See [[Frontend Overview]], [[Frontend - Types]].

| Hash | Component | Notes |
|---|---|---|
| `#home` | HomePage (103 lines) | static marketing, stats, CTA via `navigate` |
| `#analysis` | AnalyseCyclePage (127) | period entry form (AnalyseCyclePage.tsx:40-49 state; `saveEntry` 63-80 validates, rejects duplicate start date, builds `PeriodEntry` with `id: Date.now()`, calls `onAddEntry`); shows ProfileSetup first if no profile; link to insights |
| `#insights` | CycleInsightsPage (same file, ~114+) | `useMemo` averages of cycle length/period duration + recurring symptoms; all local |
| `#profile` | ProfileSetup | component, not page file |
| `#concerns` | BeyondCalendarPage | concern cards (pcos, endometriosis, dysmenorrhea, heavy-bleeding, irregular) |
| `#endometriosis` `#dysmenorrhea` `#heavy-bleeding` `#irregular` | ConcernDetailPage (same file) | optional questionnaire (`values`, `review` state 49-50), submit is `preventDefault` only |
| `#pcos` | PCOSPage (55) | 5 steps (9): cycle context (prefilled from profile), skin/hair, measurements, clinical report (AMH, follicle counts, report date), review. Range checks 18-27. Submit no-op (45). Fields: age, weight, bmi, cycleLength, cyclePattern, skinDarkening, hairGrowth, weightGain, pimples, hairLoss, waist, hip, fastFood, amh, follicleRight, follicleLeft, reportDate. Potential input source for backend `/api/psoc`. |
| `#info` | LearnPage (31) | static article cards + filter; embeds ResearchWordCloud; `focus` id scroll (20-22) |
| `#care-budget` | CareBudgetPage (223) | local state, INR formatting; Essential/ShoppingItem/Expense/CalcItem types (9-12) |
| `#lab-report` | ReportPage (160) | file validation 47-58; sample report; `understand()` (66) sets `unavailable` for real files (117 notice: not connected in prototype) - natural hook for backend `/api/upload` + LLM |

Static assets: `public/*.png`, `favicon.svg` (index.html has no favicon link). Disclaimers are repeated ("not diagnosis") - keep tone.
