"""Research word-cloud API for the InSync Learn page.

Run locally (after unzipping topic_files.zip from the notebook next to this file):
    pip install fastapi uvicorn bertopic wordcloud
    uvicorn main:app --port 8000
The same file is written to /content by the notebook, so it also works inside Colab.
"""
import base64
import io
import json
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(os.environ.get("INSYNC_DATA_DIR", Path(__file__).resolve().parent))

ml_models = {}
router = APIRouter(prefix="/api/v1", tags=["Topic Modeling"])


def _load_json(name, label):
    try:
        with open(BASE_DIR / name, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"Loaded {len(data)} {label}.")
        return data
    except Exception as e:
        print(f"Warning: Could not load {name}: {e}")
        return []


@asynccontextmanager
async def topic_lifespan(app: FastAPI):
    try:
        from bertopic import BERTopic

        ml_models["topic_model"] = BERTopic.load(str(BASE_DIR / "menstrual_bertopic_model"))
        print("BERTopic model loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load model: {e}")
        ml_models["topic_model"] = None

    ml_models["doc_store"] = _load_json("document_store.json", "indexed document chunks")
    ml_models["cloud_terms"] = _load_json("cloud_terms.json", "cloud terms")
    yield
    ml_models.clear()


@router.get("/wordcloud")
def get_wordcloud_data(limit: int = Query(150, ge=1, le=300)):
    terms = ml_models.get("cloud_terms", [])
    if not terms:
        raise HTTPException(status_code=503, detail="Cloud terms not initialized")
    payload = terms[:limit]
    return {"status": "success", "total_words": len(payload), "data": payload}


@router.get("/drill-down")
def drill_down_documents(keyword: str = Query(..., min_length=1, max_length=60), limit: int = Query(5, ge=1, le=20)):
    k = keyword.lower()
    matches = [item for item in ml_models.get("doc_store", []) if k in item["text"].lower()]
    results = [{"chunk_id": item["chunk_id"], "content": item["text"]} for item in matches[:limit]]
    return {"keyword": keyword, "matched_count": len(results), "total_matched": len(matches), "results": results}


class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=500)


@router.post("/classify")
def classify_question(body: ClassifyRequest):
    """Match a free-text question to the closest research theme (BERTopic.transform)."""
    model = ml_models.get("topic_model")
    if model is None:
        raise HTTPException(status_code=503, detail="Topic model not initialized")
    topics, _ = model.transform([body.text])
    topic_id = int(topics[0])
    if topic_id == -1:
        return {"status": "success", "topic_id": -1, "keywords": [],
                "message": "No close research theme found. Try different or more specific words."}
    keywords = [{"text": word.title(), "value": round(float(score), 4)} for word, score in model.get_topic(topic_id)[:10]]
    return {"status": "success", "topic_id": topic_id, "keywords": keywords}


@router.get("/export-cloud-image")
def export_cloud_image():
    from wordcloud import WordCloud

    terms = ml_models.get("cloud_terms", [])
    if not terms:
        raise HTTPException(status_code=503, detail="Cloud terms not initialized")
    palette = ["#b8324a", "#40232b", "#d9573f", "#c4455c", "#7a2f3f"]
    freq = {t["text"]: t["value"] for t in terms}
    wc = WordCloud(width=1000, height=500, background_color="#fff8f7", max_words=120, prefer_horizontal=0.9,
                   color_func=lambda word, **kw: palette[sum(map(ord, word)) % len(palette)]).generate_from_frequencies(freq)
    buffer = io.BytesIO()
    wc.to_image().save(buffer, format="PNG")
    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return {"format": "png", "encoding": "base64", "data": f"data:image/png;base64,{img_b64}"}


@router.get("/charts/{chart_name}")
def get_chart(chart_name: str):
    if not re.fullmatch(r"[A-Za-z0-9_]+", chart_name):
        raise HTTPException(status_code=404, detail="Chart not found")
    chart_path = BASE_DIR / f"{chart_name}.html"
    if not chart_path.exists():
        raise HTTPException(status_code=404, detail=f"Chart '{chart_name}.html' not found")
    return FileResponse(chart_path)
