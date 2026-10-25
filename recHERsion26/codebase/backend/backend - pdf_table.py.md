---
tags:
  - codebase
  - backend
---
# backend - pdf_table.py

See [[Backend Overview]]; consumed by [[backend - chunks.py]]. Pure PyMuPDF (`pymupdf`, fallback `fitz`), no LLM/network.

**Purpose**: extract narrative text per page and tables, joining tables that span pages, removing running headers/footers.

## Constants
`PREV_AT_BOTTOM=0.60`, `CURR_AT_TOP=0.45`, `MAX_HEADER_ROWS=3`, `CAPTION_MAX_GAP=60` (15-18).

## Key API
- `extract_document(pdf_path: str, table_strategy: Optional[str]=None) -> ParsedDocument` (882): entry point. `table_strategy="text"` for borderless tables.
- `ParsedDocument(page_count, pages_text: Dict[int,str], tables: List[LogicalTable])` (403)
- `LogicalTable(index, page_start, page_end, caption, header_rows, headers, rows, row_pages)` with `n_rows`, `is_multipage`, `append_fragment`, `finalize` (328)
- Helpers: `clean_cell`, `normalize_text`, `parse_number` (70), `headers_similar` (149), `looks_like_header` (184), `_split_header` (220), `_combine_headers` (274), `_page_tables` (451, skips 1-row/1-col tables), `_running_blocks` (572, text repeated in top/bottom 12% on >=40% of pages, needs >=4 pages), `_find_caption` (641), `_narrative_text` (749), `_continuation_decision` (827).

## Notes
- Scanned/image PDFs: returns "" text (819-820), no OCR -> nothing indexed. Candidate for medgemma vision OCR later.
- `_HEADER_KEYWORDS` (124) are coal/mining terms ("coal","seam","depth", "production"): copied from another project; weak for medical tables.
- `parse_number` is defined but only used by header heuristics.
