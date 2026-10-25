"""Round 1: every model family with default-ish settings, repeated 5x3 CV on the 80% training split."""
import sys

import pandas as pd

from common import RESULTS_DIR, cross_validate_model, load_xy, make_pipeline, train_holdout_split
from models import nn_models, regression_models, tree_models


def main():
    X, y, meta = load_xy()
    Xtr, _, ytr, _ = train_holdout_split(X, y)
    print(f"Training split: {Xtr.shape}  |  features: {Xtr.shape[1]}  |  PCOS rate {ytr.mean():.2%}\n")

    rows = []
    groups = [("Regression", regression_models(), -1), ("Tree-based", tree_models(), -1),
              ("Neural net", nn_models(), 1)]
    for family, zoo, n_jobs in groups:
        for name, est in zoo.items():
            try:
                row = cross_validate_model(name, family, make_pipeline(est, meta), Xtr, ytr, n_jobs=n_jobs)
            except Exception as e:  # keep the sweep going, report the failure
                print(f"  FAILED {name}: {type(e).__name__}: {e}", file=sys.stderr)
                continue
            rows.append(row)
            print(f"[{family:11}] {name:38} AUC {row['roc_auc_mean']:.4f} ± {row['roc_auc_std']:.4f}  "
                  f"P {row['precision']:.3f} R {row['recall']:.3f}  ({row['fit_seconds']:.0f}s)", flush=True)

    res = pd.DataFrame(rows).sort_values("roc_auc_mean", ascending=False).reset_index(drop=True)
    RESULTS_DIR.mkdir(exist_ok=True)
    res.to_csv(RESULTS_DIR / "round1_cv.csv", index=False)
    print("\n=== Round 1 ranking (ROC AUC, 5x3 repeated CV) ===")
    print(res.round(4).to_string())


if __name__ == "__main__":
    main()
