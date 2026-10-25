---
tags: [codebase, frontend]
---
# Frontend - API Contract

All network code: `src/api/client.ts`, `src/api/research.ts` ([[Frontend - API Module]]). Sole consumer: `src/components/ResearchWordCloud.tsx` ([[Frontend - Components]]). Nothing is mocked; one call has a static-file fallback.

## Base URL / config
- `API_BASE = (import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000/api/v1')` minus trailing slashes (client.ts:8). Absolute URL -> the Vite proxy is NOT used by the app.
- `vite.config.ts:6-13`: dev proxy `/api` -> `http://localhost:5000`, changeOrigin. Unused by current code (base is absolute `:8000`) and port 5000 matches nothing in backend.
- Headers: `Accept: application/json`; `Content-Type: application/json` only when body present (client.ts:24). No auth.
- Errors: network failure -> `ApiError('The research service could not be reached.', 0)` (client.ts:28); non-2xx -> reads `body.detail` (string only) else generic message (client.ts:30-37); `AbortError` rethrown. UI maps via `friendly()` (ResearchWordCloud.tsx:10).

```ts
class ApiError extends Error { status: number }
apiGet<T>(path, params?: Record<string,string|number>, signal?): Promise<T>
apiPost<T>(path, body: unknown, signal?): Promise<T>
```

## Endpoints (relative to API_BASE)
| # | Method + path | Defined | Called | Request | Response TS | Error / fallback |
|---|---|---|---|---|---|---|
| 1 | GET `/wordcloud?limit=150` | research.ts:14 | ResearchWordCloud.tsx:53 | `limit:number` | `{ data: CloudTerm[] }` | on any error fetches static `/cloud_terms.json` (research.ts:19) -> `source:'file'`; else error panel + retry |
| 2 | GET `/drill-down?keyword=&limit=5` | research.ts:30-31 | ResearchWordCloud.tsx:104 | `keyword:string, limit:number` | `DrillDown` | panel error message |
| 3 | POST `/classify` | research.ts:34-35 | ResearchWordCloud.tsx:121 | `{ text: string }` (3-300 chars) | `ThemeMatch` | inline `field-error` |
| 4 | GET `/export-cloud-image` | research.ts:38-39 | ResearchWordCloud.tsx:132 | none | `{ data: string }` (PNG data URL, used as `<a href download>`) | `imageError` |
| 5 | GET `/charts/{topic_barchart\|topic_hierarchy}` | research.ts:42 (`topic_distance_map` typed, unused) | iframe src ResearchWordCloud.tsx:228 | - | HTML page | iframe only |
| 6 | GET `/cloud_terms.json` (same-origin static, `public/`) | research.ts:19 | fallback | - | `CloudTerm[]` | - |

```ts
type CloudTerm = { text: string; value: number };
type Passage = { chunk_id: number; content: string };
type DrillDown = { keyword: string; matched_count: number; total_matched?: number; results: Passage[] };
type ThemeMatch = { status: string; topic_id: number; keywords: CloudTerm[]; message?: string };
```
UI treats `topic_id === -1` or empty keywords as "no match" showing `message`.

## Mismatches with the actual backend (`../backend/`)
Real routes seen: `POST /api/chat` ({query}->{answer}), `POST /api/upload`, `POST /api/psoc` (PCOS model), all prefixed `/api` (main.py includes chat/upload/service routers; CORS `*`). The routes the UI expects live in `frontend/backend/topic_router.py` under `/api/v1` ([[Frontend - backend topic_router]]) and are NOT included in `backend/main.py`.
- UI calls `/api/v1/wordcloud|drill-down|classify|export-cloud-image|charts/*` -> missing in main backend unless topic_router is mounted. README mentions `main.py` + `uvicorn main:app --port 8000`.
- Port: env default 8000 vs proxy 5000.
- Not wired in UI: `/api/chat`, `/api/upload`, `/api/psoc`. PCOSPage collects data (age, weight, BMI, cycle, AMH, follicles...) but never POSTs; the Report page doesn't upload; no chat UI. Field names would need mapping to `PSOCinput` aliases (e.g. `Cycle(R/I)`).
- For LM Studio (`POST http://localhost:1234/api/v1/chat`): frontend must not call it directly (no key/CORS plan); route through FastAPI `/api/chat`. Using the Vite proxy (`/api` -> backend port) would let `VITE_API_BASE=/api` work, but note existing client appends paths like `/wordcloud` so base must be `/api/v1` for research endpoints and `/api` for chat; add a second base or path-prefixed helper.
