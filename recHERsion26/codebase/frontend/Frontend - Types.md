---
tags: [codebase, frontend]
---
# Frontend - Types (`src/types.ts`, 42 lines)
```ts
type Profile = { name; age; height; weight; firstPeriodDate; cycleLength: string }  // all strings (types.ts:1-8)
type PeriodEntry = { id:number; startDate; endDate:string; ongoing:boolean; flow:string; pain:number; symptoms:string[]; otherSymptom; notes:string } // 10-20
type Page = 'home'|'analysis'|'profile'|'concerns'|'pcos'|'endometriosis'|'dysmenorrhea'|'heavy-bleeding'|'irregular'|'info'|'insights'|'care-budget'|'lab-report'  // 22-35
const PAGE_IDS: Page[]   // 37, must stay in sync with Page
type ConcernKind = 'endometriosis'|'dysmenorrhea'|'heavy-bleeding'|'irregular'  // 39
type Navigate = (page: Page, focus?: string) => void  // 42
```
Notes: numeric profile fields are strings - convert before sending to the backend (`PSOCinput` in `../backend/service.py` expects numbers with aliases like `Cycle(R/I)`). Dates are `YYYY-MM-DD`. API types live in `src/api/research.ts` ([[Frontend - API Contract]]). `src/vite-env.d.ts` is a one-line vite/client reference.
