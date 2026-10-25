---
tags: [codebase, frontend]
---
# Frontend - API Module (`src/api/`)
See [[Frontend - API Contract]] for the endpoint table.

## client.ts (50 lines)
- `API_BASE` (8), `ApiError` (10-17), private `request<T>` (19-39), `apiGet` (42-45, builds `URLSearchParams` from params, stringified), `apiPost` (48-50, `JSON.stringify` body).
- Accepts optional `AbortSignal` everywhere; AbortError is passed through untouched so components can ignore it.
- Success path always `response.json()` - non-JSON 2xx responses (e.g. the HTML chart) would throw; hence charts use iframe URLs.

## research.ts (44 lines)
- Types: `CloudTerm`, `Passage`, `DrillDown`, `ThemeMatch` (3-6).
- `loadCloudTerms(limit, signal)` (12-27): API first; on non-abort failure tries `/cloud_terms.json`; if that is also unusable rethrows the original error. Returns `{terms, source:'api'|'file'}`. The UI hides "Download image" and charts when `source === 'file'`.
- `loadPassages`, `classifyQuestion`, `loadCloudImage` (unwraps `.data`), `chartUrl(name)`.
- Re-exports `ApiError` (44).

## To extend for new backend calls
Add functions here using `apiGet/apiPost`; keep types exported next to them. For chat use `apiPost<{answer:string}>('/chat', {query})` with a base of `/api` (current base includes `/v1`).
