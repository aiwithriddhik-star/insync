"""Round 2: tune the strongest candidates with NESTED CV (inner random search, outer repeated CV).

Outer scores are therefore not inflated by hyperparameter selection. The ensemble uses fixed
round-1 settings (no tuning), so its score is clean as well.
"""
import sys

import pandas as pd
from scipy.stats import loguniform
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression, LogisticRegressionCV, Ridge
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline as sk_pipeline
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier

from common import RESULTS_DIR, SEED, cross_validate_model, load_xy, make_pipeline, train_holdout_split
from models import CS, SPW
from torch_mlp import TorchMLPClassifier

N_ITER = 25
inner = StratifiedKFold(5, shuffle=True, random_state=SEED)


def search(est, space, meta, n_iter=N_ITER):
    return RandomizedSearchCV(make_pipeline(est, meta), {f"model__{k}": v for k, v in space.items()},
                              n_iter=n_iter, cv=inner, scoring="roc_auc", random_state=SEED, n_jobs=1)


def build(meta):
    tuned = {
        "Random forest (tuned)": (RandomForestClassifier(class_weight="balanced", random_state=SEED, n_jobs=1), {
            "n_estimators": [300, 500, 800], "max_depth": [None, 3, 5, 8],
            "min_samples_leaf": [1, 2, 4, 8], "max_features": ["sqrt", 0.3, 0.5, 0.8, None]}, "Tree-based", -1),
        "Extra trees (tuned)": (ExtraTreesClassifier(class_weight="balanced", random_state=SEED, n_jobs=1), {
            "n_estimators": [300, 500, 800], "max_depth": [None, 3, 5, 8],
            "min_samples_leaf": [1, 2, 4, 8], "max_features": ["sqrt", 0.3, 0.5, 0.8, None]}, "Tree-based", -1),
        "XGBoost (tuned)": (XGBClassifier(scale_pos_weight=SPW, tree_method="hist", eval_metric="auc",
                                          n_jobs=1, random_state=SEED, verbosity=0), {
            "n_estimators": [100, 200, 400], "max_depth": [2, 3, 4, 5], "learning_rate": loguniform(0.01, 0.2),
            "subsample": [0.6, 0.8, 1.0], "colsample_bytree": [0.5, 0.8, 1.0],
            "min_child_weight": [1, 3, 5], "reg_lambda": loguniform(0.1, 20)}, "Tree-based", -1),
        "LightGBM (tuned)": (LGBMClassifier(class_weight="balanced", subsample_freq=1, n_jobs=1,
                                            random_state=SEED, verbose=-1), {
            "n_estimators": [100, 200, 400], "num_leaves": [4, 8, 16], "learning_rate": loguniform(0.01, 0.2),
            "subsample": [0.6, 0.8, 1.0], "colsample_bytree": [0.5, 0.8, 1.0],
            "min_child_samples": [5, 10, 20], "reg_lambda": loguniform(0.1, 20)}, "Tree-based", -1),
        "Logistic ElasticNet (tuned)": (LogisticRegression(penalty="elasticnet", solver="saga", max_iter=5000,
                                                           class_weight="balanced"), {
            "C": loguniform(1e-3, 1e2), "l1_ratio": [0.1, 0.3, 0.5, 0.7, 0.9]}, "Regression", -1),
        "Ridge + interactions (tuned)": (None, None, "Regression", -1),  # built below
        "MLP sklearn lbfgs (tuned) [CPU]": (MLPClassifier(solver="lbfgs", max_iter=2000, random_state=SEED), {
            "hidden_layer_sizes": [(16,), (32,), (64,), (32, 16)], "alpha": loguniform(1e-3, 1e1)},
                                            "Neural net", -1),
        "MLP torch (tuned) [MPS GPU]": (TorchMLPClassifier(random_state=SEED), {
            "hidden": [(16,), (32,), (32, 16), (64, 32)], "dropout": [0.0, 0.1, 0.3, 0.5],
            "weight_decay": loguniform(1e-4, 1e-1), "lr": loguniform(5e-4, 1e-2), "epochs": [60, 100, 150]},
                                         "Neural net", 1),
    }
    out = {}
    for name, (est, space, family, n_jobs) in tuned.items():
        if name.startswith("Ridge + interactions"):
            # Pairwise interactions give the linear model some non-linearity; ridge keeps it in check
            pipe = RandomizedSearchCV(
                make_pipeline(sk_pipeline(PolynomialFeatures(2, include_bias=False), StandardScaler(),
                                          LogisticRegression(max_iter=5000, class_weight="balanced")), meta),
                {"model__logisticregression__C": loguniform(1e-4, 1e0)}, n_iter=N_ITER, cv=inner,
                scoring="roc_auc", random_state=SEED, n_jobs=1)
            out[name] = (family, pipe, n_jobs)
        else:
            n_it = 10 if "torch" in name else N_ITER  # GPU model: fewer configs, it is the slow one
            out[name] = (family, search(est, space, meta, n_it), n_jobs)

    # Untuned soft-voting ensemble of diverse learners (linear + bagged trees + neural net)
    ens = VotingClassifier([
        ("rf", RandomForestClassifier(n_estimators=500, min_samples_leaf=2, class_weight="balanced",
                                      random_state=SEED, n_jobs=1)),
        ("lr", LogisticRegressionCV(Cs=CS, cv=5, scoring="roc_auc", max_iter=5000,
                                    class_weight="balanced", random_state=SEED)),
        ("mlp", TorchMLPClassifier(hidden=(32, 16), dropout=0.2, random_state=SEED)),
    ], voting="soft")
    out["Ensemble RF+Logistic+MLP (soft vote)"] = ("Ensemble", make_pipeline(ens, meta), 1)
    out["Ensemble RF+Logistic (soft vote)"] = ("Ensemble", make_pipeline(VotingClassifier([
        ("rf", RandomForestClassifier(n_estimators=500, min_samples_leaf=2, class_weight="balanced",
                                      random_state=SEED, n_jobs=1)),
        ("lr", LogisticRegressionCV(Cs=CS, cv=5, scoring="roc_auc", max_iter=5000,
                                    class_weight="balanced", random_state=SEED))], voting="soft"), meta), -1)
    return out


def main():
    X, y, meta = load_xy()
    Xtr, _, ytr, _ = train_holdout_split(X, y)
    rows = []
    for name, (family, pipe, n_jobs) in build(meta).items():
        try:
            row = cross_validate_model(name, family, pipe, Xtr, ytr, n_repeats=2, n_jobs=n_jobs)
        except Exception as e:
            print(f"  FAILED {name}: {type(e).__name__}: {e}", file=sys.stderr)
            continue
        rows.append(row)
        print(f"[{family:10}] {name:40} AUC {row['roc_auc_mean']:.4f} ± {row['roc_auc_std']:.4f}  "
              f"P {row['precision']:.3f} R {row['recall']:.3f}  ({row['fit_seconds']:.0f}s)", flush=True)
    res = pd.DataFrame(rows).sort_values("roc_auc_mean", ascending=False).reset_index(drop=True)
    res.to_csv(RESULTS_DIR / "round2_nested_cv.csv", index=False)
    print("\n=== Round 2 ranking (nested CV, ROC AUC) ===")
    print(res.round(4).to_string())


if __name__ == "__main__":
    main()
