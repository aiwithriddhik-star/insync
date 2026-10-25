---
tags:
  - codebase
  - backend
---
# backend - vectorstore.py

See [[Backend Overview]]; used by [[backend - chunks.py]]. LM Studio change: [[Backend - LLM Integration Points]].

**Purpose**: single factory for the embedding model and the Chroma collection.

## Config (env, `load_dotenv()` at line 14)
- `CHROMA_DIR` default `backend/chroma_db` (16), `COLLECTION_NAME`="documents" (17)
- `EMBEDDING_BACKEND` default `"ollama"` (21), `OLLAMA_EMBED_MODEL`="nomic-embed-text" (22), `ST_EMBED_MODEL`="sentence-transformers/all-MiniLM-L6-v2" (23)

## Functions
- `embedding_tag() -> str` (29): `ollama:<model>` / `sentence_transformers:<model>`, else ValueError.
- `get_embeddings()` (37): cached `OllamaEmbeddings(model=...)` (langchain_ollama, default http://localhost:11434) or `HuggingFaceEmbeddings`.
- `get_collection()` (50): cached `chromadb.PersistentClient(path=CHROMA_DIR)`; `get_or_create_collection(name, metadata={"embedding": tag})`; raises `RuntimeError` if stored tag differs from current (56-65). Switching to LM Studio embeddings requires a new COLLECTION_NAME/CHROMA_DIR and re-ingest.

Vector DB: ChromaDB persistent, local disk, no auth. Embeddings are supplied manually (no embedding function on the collection).
