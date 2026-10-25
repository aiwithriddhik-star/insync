---
tags:
  - codebase
  - backend
---
# Backend - LLM Integration Points

Back to [[Backend Overview]].

## Chat LLM
| Location | What | Change for LM Studio |
|---|---|---|
| agent.py:6 | `from langchain_ollama import ChatOllama` unused | delete |
| agent.py:7 | `from langchain_openai import ChatOpenAI` | package missing from pyproject; either `uv add langchain-openai` or drop LangChain and use `requests`/`httpx` |
| agent.py:13-18 | `ChatOpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio", model="YOUR_LOADED_MODEL_ID", temperature=0.2)` | already points at LM Studio OpenAI-compat, but model is a placeholder; set `medgemma-4b-it-mlx`, make base URL/model env-driven (LMSTUDIO_URL, LMSTUDIO_MODEL) |
| agent.py:25 | `tools = [search_vector_db]` | NameError, tool undefined |
| agent.py:28 | `llm.bind_tools(tools)` | medgemma has no tool use: remove |
| agent.py:74 | `llm_with_tools.invoke(messages)` inside 5-iteration loop (agent.py:73) | replace with single call: POST `http://localhost:1234/api/v1/chat` with `{"model","system_prompt","input"}`; read `output[0].content` (or `/v1/chat/completions` -> `choices[0].message.content`) |
| agent.py:31-62 | SYSTEM_PROMPT demands calling `search_vector_db` | rewrite: backend retrieves first (`chunks.search_documents(query, n)`), then injects chunks (with `source` and `page_no` metadata) into `input`; remove "always call tool" |
| agent.py:82-103 | tool execution + ToolMessage | remove |

Recommended: `run_agent(query)` = retrieve top-k via `search_documents` -> build `input` "Context:\n[Source: file, p. N] text...\n\nQuestion: ..." -> one LM Studio call -> return string. `chat_routes.py:66` call site and `format_agent_response` (chat_routes.py:24-50, marker "Suggested Follow-up Questions:") stay as-is (but see parsing bug in [[backend - chat_routes.py]]). Small 4B model may not follow the format; consider asking for JSON or generating suggestions in a second call.

## Embeddings
| Location | What | Change |
|---|---|---|
| vectorstore.py:21-23 | `EMBEDDING_BACKEND` default `"ollama"`, `nomic-embed-text`, ST fallback `all-MiniLM-L6-v2` | add backend `"lmstudio"` with `LMSTUDIO_EMBED_MODEL=embeddinggemma-2` (confirm exact id via GET /api/v1/models) |
| vectorstore.py:29-34 | `embedding_tag()` raises on unknown backend | add branch, e.g. `lmstudio:<model>` |
| vectorstore.py:37-47 | `get_embeddings()` builds `OllamaEmbeddings(model=...)` (default host localhost:11434) or `HuggingFaceEmbeddings` | add `OpenAIEmbeddings(base_url="http://localhost:1234/v1", api_key="lm-studio", model=..., check_embedding_ctx_length=False)` (needs langchain-openai) or a tiny wrapper class with `embed_documents`/`embed_query` that POSTs `/v1/embeddings` |
| chunks.py:115 | `embedder.embed_documents(batch of 64)` (ingest) | interface must stay; keep batch size, LM Studio may need smaller |
| chunks.py:134 | `get_embeddings().embed_query(query)` (retrieval) | same wrapper |
| vectorstore.py:56-65 | collection metadata guard raises RuntimeError if embedding tag differs | after switching, set new `COLLECTION_NAME`/`CHROMA_DIR` and re-ingest PDFs (dimension differs) |

## Non-LLM models (no change)
- service.py:6 joblib PCOS classifier (local).
- fron.py:42 BERTopic, SciBERT embeddings only in notebook insynccc.py:124 (offline).
- Vision: medgemma is vision capable, but no code sends images; pdf_table.py returns "" for scanned pages (pdf_table.py:819), so scanned PDFs yield zero chunks. Possible future OCR via LM Studio vision.

## Env / config to add
LMSTUDIO_BASE_URL (default http://localhost:1234), LMSTUDIO_MODEL=medgemma-4b-it-mlx, LMSTUDIO_EMBED_MODEL, EMBEDDING_BACKEND=lmstudio, plus a request timeout (4B local generations can be slow; currently none).
