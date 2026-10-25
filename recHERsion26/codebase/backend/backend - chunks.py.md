---
tags:
  - codebase
  - backend
---
# backend - chunks.py

See [[Backend Overview]]. Uses [[backend - pdf_table.py]] and [[backend - vectorstore.py]]; used by [[backend - upload_routes.py]] and [[backend - agent.py]].

**Purpose**: PDF -> chunks (narrative + tables) -> embeddings -> Chroma; plus semantic search.

## Config (env)
`CHUNK_SIZE`=1000 (18), `CHUNK_OVERLAP`=150 (19), `TABLE_CHUNK_CHARS`=1500 (20), `EMBED_BATCH`=64 (21).

## Functions
- `_file_id(path) -> str` (24): sha1 of content, first 10 hex chars = `source_id`.
- `is_indexed(source_id) -> bool` (33): `collection.get(where={"source_id":...}, limit=1)`.
- `_table_chunks(tbl, source_id, filename) -> List[{text, meta, id}]` (37): row groups with caption + header repeated. Meta: type, source, source_id, page_no, page_start, page_end, is_multipage, table_id, row_start, row_end, n_rows, caption.
- `index_pdf_for_rag(pdf_path, display_name=None, table_strategy=None) -> dict` (76): extract_document, `RecursiveCharacterTextSplitter` per page (text metadata: type, source, source_id, page_no), tables, then delete old chunks for source_id (110), embed in batches via `embed_documents` (115), `upsert` (116). Returns stats dict.
- `search_documents(query, n_results=5, source_id=None) -> List[{"text","meta"}]` (130): `embed_query` (134) then `collection.query`. This is what the agent tool should wrap.

## Notes / bugs
- Embedding calls at lines 115 and 134, see [[Backend - LLM Integration Points]].
- Ids are deterministic so re-index is idempotent.
- No guard when the collection has fewer than n_results rows (Chroma handles) or when empty collection returns empty lists.
- Scanned PDFs yield 0 chunks silently (returns `chunks_indexed: 0`, still "indexed").
