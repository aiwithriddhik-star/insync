# InSync
## Menstrual Health, Beyond the Calendar.

**An intelligent, accessible menstrual health companion that goes beyond cycle tracking to support symptom awareness, medical understanding, and everyday health management.**

Built for **recHERsion'26 · PS1: Women's Healthcare**. Design and build a digital solution that addresses gaps in diagnosis, symptom tracking, health awareness, or access to meaningful clinical insights.

InSync helps women understand their menstrual and reproductive health. It combines a cycle and symptom tracker, a **PCOS risk estimate** from a validated ML model, a **lab report simplifier**, a **research-grounded chat assistant** (RAG over medical papers), and an explorable **research word cloud** built with topic modelling. The whole LLM stack runs **locally** through LM Studio, so health data never leaves the machine.

> ⚠️ **Educational tool, not medical advice.** InSync does not diagnose, prescribe, or replace a clinician. Every AI feature is prompted to avoid diagnosis and treatment advice and to point users to professional care.

---

## Table of contents

- [The problem](#the-problem)
- [Our solution](#our-solution)
- [Our USP: Beyond the Calendar](#our-usp-beyond-the-calendar)
- [The InSync journey](#the-insync-journey)
- [Features](#features)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [API reference](#api-reference)
- [PCOS model: research and results](#pcos-model-research-and-results)
- [Research topic model](#research-topic-model)
- [Why InSync is feasible](#why-insync-is-feasible)
- [Impact and benefits](#impact-and-benefits)
- [Future scope](#future-scope)
- [Project notes (Obsidian vault)](#project-notes-obsidian-vault)
- [Limitations and disclaimers](#limitations-and-disclaimers)

---

## The problem

Menstrual health applications have made cycle tracking accessible, but understanding menstrual health requires more than knowing when the next period will arrive.

- **Unrecognised symptoms:** Persistent pain, heavy bleeding, and irregular cycles may be normalised or overlooked, even when they warrant medical evaluation.
- **The information gap:** Conditions such as PCOS and endometriosis can involve complex symptoms that are difficult to interpret without appropriate medical guidance.
- **The medical language barrier:** Lab reports and clinical terminology can leave individuals struggling to understand their own health information.
- **The affordability gap:** Recurring menstrual product expenses and inadequate inventory planning create an additional everyday burden.
- **The literacy gap:** Limited access to understandable, reliable information makes it harder to make informed decisions about menstrual health.

**The core problem:** Users can track their periods without necessarily understanding their symptoms, their medical information, or their options for managing their health.

---

## Our solution

InSync brings menstrual tracking, symptom-pattern awareness, medical information comprehension, menstrual health education, and period-product budgeting into one connected platform.

Rather than treating menstruation as a monthly calendar event, InSync treats it as an ongoing aspect of health that deserves attention, understanding, and informed management.

The platform has integrated modules:

1. **Smart Period Tracker:** records cycle dates, symptoms, and recurring patterns to provide a more comprehensive picture of menstrual health.
2. **Beyond the Calendar (our USP):** symptom organisers and pattern awareness for endometriosis, dysmenorrhea, heavy bleeding, and irregular cycles, plus a PCOS risk estimate.
3. **Period Budget Planner:** helps users estimate menstrual product expenses, monitor inventory, and plan purchases according to their needs and budget.
4. **Lab Report Simplifier:** breaks down medical terminology into accessible explanations and suggests questions users can discuss with their healthcare professional.
5. **Ask InSync:** accessible answers to menstrual health questions, supported by reliable medical references.
6. **Learn:** educational articles combined with an interactive menstrual health word cloud to make essential terminology and concepts easier to discover.

Together, these modules connect health awareness with practical, informed action.

---

## Our USP: Beyond the Calendar

### From predicting periods to understanding patterns.

Traditional period tracking primarily focuses on cycle dates, period predictions, and fertile windows. InSync goes a step further by focusing on the patterns that may matter beyond the calendar.

- **Symptom-centred analysis:** considers symptoms and menstrual patterns alongside cycle information rather than focusing exclusively on dates.
- **Beyond routine predictions:** explores patterns associated with menstrual health concerns that may otherwise be overlooked.
- **Data-driven insights:** uses a machine-learning model trained on a publicly available dataset, subject to the dataset's suitability and limitations.
- **Awareness, not diagnosis:** helps users recognise patterns worth discussing with a healthcare professional without claiming to identify or confirm a medical condition.
- **A pathway to understanding:** connects symptom awareness with educational resources and tools that help users prepare for informed healthcare conversations.

> A conventional tracker helps you anticipate your period. InSync aims to help you understand the patterns surrounding it.

---

## The InSync journey

Consider a user who repeatedly experiences irregular cycles and significant menstrual discomfort.

1. **Record:** the user logs cycle dates, symptoms, and relevant changes over time.
2. **Analyse:** InSync examines available data for recurring patterns using its configured analytical model.
3. **Inform:** the application presents relevant observations and educational information, making its limitations clear.
4. **Understand:** the user explores reliable information through the Learn section or the chat assistant.
5. **Prepare:** if appropriate, the user can use the report simplifier and its suggested questions to prepare for a medical consultation.
6. **Manage:** the user continues tracking symptoms and uses the budget planner to manage menstrual product inventory and expenses.

The value lies not in a single prediction, but in connecting information that is usually scattered across different tools.

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
                                      │  chat   ─▶ RAG ─▶ llm        │
                                      │  report ─▶ llm (vision/text) │
                                      │  psoc   ─▶ final_model.joblib│
                                      │  topics ─▶ BERTopic model    │
                                      └──────────────┬───────────────┘
                                                     │ HTTP
                                      ┌──────────────▼───────────────┐
                                      │                              │
                                      │  chat:  medgemma-4b-it-mlx   │
                                      │  embed: nomic-embed-text-v1.5│
                                      └──────────────────────────────┘
```

**Layers**

- **User interface:** React and Tailwind provide interfaces for tracking, symptom logging, budgeting, report uploads, Q&A, and education.
- **Application backend:** FastAPI and Python validate requests, manage application logic, and route tasks to the appropriate service.
- **Intelligence and processing:** a scikit-learn symptom/PCOS model, Nomic embeddings for semantic retrieval, MedGemma for language and vision tasks, PyMuPDF for document extraction, and BERTopic for topic discovery.
- **Storage:** ChromaDB for the document index and local files for uploads. Health information and personal records need suitable security, permissions, and retention controls.

**Design notes**

- **RAG (retrieve, then answer).** MedGemma is not trained for tool use, so the pipeline always queries Chroma first. It keeps up to 5 chunks under a distance threshold (`RAG_MAX_DISTANCE`, default 0.85) and puts them in the prompt with the last 6 turns of history.
- **PDF ingestion.** `chunks.py` extracts text with PyMuPDF and chunks it by paragraph. `pdf_table.py` rebuilds tables that span several pages and drops running headers and footers.
- **Embeddings** can come from `lmstudio` (default), `ollama` or `sentence_transformers`. Each Chroma collection is tagged with the embedding model that built it, and a mismatch raises an error instead of silently returning bad results.

The modular design separates the interface, analytical models, document processing, and storage, so each module can be maintained and improved independently.


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



## Why InSync is feasible

- **Technically feasible.** Built on established frameworks, open-source libraries, and existing model infrastructure, which reduces the need to build every component from scratch.
- **Modular development.** Each feature can be developed and tested independently before integration, so the core USP can be prioritised while secondary modules keep improving.
- **Data-driven development.** A public dataset supports initial model development and evaluation, provided its labels, representativeness, licensing, and limitations suit the intended task.
- **Responsible AI.** InSync is positioned as an awareness and educational tool rather than a diagnostic system. Model limitations, uncertainty, and the need for clinical evaluation stay explicit.
- **Private by design.** Running the LLM stack locally keeps health data on the user's machine.

**Strategy:** build a functional core first, validate its performance, and expand through clearly defined development stages.

---

## Impact and benefits

- **Health awareness:** encourages users to document symptoms and recognise recurring patterns that may warrant professional evaluation.
- **Informed healthcare conversations:** helps users understand medical terminology and prepare relevant questions for their next appointment.
- **Improved menstrual health literacy:** makes menstrual health information easier to discover, understand, and revisit.
- **Financial empowerment:** supports expense estimation, inventory tracking, and more informed menstrual product purchasing decisions.
- **Greater accessibility:** creates a foundation for multilingual education and more inclusive access to menstrual health information.
- **A connected experience:** brings tracking, awareness, education, report comprehension, and practical menstrual management into one platform.

---

## Future scope

These are planned extensions, not claims of already implemented functionality.

1. **Direct e-commerce integration.** Connect the budget planner with supported e-commerce or quick-commerce APIs so users can check availability, compare prices, and order without searching across multiple apps.
2. **Multilingual menstrual health.** Expand the chat assistant, educational content, and report explanations into multiple languages.
3. **Stronger model validation.** Evaluate on representative data, assess limitations across populations, and explore clinical collaboration where appropriate.
4. **Personalised health education.** Improve the relevance of educational content based on user-selected topics and recorded concerns, while maintaining privacy and avoiding unsupported medical conclusions.
5. **A more connected ecosystem.** Keep bringing tracking, education, report comprehension, and everyday product management together in a single platform.

---



## Limitations and disclaimers

- **Not a medical device.** All outputs are educational. The chat and report prompts forbid diagnosis and treatment advice, and the UI repeats this on every health page.
- **PCOS model scope.** The model was trained on one small public dataset and validated on a single 20% holdout, with **no external validation**. Its probabilities may not generalise to other populations.
- **Report simplifier.** It judges values only against the reference range printed on the report. Vision OCR from a 4B model can misread values, so always check them against the original.
- **Privacy.** All inference runs locally through LM Studio. Uploaded files are stored under `backend/uploads/` and indexed in `backend/chroma_db/`; both are git-ignored.

---

## InSync: because menstrual health is more than a date.

Menstrual health deserves more than a calendar reminder. It deserves tools that help people recognise patterns, understand information, access reliable education, and manage their everyday needs.
