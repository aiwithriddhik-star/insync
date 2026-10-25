"""
chunks.py

PDF (PyMuPDF only) -> join multi-page tables, drop running headers/footers      [pdf_table.py]
                   -> chunk narrative paragraphs (recursive splitter) + tables  [this file]
                   -> embed and store in Chroma                                 [vectorstore.py]
"""

import hashlib
import os
from typing import Any, Dict, List, Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter

from pdf_table import LogicalTable, extract_document
from vectorstore import get_collection, get_embeddings

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))
TABLE_CHUNK_CHARS = int(os.getenv("TABLE_CHUNK_CHARS", "1500"))   # larger tables are split by row groups
EMBED_BATCH = 64


def _file_id(path: str) -> str:
    """Content hash: the same PDF always maps to the same id, so re-indexing replaces and never duplicates."""
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()[:10]


def is_indexed(source_id: str) -> bool:
    return bool(get_collection().get(where={"source_id": source_id}, limit=1)["ids"])


def _table_chunks(tbl: LogicalTable, source_id: str, filename: str) -> List[Dict[str, Any]]:
    """One joined table -> self-describing chunks. Every chunk repeats the caption and header,
    so a group of rows is never a bare list of numbers."""
    pages = str(tbl.page_start) if not tbl.is_multipage else f"{tbl.page_start}-{tbl.page_end}"
    header_line = " | ".join(tbl.headers)
    row_lines = [" | ".join(r) for r in tbl.rows]
    budget = max(TABLE_CHUNK_CHARS - len(header_line) - 200, 300)

    out: List[Dict[str, Any]] = []
    i = 0
    while i < len(row_lines):
        start, size = i, 0
        while i < len(row_lines) and (i == start or size + len(row_lines[i]) + 1 <= budget):
            size += len(row_lines[i]) + 1
            i += 1
        first_page = tbl.row_pages[start]
        text = (
            f"[Table] {tbl.caption or 'untitled table'}\n"
            f"Source: {filename}, pages {pages}, rows {start + 1}-{i} of {tbl.n_rows}\n"
            f"{header_line}\n" + "\n".join(row_lines[start:i])
        )
        meta = {
            "type": "table",
            "source": filename,
            "source_id": source_id,
            "page_no": first_page,
            "page_start": tbl.page_start,
            "page_end": tbl.page_end,
            "is_multipage": tbl.is_multipage,
            "table_id": f"{source_id}_t{tbl.index:03d}",
            "row_start": start + 1,
            "row_end": i,
            "n_rows": tbl.n_rows,
            "caption": tbl.caption or "",
        }
        out.append({"text": text, "meta": meta, "id": f"{source_id}_table_{tbl.index:03d}_{len(out):03d}"})
    return out


def index_pdf_for_rag(
    pdf_path: str,
    display_name: Optional[str] = None,
    table_strategy: Optional[str] = None,    # "text" helps with borderless tables
) -> Dict[str, Any]:
    """Extract, chunk, embed and store ONE pdf in the shared Chroma collection. Returns stats."""
    pdf_path = str(pdf_path)
    filename = display_name or os.path.basename(pdf_path)
    source_id = _file_id(pdf_path)

    parsed = extract_document(pdf_path, table_strategy=table_strategy)
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

    documents: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    ids: List[str] = []

    # 1) narrative text (table areas and running headers/footers are already removed by pdf_table)
    for page_no, text in parsed.pages_text.items():
        for k, chunk in enumerate(splitter.split_text(text) if text else []):
            documents.append(chunk)
            metadatas.append({"type": "text", "source": filename, "source_id": source_id, "page_no": page_no})
            ids.append(f"{source_id}_text_p{page_no:04d}_{k:03d}")
    n_text = len(documents)

    # 2) joined tables: whole table in one chunk when it fits, otherwise row groups with the header repeated
    for tbl in parsed.tables:
        for ch in _table_chunks(tbl, source_id, filename):
            documents.append(ch["text"])
            metadatas.append(ch["meta"])
            ids.append(ch["id"])

    # 3) replace any older chunks of this same file, then embed in batches and store
    collection = get_collection()
    collection.delete(where={"source_id": source_id})
    if documents:
        embedder = get_embeddings()
        embeddings: List[List[float]] = []
        for i in range(0, len(documents), EMBED_BATCH):
            embeddings.extend(embedder.embed_documents(documents[i:i + EMBED_BATCH]))
        collection.upsert(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)

    return {
        "source_id": source_id,
        "filename": filename,
        "pages": parsed.page_count,
        "chunks_indexed": len(documents),
        "text_chunks": n_text,
        "table_chunks": len(documents) - n_text,
        "tables_found": len(parsed.tables),
        "tables_joined_multipage": sum(1 for t in parsed.tables if t.is_multipage),
    }


def search_documents(query: str, n_results: int = 5, source_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Semantic search over all indexed PDFs (or one PDF when source_id is given)."""
    where = {"source_id": source_id} if source_id else None
    res = get_collection().query(
        query_embeddings=[get_embeddings().embed_query(query)],
        n_results=n_results,
        where=where,
    )
    return [
        {"text": d, "meta": m}
        for d, m in zip(res["documents"][0], res["metadatas"][0])
    ]
