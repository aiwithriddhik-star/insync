"""
vectorstore.py

The single place that builds the embedding model and opens the Chroma collection, so indexing
(chunks.py) and chat retrieval (agent.py) always use the same embeddings.
"""

import os
from pathlib import Path

import chromadb
from dotenv import load_dotenv

load_dotenv()

CHROMA_DIR = os.getenv("CHROMA_DIR", str(Path(__file__).resolve().parent / "chroma_db"))
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents")

# "lmstudio"              -> LM Studio /v1/embeddings (same local server as the chat model)
# "ollama"                -> langchain OllamaEmbeddings (needs a running Ollama server)
# "sentence_transformers" -> local HuggingFace model through langchain-huggingface
EMBEDDING_BACKEND = os.getenv("EMBEDDING_BACKEND", "lmstudio")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
ST_EMBED_MODEL = os.getenv("ST_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

_embeddings = None
_client = None


def embedding_tag() -> str:
    if EMBEDDING_BACKEND == "lmstudio":
        from llm import LMSTUDIO_EMBED_MODEL
        return f"lmstudio:{LMSTUDIO_EMBED_MODEL}"
    if EMBEDDING_BACKEND == "ollama":
        return f"ollama:{OLLAMA_EMBED_MODEL}"
    if EMBEDDING_BACKEND == "sentence_transformers":
        return f"sentence_transformers:{ST_EMBED_MODEL}"
    raise ValueError(f"Unknown EMBEDDING_BACKEND '{EMBEDDING_BACKEND}' (use 'lmstudio', 'ollama' or 'sentence_transformers')")


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        embedding_tag()   # validates the backend name
        if EMBEDDING_BACKEND == "lmstudio":
            from llm import LMStudioEmbeddings
            _embeddings = LMStudioEmbeddings()
        elif EMBEDDING_BACKEND == "ollama":
            from langchain_ollama import OllamaEmbeddings
            _embeddings = OllamaEmbeddings(model=OLLAMA_EMBED_MODEL)
        else:
            from langchain_huggingface import HuggingFaceEmbeddings
            _embeddings = HuggingFaceEmbeddings(model_name=ST_EMBED_MODEL)
    return _embeddings


def get_collection():
    global _client
    if _client is None:
        os.makedirs(CHROMA_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_DIR)

    tag = embedding_tag()
    coll = _client.get_or_create_collection(COLLECTION_NAME, metadata={"embedding": tag})
    stored = (coll.metadata or {}).get("embedding")
    if stored and stored != tag:
        # Vectors from different models are not comparable (and may differ in dimension)
        raise RuntimeError(
            f"Collection '{COLLECTION_NAME}' was built with embeddings '{stored}' but the current "
            f"setting is '{tag}'. Switch EMBEDDING_BACKEND back, or set a new COLLECTION_NAME / "
            f"CHROMA_DIR and re-ingest the PDFs."
        )
    return coll
