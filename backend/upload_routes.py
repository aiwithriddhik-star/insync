import os
import re
from datetime import date
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from chunks import _file_id, index_pdf_for_rag, is_indexed

router = APIRouter(prefix="/api", tags=["Documents"])

# Every uploaded PDF is kept here for good; uploads from different days accumulate in dated folders
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", Path(__file__).resolve().parent / "uploads"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))


def _safe_name(name: str) -> str:
    name = os.path.basename(name or "document.pdf")
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


@router.post("/upload")
def upload_pdf(file: UploadFile = File(...)):
    """Store the PDF under uploads/<today>/ and index it into Chroma. Returns JSON, not the file."""
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are supported")

    day_dir = UPLOAD_DIR / date.today().isoformat()
    day_dir.mkdir(parents=True, exist_ok=True)
    saved_path = day_dir / _safe_name(file.filename)
    if saved_path.exists():
        # same name uploaded again (maybe a different version): keep both
        saved_path = day_dir / f"{saved_path.stem}_{os.urandom(3).hex()}{saved_path.suffix}"

    size = 0
    try:
        with open(saved_path, "wb") as out:
            while block := file.file.read(1 << 20):
                size += len(block)
                if size > MAX_UPLOAD_MB * 1024 * 1024:
                    raise HTTPException(status_code=413, detail=f"File larger than {MAX_UPLOAD_MB} MB")
                out.write(block)
    except HTTPException:
        saved_path.unlink(missing_ok=True)
        raise

    # Same content already indexed (even under another name or on another day): keep the first copy only
    source_id = _file_id(str(saved_path))
    if is_indexed(source_id):
        saved_path.unlink(missing_ok=True)
        return {"status": "already_indexed", "source_id": source_id, "filename": file.filename}

    try:
        stats = index_pdf_for_rag(str(saved_path), display_name=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    return {"status": "indexed", "stored_at": str(saved_path), **stats}
