---
tags:
  - codebase
  - backend
---
# backend - chat_routes.py

See [[Backend Overview]]. Calls [[backend - agent.py]].

Router `prefix="/api"`, tag "Chat & Intelligence" (lines 9-12).

## Schemas
- `ChatRequest{query: str}` (15)
- `ChatResponse{answer: str, suggestions: List[str]}` (19)

## Functions
- `format_agent_response(raw_output: str) -> dict` (24-50): splits on literal `"Suggested Follow-up Questions:"`; suggestion lines are `line.strip(" 0123456789.-*")`.
- `POST /api/chat` `chat_endpoint(req)` (53-74): 400 `"Query cannot be empty"` if blank; calls `run_agent(req.query)` (line 66); any exception -> 500 `{detail: str(e)}`.

## Bugs
- The agent prompt asks for the heading in bold (`**Suggested Follow-up Questions:**` style); if the model emits it bold, the trailing `**` stays at the end of `answer` and the first suggestion becomes an empty string `""` (line `**` strips to empty but passes the `if line.strip()` check). Filter empties after stripping.
- Strip chars include digits, so a suggestion starting with a number (e.g. "2024 guidelines?") loses it.
- No conversation history or source citations returned in response; frontend only gets text.
- Sync endpoint holds a worker thread for the whole LLM call.
