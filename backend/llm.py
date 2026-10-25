"""
llm.py

Thin client for the local LM Studio server. Chat goes through LM Studio's native
POST /api/v1/chat; embeddings and image prompts go through its OpenAI-compatible /v1 routes.
"""

import base64
import os
from typing import List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

LMSTUDIO_BASE_URL = os.getenv("LMSTUDIO_BASE_URL", "http://localhost:1234").rstrip("/")
LMSTUDIO_MODEL = os.getenv("LMSTUDIO_MODEL", "medgemma-4b-it-mlx")
LMSTUDIO_EMBED_MODEL = os.getenv("LMSTUDIO_EMBED_MODEL", "text-embedding-nomic-embed-text-v1.5")
LMSTUDIO_TIMEOUT = float(os.getenv("LMSTUDIO_TIMEOUT", "180"))


class LLMError(RuntimeError):
    pass


def _post(path: str, payload: dict) -> dict:
    try:
        resp = httpx.post(f"{LMSTUDIO_BASE_URL}{path}", json=payload, timeout=LMSTUDIO_TIMEOUT)
    except httpx.HTTPError as e:
        raise LLMError(f"LM Studio is not reachable at {LMSTUDIO_BASE_URL}: {e}") from e
    if resp.status_code >= 400:
        raise LLMError(f"LM Studio returned {resp.status_code}: {resp.text[:300]}")
    return resp.json()


def chat(system_prompt: str, user_input: str, model: Optional[str] = None) -> str:
    """One-shot completion via the native API; returns the joined message text."""
    data = _post("/api/v1/chat", {
        "model": model or LMSTUDIO_MODEL,
        "system_prompt": system_prompt,
        "input": user_input,
    })
    parts = [o.get("content", "") for o in data.get("output", []) if o.get("type") == "message"]
    return "".join(parts).strip()


def chat_with_image(system_prompt: str, user_input: str, image_bytes: bytes, mime: str) -> str:
    """medgemma is vision-capable; images go through the OpenAI-compatible endpoint."""
    url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode()}"
    data = _post("/v1/chat/completions", {
        "model": LMSTUDIO_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [
                {"type": "text", "text": user_input},
                {"type": "image_url", "image_url": {"url": url}},
            ]},
        ],
    })
    return (data["choices"][0]["message"]["content"] or "").strip()


class LMStudioEmbeddings:
    """Same interface as langchain embeddings (embed_documents / embed_query), backed by /v1/embeddings."""

    def __init__(self, model: str = LMSTUDIO_EMBED_MODEL):
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        data = _post("/v1/embeddings", {"model": self.model, "input": texts})
        return [row["embedding"] for row in sorted(data["data"], key=lambda r: r["index"])]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]


def health() -> dict:
    try:
        httpx.get(f"{LMSTUDIO_BASE_URL}/api/v1/models", timeout=5).raise_for_status()
        reachable = True
    except httpx.HTTPError:
        reachable = False
    return {"reachable": reachable, "model": LMSTUDIO_MODEL, "base_url": LMSTUDIO_BASE_URL}
