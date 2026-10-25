---
tags:
  - codebase
  - backend
---
# backend - main.py

**The real app entrypoint.** See [[Backend Overview]].

- `app = FastAPI(title="Document Chat", lifespan=topic_lifespan)`. The lifespan comes from `topic_router.py` (formerly `fron.py`, renamed with `git mv`). It loads BERTopic and the data files from `INSYNC_DATA_DIR`. It logs a warning instead of crashing when bertopic or the files are missing.
- CORS: always allows `http://localhost:5173` and `http://127.0.0.1:5173`, plus any comma-separated origins in `CORS_ORIGINS`. Credentials are enabled only when `*` is not in the origin list.
- Routers: upload_routes, chat_routes, service, `topic_router` (`/api/v1/*`) and `report_routes` (`/api/report/explain`). `report_routes` is imported defensively with importlib. If it is missing or fails to import, a warning is logged and the app still boots.
- `GET /` returns `{"status":"online"}`.
- `GET /api/health` returns `{"status":"online","llm":{reachable,model,base_url}}` (from `llm.health()`).
- Topic endpoints return 503 with a clear message when their data or packages are absent: `/wordcloud`, `/drill-down`, `/classify`, `/export-cloud-image`. `/charts/{name}` returns 404.
- Run: `cd backend && ../.venv/bin/uvicorn main:app --port 8000`. See `.env.example` for configuration.
- `onemain.py` is a standalone InSync-only app. It is now redundant, because main.py mounts the same router, but it still works (it imports `topic_router`) and is left in place.

Root `/main.py` is an unrelated "Hello" stub.
