---
tags:
  - codebase
  - backend
---
# backend - service.py

See [[Backend Overview]]. Mounted in [[backend - main.py]].

**Purpose**: PCOS risk prediction from a saved sklearn pipeline (VotingClassifier with imputers).

- Model loaded at import from `Path(__file__).resolve().parent.parent / "training/results/final_model.joblib"` (CWD-independent).
- Router `prefix="/api"`, tag "psoc".
- `PSOCinput`: 16 fields, each **Optional/nullable, default None**, populated by alias = exact training column names (9 floats, 6 Yes/No ints 0/1, `Cycle(R/I)` in {2,4,5} when not null; `Hair loss(Y/N)` included).
- **`POST /api/psoc`** now takes a **JSON body** (no longer Form). Null/missing -> `np.nan` in the DataFrame row; the pipeline imputers fill it (verified on all-NaN and partial rows). Returns `{"pcos_probability", "prediction", "missing_fields": [column names that were null]}`. Invalid values -> 422.
- Verified: all-empty `{}` gives p=0.0727; full and partial inputs work; Cycle(R/I)=3 gives 422.

Related: [[backend - report_routes.py]].
