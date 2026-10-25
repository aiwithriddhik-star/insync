import importlib
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import llm
from chat_routes import router as chat_router
from service import router as service_router
from topic_router import router as topic_api_router, topic_lifespan
from upload_routes import router as upload_router

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Document Chat", lifespan=topic_lifespan)

DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
origins = list(dict.fromkeys(DEV_ORIGINS + extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials="*" not in origins,  # credentials only with explicit origins
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(service_router)
app.include_router(topic_api_router)

try:  # report_routes may not exist yet or may fail to import; never block boot
    app.include_router(importlib.import_module("report_routes").router)
except Exception as exc:
    logger.warning("report_routes not mounted (%s: %s)", type(exc).__name__, exc)


@app.get("/")
def root():
    return {"status": "online"}


@app.get("/api/health")
def health():
    return {"status": "online", "llm": llm.health()}
