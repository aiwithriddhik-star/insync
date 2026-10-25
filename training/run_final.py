"""Final: fit the CV-selected model on the training split, score ONCE on the untouched holdout.

The finalist is chosen from nested-CV results only (see round2_nested_cv.csv). The other models are
scored on the holdout for reference and must not drive the choice.
"""
import warnings

import joblib
import matplotlib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegressionCV, RidgeCV
from sklearn.metrics import (confusion_matrix, precision_score, recall_score, roc_auc_score, roc_curve)

from common import RESULTS_DIR, SEED, load_xy, make_pipeline, score_of, train_holdout_split
from models import CS
from torch_mlp import TorchMLPClassifier

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

warnings.filterwarnings("ignore")
FINALIST = "Ensemble RF+Logistic (soft vote)"


def rf():
    return RandomForestClassifier(n_estimators=500, min_samples_leaf=2, class_weight="balanced",
                                  random_state=SEED, n_jobs=-1)


def lr():
    return LogisticRegressionCV(Cs=CS, cv=5, scoring="roc_auc", max_iter=5000, class_weight="balanced",
                                random_state=SEED)


def bootstrap_auc_ci(y, s, n=2000):
    rng = np.random.default_rng(SEED)
    y, s = np.asarray(y), np.asarray(s)
    aucs = []
    while len(aucs) < n:
        i = rng.integers(0, len(y), len(y))
        if y[i].min() != y[i].max():
            aucs.append(roc_auc_score(y[i], s[i]))
    return np.percentile(aucs, [2.5, 97.5])


def main():
    X, y, meta = load_xy()
    Xtr, Xte, ytr, yte = train_holdout_split(X, y)

    models = {
        FINALIST: make_pipeline(VotingClassifier([("rf", rf()), ("lr", lr())], voting="soft"), meta),
        "Random forest": make_pipeline(rf(), meta),
        "Logistic (L2 / ridge)": make_pipeline(lr(), meta),
        "Ridge regression": make_pipeline(RidgeCV(alphas=[0.01, 0.1, 1, 10, 100, 1000]), meta),
        "MLP torch (32-16) [MPS GPU]": make_pipeline(TorchMLPClassifier(hidden=(32, 16), random_state=SEED), meta),
    }
    rows, curves, fitted = [], {}, {}
    for name, pipe in models.items():
        est = clone(pipe).fit(Xtr, ytr)
        fitted[name] = est
        s = score_of(est, Xte)
        pred = (s >= 0.5).astype(int)
        lo, hi = bootstrap_auc_ci(yte, s)
        tn, fp, fn, tp = confusion_matrix(yte, pred).ravel()
        rows.append({"model": name, "holdout_auc": roc_auc_score(yte, s), "auc_ci_low": lo, "auc_ci_high": hi,
                     "precision": precision_score(yte, pred), "recall": recall_score(yte, pred),
                     "TP": tp, "FP": fp, "FN": fn, "TN": tn})
        curves[name] = roc_curve(yte, s)
    res = pd.DataFrame(rows)
    res.to_csv(RESULTS_DIR / "final_holdout.csv", index=False)
    print(f"Holdout: {len(yte)} patients, {int(yte.sum())} PCOS\n")
    print(res.round(4).to_string(index=False))

    joblib.dump(fitted[FINALIST], RESULTS_DIR / "final_model.joblib")

    # Permutation importance on the holdout: how much AUC drops when a feature is shuffled
    imp = permutation_importance(fitted[FINALIST], Xte, yte, scoring="roc_auc", n_repeats=30, random_state=SEED)
    imp_df = pd.DataFrame({"feature": Xte.columns, "auc_drop": imp.importances_mean,
                           "std": imp.importances_std}).sort_values("auc_drop", ascending=False)
    imp_df.to_csv(RESULTS_DIR / "final_permutation_importance.csv", index=False)
    print("\nPermutation importance (holdout AUC drop):")
    print(imp_df.round(4).to_string(index=False))

    # --- plots ---
    r1, r2 = pd.read_csv(RESULTS_DIR / "round1_cv.csv"), pd.read_csv(RESULTS_DIR / "round2_nested_cv.csv")
    r1["round"], r2["round"] = "Round 1 (defaults)", "Round 2 (nested CV)"
    allr = pd.concat([r1, r2]).sort_values("roc_auc_mean")
    allr = allr[allr.roc_auc_mean > 0.8]  # drops the two broken/weak baselines from the scale; listed in CSV
    colors = {"Regression": "#2a6f97", "Tree-based": "#2d6a4f", "Neural net": "#b5651d", "Ensemble": "#7b2d8e"}
    fig, ax = plt.subplots(1, 2, figsize=(15, 8))
    ax[0].barh([f"{m}" for m in allr.model + " · R" + allr["round"].str[6]], allr.roc_auc_mean, xerr=allr.roc_auc_std,
               color=[colors[f] for f in allr.family], alpha=.85, capsize=2)
    ax[0].set_xlim(0.92, 0.98)
    ax[0].set_xlabel("ROC AUC (CV mean ± std across folds)")
    ax[0].set_title("Cross-validated ROC AUC, all models")
    ax[0].legend(handles=[plt.Rectangle((0, 0), 1, 1, color=c) for c in colors.values()], labels=colors.keys(),
                 loc="lower right")
    for name, (fpr, tpr, _) in curves.items():
        a = res.loc[res.model == name, "holdout_auc"].iloc[0]
        ax[1].plot(fpr, tpr, lw=2.5 if name == FINALIST else 1.2, label=f"{name} ({a:.3f})")
    ax[1].plot([0, 1], [0, 1], "k:", lw=1)
    ax[1].set(xlabel="False positive rate", ylabel="True positive rate", title="Holdout ROC curves (n=109)")
    ax[1].legend(loc="lower right", fontsize=8)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "model_comparison.png", dpi=150)

    fig, ax = plt.subplots(figsize=(7, 5))
    top = imp_df.head(10).iloc[::-1]
    ax.barh(top.feature, top.auc_drop, xerr=top["std"], color="#2a6f97")
    ax.set_xlabel("Holdout AUC drop when shuffled")
    ax.set_title("Permutation importance (finalist)")
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "permutation_importance.png", dpi=150)


if __name__ == "__main__":
    main()
