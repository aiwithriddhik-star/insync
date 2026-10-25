"""POST /api/report/explain: plain-language explanation of an uploaded lab/scan report (PDF or image)."""
import json
import logging
import os
import re
from datetime import date
from typing import Any, Dict, Optional

import fitz  # pymupdf
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

import llm
from chunks import _file_id, index_pdf_for_rag, is_indexed
from upload_routes import UPLOAD_DIR, _safe_name

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/report", tags=["Report"])

MAX_REPORT_BYTES = 10 * 1024 * 1024
MAX_TEXT_CHARS = 12000
IMAGE_MIME = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}
STATUSES = {"below", "within", "above", "unknown"}

SYSTEM_PROMPT = """You explain medical reports (lab results, scans) to patients in plain, kind, non-technical language.
Rules:
- NEVER diagnose, never say the patient has or does not have a condition, never recommend treatment or medication.
- Compare each result only against the reference range printed on the report itself. If no range is printed, set status to "unknown".
- Keep every explanation short and jargon-free (a teenager should understand it).
- Reply with STRICT JSON ONLY: no markdown, no code fences, no commentary before or after.
Schema:
{
  "summary": "2-4 sentence plain-language overview of the report",
  "tests": [{"name": "test name", "result": "value as printed", "unit": "unit or empty string", "range": "reference range as printed or empty string", "status": "below|within|above|unknown", "meaning": "what this test measures and what this result suggests, without diagnosing"}],
  "glossary": [{"term": "medical term used", "explanation": "simple definition"}],
  "questions": ["question the patient could ask their doctor"]
}"""


def _s(v: Any) -> str:
    return "" if v is None else str(v).strip()


def parse_explanation(raw: str) -> Dict[str, Any]:
    """Turn raw model text into {summary, tests, glossary, questions}; never raises."""
    raw = raw or ""
    fallback = {"summary": raw.strip(), "tests": [], "glossary": [], "questions": []}
    text = re.sub(r"```(?:json)?", "", raw)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        return fallback
    try:
        obj = json.loads(text[start:end + 1])
    except (ValueError, TypeError):
        return fallback
    if not isinstance(obj, dict):
        return fallback

    def items(key):
        v = obj.get(key)
        return v if isinstance(v, list) else []

    tests = []
    for t in items("tests"):
        if not isinstance(t, dict):
            continue
        status = _s(t.get("status")).lower()
        tests.append({
            "name": _s(t.get("name")), "result": _s(t.get("result")), "unit": _s(t.get("unit")),
            "range": _s(t.get("range")), "status": status if status in STATUSES else "unknown",
            "meaning": _s(t.get("meaning")),
        })
    glossary = [{"term": _s(g.get("term")), "explanation": _s(g.get("explanation"))}
                for g in items("glossary") if isinstance(g, dict)]
    questions = [_s(q) for q in items("questions") if _s(q)]
    return {"summary": _s(obj.get("summary")), "tests": tests, "glossary": glossary, "questions": questions}


def _pdf_text(path: str) -> str:
    with fitz.open(path) as doc:
        text = "\n".join(page.get_text() for page in doc)
    return text[:MAX_TEXT_CHARS]


@router.post("/explain")
def explain_report(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
):
    filename = file.filename or "report"
    ext = os.path.splitext(filename)[1].lower()
    if ext != ".pdf" and ext not in IMAGE_MIME:
        raise HTTPException(status_code=415, detail="Only PDF, JPG, JPEG or PNG files are supported")

    data = file.file.read(MAX_REPORT_BYTES + 1)
    if len(data) > MAX_REPORT_BYTES:
        raise HTTPException(status_code=413, detail="File larger than 10 MB")

    day_dir = UPLOAD_DIR / date.today().isoformat()
    day_dir.mkdir(parents=True, exist_ok=True)
    saved_path = day_dir / _safe_name(filename)
    if saved_path.exists():
        saved_path = day_dir / f"{saved_path.stem}_{os.urandom(3).hex()}{saved_path.suffix}"
    saved_path.write_bytes(data)

    context = "".join([f"Report title: {title}\n" if title else "", f"Category: {category}\n" if category else ""])
    source_id: Optional[str] = None
    try:
        if ext == ".pdf":
            try:
                source_id = _file_id(str(saved_path))
                if is_indexed(source_id):
                    saved_path.unlink(missing_ok=True)  # keep first copy only, like /api/upload
                else:
                    index_pdf_for_rag(str(saved_path), display_name=filename)
            except Exception as e:
                log.warning("RAG indexing failed for %s: %s", filename, e)
                source_id = None
            text = _pdf_text(str(saved_path)) if saved_path.exists() else _pdf_text_from_bytes(data)
            prompt = f"{context}Report text:\n{text}\n\nExplain this report as strict JSON."
            raw = llm.chat(SYSTEM_PROMPT, prompt)
        else:
            prompt = f"{context}Explain the attached report image as strict JSON."
            raw = llm.chat_with_image(SYSTEM_PROMPT, prompt, data, IMAGE_MIME[ext])
    except llm.LLMError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {"filename": filename, "source_id": source_id, **parse_explanation(raw)}


def _pdf_text_from_bytes(data: bytes) -> str:
    with fitz.open(stream=data, filetype="pdf") as doc:
        return "\n".join(page.get_text() for page in doc)[:MAX_TEXT_CHARS]
