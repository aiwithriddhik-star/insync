"""
agent.py

Retrieve-then-answer RAG over the uploaded PDFs. The local model (medgemma via LM Studio) is not
trained for tool use, so instead of a tool-calling loop we always search Chroma first and put the
retrieved passages straight into the prompt.
"""

import os
from typing import Any, Dict, List, Optional, Tuple

from chunks import search_documents
from llm import chat

N_RESULTS = 5
# Max Chroma l2 distance for a hit to be used (ignored when a source_id is given)
RAG_MAX_DISTANCE = float(os.getenv("RAG_MAX_DISTANCE", "0.85"))
MAX_HISTORY_TURNS = 6

SYSTEM_PROMPT = """You are InSync, a careful, kind women's health information assistant (menstrual health, PCOS, lab reports).

## Rules
1. If DOCUMENT EXCERPTS are provided, base factual claims on them and cite each claim as (Source: filename.pdf, p. 12). Never invent file names, page numbers, doses or thresholds.
2. If no excerpts are provided or they do not cover the question, you may answer from general, well-established medical knowledge, and say clearly that this is general information, not from the user's documents.
3. If the evidence is insufficient or conflicting, say so. Do not guess.
4. Never give a diagnosis, prescribe medication, or tell the user to start or stop treatment. Encourage discussing results with a qualified healthcare professional.
5. If the question suggests an emergency (very heavy bleeding, fainting, severe pain, pregnancy complications, suicidal thoughts), tell the user to seek urgent medical care first.
6. Use plain, respectful language a non-specialist can follow. Keep answers concise.

## Response format
A short direct answer, then a few bullet points with key details (with citations when using excerpts), then any safety notes.
End with the line "Suggested Follow-up Questions:" followed by 2-3 short follow-up questions, one per line."""


def _format_context(hits: List[Dict[str, Any]]) -> str:
    blocks = []
    for i, h in enumerate(hits, 1):
        meta = h.get("meta") or {}
        page = meta.get("page_no")
        blocks.append(f"[{i}] (Source: {meta.get('source', 'unknown')}, p. {page if page is not None else 'unavailable'})\n{h['text']}")
    return "\n\n".join(blocks)


def _sources(hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen, out = set(), []
    for h in hits:
        meta = h.get("meta") or {}
        key = (meta.get("source_id"), meta.get("page_no"))
        if key in seen:
            continue
        seen.add(key)
        out.append({"filename": meta.get("source", "unknown"), "page": meta.get("page_no"), "source_id": meta.get("source_id", "")})
    return out


def retrieve(query: str, source_id: Optional[str] = None) -> List[Dict[str, Any]]:
    try:
        hits = search_documents(query, n_results=N_RESULTS, source_id=source_id)
    except Exception as e:
        # An empty collection or an unavailable embedding model should not block general answers
        print(f"Retrieval skipped: {e}")
        return []
    if source_id:
        # The user explicitly scoped the question to one report: keep every hit.
        return hits
    # Chroma distance (l2): lower = more similar. Drop weak, off-topic matches.
    return [h for h in hits if h["distance"] <= RAG_MAX_DISTANCE]


def run_agent(query: str, source_id: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None) -> Tuple[str, List[Dict[str, Any]]]:
    """Returns (raw model text, sources used)."""
    hits = retrieve(query, source_id)

    parts = []
    if history:
        turns = history[-MAX_HISTORY_TURNS:]
        parts.append("CONVERSATION SO FAR:\n" + "\n".join(f"{t['role'].upper()}: {t['content']}" for t in turns))
    if hits:
        parts.append("DOCUMENT EXCERPTS:\n" + _format_context(hits))
    else:
        parts.append("DOCUMENT EXCERPTS: none available for this question.")
    parts.append(f"QUESTION: {query}")

    return chat(SYSTEM_PROMPT, "\n\n".join(parts)), _sources(hits)
