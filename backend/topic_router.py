"""Research word-cloud API for the InSync Learn page.

Put the research PDFs in backend/contents/. On first start (or `python train_topics.py`) the model is
trained once and saved there; later starts load the saved files:
    contents/menstrual_bertopic_model/   saved BERTopic model
    contents/document_store.json         text chunks for /drill-down
    contents/cloud_terms.json            word-cloud terms (optional: rebuilt from the model if missing)
    contents/topic_*.html                BERTopic charts (optional)
Override the folder with INSYNC_DATA_DIR.
"""
import base64
import io
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import dotenv_values, load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

_ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(_ENV_FILE)
# huggingface_hub reads HF_TOKEN from the environment; an empty shell export would otherwise shadow .env
if not os.environ.get("HF_TOKEN") and dotenv_values(_ENV_FILE).get("HF_TOKEN"):
    os.environ["HF_TOKEN"] = dotenv_values(_ENV_FILE)["HF_TOKEN"] or ""

BASE_DIR = Path(os.environ.get("INSYNC_DATA_DIR") or Path(__file__).resolve().parent / "contents")
# Same embedding model the notebook trained with; needed by /classify (downloaded once from Hugging Face)
EMBED_MODEL = os.environ.get("INSYNC_EMBED_MODEL", "pritamdeka/S-Scibert-snli-multinli-stsb")

logger = logging.getLogger("uvicorn.error")
ml_models = {}
router = APIRouter(prefix="/api/v1", tags=["Topic Modeling"])


def _load_json(name, label):
    try:
        with open(BASE_DIR / name, "r", encoding="utf-8") as f:
            data = json.load(f)
        logger.info("Loaded %d %s.", len(data), label)
        return data
    except Exception as e:
        logger.warning("Could not load %s from %s: %s", name, BASE_DIR, e)
        return []


def _terms_from_model(model, limit=150):
    """Word-cloud terms from the saved model's topic keywords, used when cloud_terms.json is absent."""
    freq = {}
    for topic_id, words in model.get_topics().items():
        if topic_id == -1 or not words:
            continue
        for word, score in words:
            freq[word.title()] = freq.get(word.title(), 0) + float(score)
    top = sorted(freq.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    return [{"text": word, "value": round(score * 1000, 2)} for word, score in top]


@asynccontextmanager
async def topic_lifespan(app: FastAPI):
    ml_models["topic_model"] = None
    try:  # first start only: train from the PDFs in contents/ and save; later starts just load
        from train_topics import train

        train(BASE_DIR)
    except Exception as e:
        logger.warning("Topic model training skipped (%s: %s)", type(e).__name__, e)
    try:
        from bertopic import BERTopic

        ml_models["topic_model"] = BERTopic.load(str(BASE_DIR / "menstrual_bertopic_model"), embedding_model=EMBED_MODEL)
        logger.info("BERTopic model loaded successfully.")
    except Exception as e:  # ImportError (bertopic missing) or missing/corrupt model files
        logger.warning("Topic model unavailable (%s: %s); /api/v1/classify will return 503.", type(e).__name__, e)

    ml_models["doc_store"] = _load_json("document_store.json", "indexed document chunks")
    ml_models["cloud_terms"] = _load_json("cloud_terms.json", "cloud terms")
    if not ml_models["cloud_terms"] and ml_models["topic_model"] is not None:
        ml_models["cloud_terms"] = _terms_from_model(ml_models["topic_model"])
        logger.info("Built %d cloud terms from the topic model.", len(ml_models["cloud_terms"]))
    ml_models["cloud_png"] = None
    yield
    ml_models.clear()


@router.get("/wordcloud")
def get_wordcloud_data(limit: int = Query(150, ge=1, le=300)):
    terms = ml_models.get("cloud_terms", [])
    if not terms:
        raise HTTPException(status_code=503, detail="Cloud terms not initialized (add cloud_terms.json or the model to backend/contents)")
    payload = terms[:limit]
    return {"status": "success", "total_words": len(payload), "data": payload}


@router.get("/drill-down")
def drill_down_documents(keyword: str = Query(..., min_length=1, max_length=60), limit: int = Query(5, ge=1, le=20)):
    if not ml_models.get("doc_store"):
        raise HTTPException(status_code=503, detail="Document store not initialized (document_store.json missing from backend/contents)")
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
        raise HTTPException(status_code=503, detail="Topic model not initialized (menstrual_bertopic_model missing from backend/contents)")
    topics, _ = model.transform([body.text])
    topic_id = int(topics[0])
    if topic_id == -1:
        return {"status": "success", "topic_id": -1, "keywords": [],
                "message": "No close research theme found. Try different or more specific words."}
    keywords = [{"text": word.title(), "value": round(float(score), 4)} for word, score in model.get_topic(topic_id)[:10]]
    return {"status": "success", "topic_id": topic_id, "keywords": keywords}


@router.get("/export-cloud-image")
def export_cloud_image():
    if ml_models.get("cloud_png"):
        return ml_models["cloud_png"]
    try:
        from wordcloud import WordCloud
    except ImportError:
        raise HTTPException(status_code=503, detail="The 'wordcloud' package is not installed")

    terms = ml_models.get("cloud_terms", [])
    if not terms:
        raise HTTPException(status_code=503, detail="Cloud terms not initialized (add cloud_terms.json or the model to backend/contents)")
    palette = ["#b8324a", "#40232b", "#d9573f", "#c4455c", "#7a2f3f"]
    freq = {t["text"]: t["value"] for t in terms}
    wc = WordCloud(width=1000, height=500, background_color="#fff8f7", max_words=120, prefer_horizontal=0.9,
                   color_func=lambda word, **kw: palette[sum(map(ord, word)) % len(palette)]).generate_from_frequencies(freq)
    buffer = io.BytesIO()
    wc.to_image().save(buffer, format="PNG")
    img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    ml_models["cloud_png"] = {"format": "png", "encoding": "base64", "data": f"data:image/png;base64,{img_b64}"}
    return ml_models["cloud_png"]


@router.get("/charts/{chart_name}")
def get_chart(chart_name: str):
    if not re.fullmatch(r"[A-Za-z0-9_]+", chart_name):
        raise HTTPException(status_code=404, detail="Chart not found")
    chart_path = BASE_DIR / f"{chart_name}.html"
    if not chart_path.exists():
        raise HTTPException(status_code=404, detail=f"Chart '{chart_name}.html' not found")
    return FileResponse(chart_path)
