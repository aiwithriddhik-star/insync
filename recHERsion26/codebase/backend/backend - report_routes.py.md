---
tags:
  - codebase
  - backend
---
# backend - report_routes.py

See [[Backend Overview]], [[backend - service.py]]. Exports module-level `router` (prefix `/api/report`), to be included by main.py.

**`POST /api/report/explain`** (multipart: `file`, optional `title`, `category`).
- Types pdf/jpg/jpeg/png else 415; >10 MB else 413. Saved under `UPLOAD_DIR/<today>/` using `_safe_name`/`UPLOAD_DIR` from `upload_routes.py`.
- PDF: `_file_id` / `is_indexed` / `chunks.index_pdf_for_rag` for RAG -> `source_id` (indexing errors logged, `source_id=None`); text via pymupdf, first 12k chars, `llm.chat`.
- Image: `llm.chat_with_image`, `source_id=None`.
- `SYSTEM_PROMPT` demands strict JSON, plain language, no diagnosis, compare to printed reference range (else status "unknown").
- `parse_explanation(raw)` is a pure function: strips fences, outermost `{...}`, coerces all values to strings, invalid status -> "unknown", missing lists -> []; on failure summary = raw text.
- `llm.LLMError` -> 503.
- Response: `{filename, source_id, summary, tests[{name,result,unit,range,status,meaning}], glossary[{term,explanation}], questions[]}`.
