---
tags:
  - codebase
  - backend
---
# backend - onemain.py

See [[Backend Overview]]. This is the `main.py` that the Colab notebook ([[backend - insynccc.py]]) writes for the InSync research service; a duplicate/alternative entrypoint.

- `from topic_router import router, topic_lifespan` (7): module does not exist (the code is in [[backend - fron.py]]) -> ImportError as-is.
- `app = FastAPI(title="InSync research service", lifespan=topic_lifespan)` (9).
- CORS (13-14): origins from env `INSYNC_ALLOWED_ORIGINS` (comma list, default `*`), methods GET/POST/OPTIONS, headers `*`.
- Middleware `allow_private_network` (17-23): adds `Access-Control-Allow-Private-Network: true` when requested (Chrome PNA).
- `include_router(router)` (26).

Would run via `uvicorn onemain:app --port 8000` after renaming fron.py -> topic_router.py and supplying model artifacts. Could be merged into main.py (`app.include_router(router)` + lifespan) if the frontend's InSync Learn page needs it. Note main.py has no lifespan param so lifespan must be passed there.
