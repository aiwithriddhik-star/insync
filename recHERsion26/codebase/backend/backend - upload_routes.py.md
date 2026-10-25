---
tags:
  - codebase
  - backend
---
# backend - upload_routes.py

See [[Backend Overview]]. Calls [[backend - chunks.py]].

Router `prefix="/api"`, tag "Documents".

- Config: `UPLOAD_DIR` (default `backend/uploads`, line 13), `MAX_UPLOAD_MB`=50 (14).
- `_safe_name(name)` (17): basename + sanitize to `[A-Za-z0-9._-]`.
- **`POST /api/upload`** `upload_pdf(file: UploadFile = File(...))` (22-58): multipart field name `file`.
  - 400 `"Only .pdf files are supported"` if extension not .pdf.
  - Saves to `uploads/<YYYY-MM-DD>/<safe_name>` (random suffix if exists), streams in 1MB blocks; 413 `"File larger than 50 MB"` (file removed).
  - Dedupes by content hash: returns `{"status":"already_indexed","source_id","filename"}` and deletes the new copy.
  - Else `index_pdf_for_rag(path, display_name=file.filename)`; failure -> 500 `"Indexing failed: ..."` (saved file is kept).
  - Success: `{"status":"indexed","stored_at": str, **stats}` where stats = source_id, filename, pages, chunks_indexed, text_chunks, table_chunks, tables_found, tables_joined_multipage.

Notes: sync def (threadpool). Extension-only validation (no magic check). Indexing is synchronous so large PDFs block the request until all embeddings finish; frontend needs a long timeout/spinner. Uses private `_file_id` import. No endpoint to list or delete documents.
