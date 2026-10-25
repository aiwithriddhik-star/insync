# InSync — Women's Health Companion

> Built for **recHERsion'26 · PS1: Women's Healthcare**. Design and build a digital solution that addresses gaps in diagnosis, symptom tracking, health awareness, or access to meaningful clinical insights.

InSync helps women understand their menstrual and reproductive health. It combines a cycle and symptom tracker, a **PCOS risk estimate** from a validated ML model, a **lab report simplifier**, a **research-grounded chat assistant** (RAG over medical papers), and an explorable **research word cloud** built with topic modelling. The whole LLM stack runs **locally** through LM Studio, so health data never leaves the machine.

> ⚠️ **Educational tool, not medical advice.** InSync does not diagnose, prescribe, or replace a clinician. Every AI feature is prompted to avoid diagnosis and treatment advice and to point users to professional care.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [PCOS model: research and results](#pcos-model-research-and-results)
- [Research topic model](#research-topic-model)
- [Project notes (Obsidian vault)](#project-notes-obsidian-vault)
- [Limitations and disclaimers](#limitations-and-disclaimers)

---

## Features

| Feature | Page | What it does |
|---|---|---|
| **Cycle Tracker** | `#analysis` | Log periods, flow, pain and symptoms; view cycle insights. |
| **Beyond the Calendar** | `#concerns` | Symptom organisers for endometriosis, dysmenorrhea, heavy bleeding and irregular cycles. |
| **PCOS Check** | `#pcos` | Step-by-step questionnaire with optional clinical values. Returns a PCOS probability from the trained model (`POST /api/psoc`). Missing answers are allowed and are imputed. |
| **Lab Report Simplifier** | `#lab-report` | Upload a PDF or photo of a lab report. MedGemma explains each value in plain language and flags it as below, within or above the range printed on the report. |
| **Ask InSync** | `#chat` | Chat grounded in uploaded documents and research papers (RAG over ChromaDB). Answers cite sources as `(Source: file.pdf, p. N)` and suggest follow-up questions. |
| **Learn** | `#info` | Educational cards plus an interactive **research word cloud**. Click a term to see the paper excerpts behind it. |
| **Care & Budget** | `#care-budget` | Period care and product budget planner. |
| **Profile** | `#profile` | Local profile that personalises the other pages. |

---

## Architecture

```
┌────────────────────────┐   /api/*   ┌──────────────────────────────┐
│  Frontend (React 19 +  │ ─────────▶ │  Backend (FastAPI, :8000)    │
│  Vite 8 + Tailwind 4)  │  (Vite     │                              │
│  :5173                 │   proxy)   │  upload ─▶ chunks/pdf_table  │
└────────────────────────┘            │            ─▶ vectorstore    │
                                      │               (ChromaDB)     │
                                      │  chat   ─▶ agent (RAG) ─▶ llm│
                                      │  report ─▶ llm (vision/text) │
                                      │  psoc   ─▶ final_model.joblib│
                                      │  topics ─▶ BERTopic model    │
                                      └──────────────┬───────────────┘
                                                     │ HTTP
                                      ┌──────────────▼───────────────┐
                                      │  LM Studio (:1234)           │
                                      │  chat:  medgemma-4b-it-mlx   │
                                      │  embed: nomic-embed-text-v1.5│
                                      └──────────────────────────────┘
```

- **RAG (retrieve, then answer).** MedGemma is not trained for tool use, so `agent.py` always queries Chroma first. It keeps up to 5 chunks under a distance threshold (`RAG_MAX_DISTANCE`, default 0.85) and puts them in the prompt with the last 6 turns of history.
- **PDF ingestion.** `chunks.py` extracts text with PyMuPDF and chunks it by paragraph. `pdf_table.py` rebuilds tables that span several pages and drops running headers and footers.
- **Embeddings** can come from `lmstudio` (default), `ollama` or `sentence_transformers`. Each Chroma collection is tagged with the embedding model that built it, and a mismatch raises an error instead of silently returning bad results.

---

## Repository layout

```
.
├── backend/                 FastAPI app (run from this folder)
│   ├── main.py              App entrypoint: mounts all routers
│   ├── agent.py             RAG answer pipeline + safety system prompt
│   ├── chat_routes.py       POST /api/chat
│   ├── upload_routes.py     POST /api/upload (PDF → Chroma)
│   ├── report_routes.py     POST /api/report/explain (lab report simplifier)
│   ├── service.py           POST /api/psoc (PCOS probability)
│   ├── topic_router.py      /api/v1/* word cloud, drill-down, classify, charts
│   ├── train_topics.py      BERTopic training on contents/*.pdf
│   ├── chunks.py, pdf_table.py, vectorstore.py, llm.py
│   ├── onemain.py           Minimal topic-only app (word cloud only)
│   ├── insynccc.py          Exported Colab notebook (reference, not an entrypoint)
│   └── contents/            Research PDFs + trained BERTopic artifacts
├── frontend/                React + Vite + Tailwind SPA (hash routing)
│   └── src/{pages,components,api,utils}
├── dataset/                 PCOS datasets (with / without infertility)
├── model/                   Statistical EDA: t-tests, chi², bar/box plots
├── output/                  EDA plots
├── training/                PCOS ML pipeline, preprocessed data, results/
├── research/                Reference material links
├── recHERsion26/            Obsidian vault: rulebook, PRD, codebase notes
├── pyproject.toml / uv.lock Python deps (Python ≥ 3.13, managed with uv)
└── Problem_statement.txt
```

---

## Getting started

### Prerequisites

- Python **3.13+** and [uv](https://docs.astral.sh/uv/)
- Node.js and **pnpm**
- [LM Studio](https://lmstudio.ai/) with these models loaded and the local server running on `:1234`:
  - `medgemma-4b-it-mlx` (chat + vision)
  - `text-embedding-nomic-embed-text-v1.5` (embeddings)

### 1. Backend

```bash
uv sync                                   # install Python deps into .venv
cp backend/.env.example backend/.env      # then edit if needed
cd backend
uv run uvicorn main:app --port 8000 --reload
```

> Run from inside `backend/`. The modules use flat imports (`import llm`), so `uvicorn backend.main:app` from the repo root will fail.

On first start the topic router trains BERTopic if no model is present. The committed artifacts in `backend/contents/` avoid that. Check health at <http://127.0.0.1:8000/api/health>.

**Key environment variables** (`backend/.env`):

| Variable | Default | Purpose |
|---|---|---|
| `LMSTUDIO_BASE_URL` | `http://localhost:1234` | LM Studio server |
| `LMSTUDIO_MODEL` | `medgemma-4b-it-mlx` | Chat / vision model |
| `LMSTUDIO_EMBED_MODEL` | `text-embedding-nomic-embed-text-v1.5` | Embedding model |
| `LMSTUDIO_TIMEOUT` | `180` | Request timeout (s) |
| `EMBEDDING_BACKEND` | `lmstudio` | `lmstudio` \| `ollama` \| `sentence_transformers` (changing it requires re-ingesting) |
| `RAG_MAX_DISTANCE` | `0.85` | Max Chroma L2 distance for a chunk to be used. Measured: relevant chunks 0.28–0.76, unrelated ≥ 0.94 |
| `INSYNC_DATA_DIR` | `backend/contents` | Folder with topic-model artifacts |
| `CORS_ORIGINS` | — | Extra origins (`localhost:5173` is always allowed) |
| `HF_TOKEN` | — | For downloading the topic-model embedder |

### 2. Frontend

```bash
cd frontend
pnpm install
pnpm dev            # http://localhost:5173
```

Vite proxies `/api` to `http://127.0.0.1:8000`. To call the backend directly instead, set `VITE_API_BASE` (see `frontend/.env.example`).

### 3. (Optional) Reproduce the PCOS model

```bash
uv run python training/export_preprocessed.py
uv run python training/run_round1.py        # broad model comparison
uv run python training/run_round2.py        # nested CV with tuning
uv run python training/run_resampling.py    # class-imbalance study
uv run python training/run_overfitting.py   # overfitting diagnostics
uv run python training/run_final.py         # fit finalist, score holdout, save model
```

---

## API reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Liveness check |
| GET | `/api/health` | Backend + LM Studio reachability, model, base URL |
| POST | `/api/upload` | Upload a PDF and index it in ChromaDB |
| POST | `/api/chat` | `{query, source_id?, history[]}` → RAG answer, sources, suggested follow-ups |
| POST | `/api/psoc` | 16 optional clinical/questionnaire fields → `{pcos_probability, prediction, missing_fields}` |
| POST | `/api/report/explain` | Multipart PDF/JPG/PNG (≤ 10 MB) → structured plain-language explanation |
| GET | `/api/v1/wordcloud?limit=1..300` | Research word-cloud terms |
| GET | `/api/v1/drill-down?keyword=&limit=` | Paper excerpts containing a term |
| POST | `/api/v1/classify` | `{text}` → closest research theme |
| GET | `/api/v1/export-cloud-image` | Word cloud as base64 PNG |
| GET | `/api/v1/charts/{chart_name}` | BERTopic charts (`topic_barchart`, `topic_distance_map`, `topic_hierarchy`) |

---

## PCOS model: research and results

**Data.** Public PCOS clinical dataset in `dataset/` (`PCOS_data_without_infertility.xlsx`, `PCOS_infertility.csv`). It is preprocessed into 16 features in `training/preprocessed_data/`.

**Exploratory statistics** (`model/`):
- Welch t-tests on numeric features and chi-square tests on categorical features, PCOS vs non-PCOS
- Bar and box plots in `output/`

**Modelling pipeline** (`training/`):
1. **Split.** One 80/20 stratified train/holdout split. The holdout is scored only once, at the end.
2. **Round 1.** A broad model zoo, all scored with `RepeatedStratifiedKFold` (5×3, ROC AUC):
   - Logistic regression variants and Ridge
   - Random forest, ExtraTrees, gradient boosting, AdaBoost, bagging
   - XGBoost and LightGBM
   - sklearn MLP and a PyTorch MLP (MPS)
3. **Feature selection.** Statistical feature shortlisting runs **inside each fold** (`fold_selection.py`, Bonferroni) to avoid leakage.
4. **Round 2.** Nested CV: random search in an inner 5-fold loop, evaluated in an outer repeated CV.
5. **Imbalance study.** Compares class weights, ROS, SMOTENC and RUS, with resampling applied only within folds.
6. **Overfitting diagnostics:**
   - Train/validation gap and learning curves
   - Label-permutation test
   - Stability of the features selected in each fold
7. **Final model.** The RF + Logistic soft-voting ensemble is saved as `training/results/final_model.joblib` and served by `/api/psoc`.

**Headline results:**

| Evaluation | Model | ROC AUC | Precision | Recall |
|---|---|---|---|---|
| Nested CV (`round2_nested_cv.csv`) | RF + Logistic ensemble | **0.955 ± 0.019** | 0.80 | 0.87 |
| Holdout (`final_holdout.csv`) | RF + Logistic ensemble | **0.944** (95% CI 0.882–0.990) | 0.838 | 0.861 |

Holdout confusion matrix: TP 31 · FP 6 · FN 5 · TN 67. On shuffled labels the permutation test gives AUC ≈ 0.50 (p ≈ 0.01), so the signal is real and not an artefact. Plots are in `training/results/`: `model_comparison.png`, `resampling_comparison.png`, `overfitting_analysis.png` and `permutation_importance.png`.

---

## Research topic model

`backend/train_topics.py` fits **BERTopic** on the menstrual-health papers in `backend/contents/`:
- **Embedder:** `pritamdeka/S-Scibert-snli-multinli-stsb`
- **Seed topics:** guided seed-topic lists
- **Filtering:** methodology terms such as PRISMA and JBI are removed

Outputs:
- the saved model (`menstrual_bertopic_model/`)
- a `document_store.json` of chunks for drill-down
- `cloud_terms.json` for the word cloud
- interactive charts: bar chart, distance map and hierarchy

The Learn page uses these so users can explore what the research actually says.

---

## Project notes (Obsidian vault)

`recHERsion26/` is an Obsidian vault with the design and research record:

- `00 - Rulebook & Problem Statements`
- `01 - PS1 Healthcare - Pretrained Models`
- `02 - PS1 Healthcare - Datasets & Papers`
- `03 - Reference Material Review`
- `04 - PRD - Sakhi Niche Women's Health Features`: the product requirements, including decisions from the 24 Oct team discussion
- `codebase/`: per-file backend notes, frontend overview, API contract, and the *Frontend ↔ Backend ↔ LM Studio* integration plan

---

## Limitations and disclaimers

- **Not a medical device.** All outputs are educational. The chat and report prompts forbid diagnosis and treatment advice, and the UI repeats this on every health page.
- **PCOS model scope.** The model was trained on one small public dataset and validated on a single 20% holdout, with **no external validation**. Its probabilities may not generalise to other populations.
- **Report simplifier.** It judges values only against the reference range printed on the report. Vision OCR from a 4B model can misread values, so always check them against the original.
- **Privacy.** All inference runs locally through LM Studio. Uploaded files are stored under `backend/uploads/` and indexed in `backend/chroma_db/`; both are git-ignored.
