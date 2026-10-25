---
tags:
  - codebase
  - backend
---
# backend - agent.py

Part of [[Backend Overview]]; LM Studio changes in [[Backend - LLM Integration Points]]. Called by [[backend - chat_routes.py]]; uses [[backend - chunks.py]].

**Purpose**: tool-calling RAG agent for clinician-facing answers over uploaded PDFs.

## Contents
- `agent.py:12` `load_dotenv()`
- `agent.py:13-18` `llm = ChatOpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio", model="YOUR_LOADED_MODEL_ID", temperature=0.2)`. `api_key` is LM Studio's dummy value, not a secret.
- `agent.py:25-28` `tools=[search_vector_db]`, `tools_by_name`, `llm.bind_tools(tools)`
- `agent.py:31-62` `SYSTEM_PROMPT`: cite `(Source: filename.pdf, p. 12)`, response sections Clinical Answer / Key Evidence / Clinical Reasoning / Safety Notes / `Suggested Follow-up Questions:` (2-3).
- `agent.py:65` `run_agent(query: str) -> str`: loop up to 5 iterations (73-103): invoke, execute tool calls, append `ToolMessage`; fallback string at 105-109.

## Bugs
1. **`search_vector_db` is never defined** (agent.py:25) -> NameError on import; whole app fails to start. `search_documents` is imported (line 10) but never wrapped in a `@tool`, and `tool` (line 5) is unused.
2. `langchain_openai` not in pyproject; `ChatOllama` import unused.
3. Placeholder model id.
4. `bind_tools` requires tool-use support; medgemma-4b-it-mlx has none.
5. Duplicate imports (lines 4 and 19-23); no timeout; sync blocking.
