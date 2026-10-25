---
tags:
  - codebase
  - backend
---
# backend - insynccc.py

See [[Backend Overview]]. **Not Python-importable**: it is a Colab notebook export ("Copy of Untitled8.ipynb") containing `!pip install` and `!zip` shell lines and `google.colab` imports. Reference/offline only; never run by the backend.

Pipeline (445 lines):
1. Upload PDFs to `/content/sample_data/pdfs` (15-22).
2. `extract_chunks_from_paper` (27): pypdf text, strip references/URLs/citations, sentence windows (window 4, stride 2, 150-1800 chars). Drops methodology-heavy chunks (63-70).
3. Seeded BERTopic (74-138): SciBERT `pritamdeka/S-Scibert-snli-multinli-stsb`, UMAP, CountVectorizer with custom stopwords, 6 seed topics (menstrual disorders, PCOS/hormonal, lifestyle, psychosocial, health seeking, stigma/access).
4. Exports: `cloud_terms.json` (top 150 words), `interactive_wordcloud_data.json`, `menstrual_wordcloud.png`, `topic_*.html` charts, `menstrual_bertopic_model` (safetensors), `document_store.json` (233-239).
5. Writes `topic_router.py` and `main.py` via commented `%%writefile` (245-387; same as [[backend - fron.py]] and [[backend - onemain.py]]), starts uvicorn on 127.0.0.1:8000 in a thread, smoke tests endpoints (389-440), zips `topic_files.zip` (444).

No secrets. No LLM calls.
