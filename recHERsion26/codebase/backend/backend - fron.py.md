---
tags:
  - codebase
  - backend
---
# backend - fron.py

See [[Backend Overview]]. Identical to the `topic_router.py` that [[backend - insynccc.py]] writes (docstring even says "uvicorn main:app"); [[backend - onemain.py]] imports it as `topic_router`. It is the InSync Learn research word-cloud API, a separate service from the document-chat app. **Not mounted by backend/main.py.** Rename to `topic_router.py` to use.

## Contents
- `BASE_DIR` = env `INSYNC_DATA_DIR` or the file's dir (20). Needs artifacts from the Colab run: `menstrual_bertopic_model/`, `document_store.json`, `cloud_terms.json`, `topic_*.html` (none exist in backend/).
- `topic_lifespan(app)` (38): loads BERTopic (lazy import) and JSONs into `ml_models`; failures only print warnings.
- Router `prefix="/api/v1"`, tag "Topic Modeling":
  - `GET /api/v1/wordcloud?limit=150` (1-300) -> `{"status":"success","total_words":n,"data":[{"text","value"}]}`; 503 if not loaded.
  - `GET /api/v1/drill-down?keyword=(1-60 chars)&limit=5 (1-20)` -> `{"keyword","matched_count","total_matched","results":[{"chunk_id","content"}]}`
  - `POST /api/v1/classify` JSON `{"text": str 3-500}` -> `{"status":"success","topic_id":int,"keywords":[{"text","value"}]}` (topic -1: keywords [] + `message`); 503 if model missing.
  - `GET /api/v1/export-cloud-image` -> `{"format":"png","encoding":"base64","data":"data:image/png;base64,..."}`
  - `GET /api/v1/charts/{chart_name}` -> HTML file (`[A-Za-z0-9_]+`), 404 otherwise.

Deps missing from pyproject: `bertopic`, `wordcloud` (and umap, sentence-transformers is present). No LLM calls (BERTopic embeddings are local).
