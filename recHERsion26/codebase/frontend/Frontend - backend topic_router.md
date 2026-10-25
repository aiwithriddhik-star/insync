---
tags: [codebase, frontend]
---
# frontend/backend/ (topic_router.py, README, requirements)
A self-contained "InSync research service" folder inside the frontend, serving the Learn page word cloud. Built from the Colab notebook `insynccc.py` (also copied at `../backend/insynccc.py`). It is a FastAPI `APIRouter(prefix="/api/v1", tags=["Topic Modeling"])` (topic_router.py:23). The README refers to a `main.py` that does NOT exist in this folder (only README.md, requirements.txt, topic_router.py).

## Relation to the main backend
`../backend/main.py` includes upload, chat, service routers under `/api` only; topic_router is not mounted. To integrate: copy/import it and `app.include_router(topic_router)`, plus call its `topic_lifespan` (topic_router.py:37-51) from the app lifespan (it loads BERTopic model + JSON into `ml_models`). Needs data from the notebook zip: `menstrual_bertopic_model/`, `document_store.json`, `cloud_terms.json` (dir via env `INSYNC_DATA_DIR`, line 20). Missing files degrade gracefully (model None -> 503).

## Routes (README table)
- GET `/api/v1/wordcloud?limit=150` (line 54) -> `{data:[{text,value}]}`
- GET `/api/v1/drill-down?keyword=&limit=5` -> `{keyword, matched_count, total_matched, results:[{chunk_id,content}]}`
- POST `/api/v1/classify` `{text}` (75-87): 503 if no model; topic -1 -> `{status,topic_id:-1,keywords:[],message}`; else keywords top 10 `{text:Title, value}`
- GET `/api/v1/export-cloud-image` (90-103): WordCloud PNG -> base64 data URL in `{data}` (uses `wordcloud` pkg)
- GET `/api/v1/charts/topic_barchart` etc: served as FileResponse HTML for iframe
Shapes match [[Frontend - API Contract]]. Errors use FastAPI `HTTPException(detail=str)`, which `client.ts` reads. See requirements.txt (5 lines) for deps. Related: [[Frontend - API Module]].
