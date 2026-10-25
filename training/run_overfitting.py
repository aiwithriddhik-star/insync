"""Overfitting analysis: train/validation gap, learning curves, validation curves, label-permutation
test, and feature shortlisting redone inside every CV fold (leakage check)."""
import warnings
from collections import Counter

import matplotlib
import numpy as np
import pandas as pd
from sklearn.ensemble import (ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier,
                              VotingClassifier)
from sklearn.linear_model import LogisticRegression, LogisticRegressionCV, RidgeCV
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import (RepeatedStratifiedKFold, StratifiedKFold, learning_curve,
                                     permutation_test_score, train_test_split, validation_curve)
from sklearn.neural_network import MLPClassifier
from sklearn.tree import DecisionTreeClassifier
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier

from common import (CYCLE, RESULTS_DIR, SEED, cross_validate_model, load_xy, make_pipeline, score_of,
                    train_holdout_split)
from fold_selection import FoldShortlist, infold_pipeline, load_full
from models import CS
from torch_mlp import TorchMLPClassifier

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

warnings.filterwarnings("ignore")
cv5 = StratifiedKFold(5, shuffle=True, random_state=SEED)


def rf(**kw):
    return RandomForestClassifier(n_estimators=400, class_weight="balanced", random_state=SEED, n_jobs=1, **kw)


def lrcv():
    return LogisticRegressionCV(Cs=CS, cv=5, scoring="roc_auc", max_iter=5000, class_weight="balanced",
                                random_state=SEED)


def main():
    X, y, meta = load_xy()
    Xtr, Xte, ytr, yte = train_holdout_split(X, y)

    # ---- A. train vs validation AUC gap ------------------------------------------------------
    zoo = {
        "Decision tree (unpruned)": (DecisionTreeClassifier(random_state=SEED), -1),
        "Decision tree (depth 4)": (DecisionTreeClassifier(max_depth=4, random_state=SEED), -1),
        "Random forest (min_leaf 1)": (rf(min_samples_leaf=1), -1),
        "Random forest (min_leaf 4)": (rf(min_samples_leaf=4), -1),
        "Extra trees (min_leaf 2)": (ExtraTreesClassifier(n_estimators=400, min_samples_leaf=2,
                                                          random_state=SEED, n_jobs=1), -1),
        "Gradient boosting": (GradientBoostingClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,
                                                         subsample=0.8, random_state=SEED), -1),
        "XGBoost": (XGBClassifier(n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.8,
                                  scale_pos_weight=2.05, tree_method="hist", n_jobs=1, random_state=SEED,
                                  verbosity=0), -1),
        "LightGBM": (LGBMClassifier(n_estimators=300, num_leaves=8, learning_rate=0.05, subsample=0.8,
                                    subsample_freq=1, class_weight="balanced", n_jobs=1, random_state=SEED,
                                    verbose=-1), -1),
        "Logistic L2": (lrcv(), -1),
        "Ridge regression": (RidgeCV(alphas=[0.01, 0.1, 1, 10, 100, 1000]), -1),
        "MLP sklearn lbfgs": (MLPClassifier((32,), alpha=1.0, solver="lbfgs", max_iter=2000, random_state=SEED), -1),
        "MLP torch (32-16) [MPS]": (TorchMLPClassifier(hidden=(32, 16), random_state=SEED), 1),
        "Ensemble RF+Logistic": (VotingClassifier([("rf", rf(min_samples_leaf=2)), ("lr", lrcv())],
                                                  voting="soft"), -1),
    }
    rows = []
    for name, (est, nj) in zoo.items():
        r = cross_validate_model(name, "", make_pipeline(est, meta), Xtr, ytr, n_jobs=nj)
        rows.append(r)
        print(f"A  {name:28} train {r['train_auc']:.4f}  val {r['roc_auc_mean']:.4f}  gap {r['auc_gap']:+.4f}", flush=True)
    gap = pd.DataFrame(rows).sort_values("auc_gap", ascending=False)[
        ["model", "train_auc", "roc_auc_mean", "roc_auc_std", "auc_gap"]]
    gap.to_csv(RESULTS_DIR / "overfit_train_val_gap.csv", index=False)

    # ---- B. learning curves --------------------------------------------------------------------
    sizes = np.linspace(0.2, 1.0, 6)
    lc = {}
    for name, est in {"Ensemble RF+Logistic": VotingClassifier([("rf", rf(min_samples_leaf=2)), ("lr", lrcv())],
                                                               voting="soft"),
                      "Random forest": rf(min_samples_leaf=2), "Logistic L2": lrcv()}.items():
        n, tr, va = learning_curve(make_pipeline(est, meta), Xtr, ytr, train_sizes=sizes, cv=cv5,
                                   scoring="roc_auc", n_jobs=-1, shuffle=True, random_state=SEED)
        lc[name] = (n, tr.mean(1), tr.std(1), va.mean(1), va.std(1))
        print(f"B  {name:22} val AUC at n={n[0]}: {va.mean(1)[0]:.4f} -> n={n[-1]}: {va.mean(1)[-1]:.4f}")
    pd.DataFrame([{"model": k, "n_train": int(n), "train_auc": a, "val_auc": c}
                  for k, (ns, ta, _, vc, _) in lc.items() for n, a, c in zip(ns, ta, vc)]
                 ).to_csv(RESULTS_DIR / "overfit_learning_curves.csv", index=False)

    # ---- C. validation curves (model capacity) -------------------------------------------------
    leaf = [1, 2, 4, 8, 16, 32]
    t1, v1 = validation_curve(make_pipeline(rf(), meta), Xtr, ytr, param_name="model__min_samples_leaf",
                              param_range=leaf, cv=cv5, scoring="roc_auc", n_jobs=-1)
    trees = [10, 25, 50, 100, 200, 400]
    xgb = XGBClassifier(max_depth=3, learning_rate=0.05, subsample=0.8, scale_pos_weight=2.05, tree_method="hist",
                        n_jobs=1, random_state=SEED, verbosity=0)
    t2, v2 = validation_curve(make_pipeline(xgb, meta), Xtr, ytr, param_name="model__n_estimators",
                              param_range=[20, 50, 100, 200, 400, 800], cv=cv5, scoring="roc_auc", n_jobs=-1)
    print("C  RF min_samples_leaf  train/val:", [f"{l}:{a:.3f}/{b:.3f}" for l, a, b in
                                                 zip(leaf, t1.mean(1), v1.mean(1))])
    print("C  XGB n_estimators     train/val:", [f"{l}:{a:.3f}/{b:.3f}" for l, a, b in
                                                 zip([20, 50, 100, 200, 400, 800], t2.mean(1), v2.mean(1))])

    # ---- D. label-permutation test (is the score real, or an artefact of the pipeline?) ----------
    perm = {}
    for name, est, n_perm in [("Logistic L2", lrcv(), 100), ("Random forest", rf(min_samples_leaf=2), 40)]:
        sc, null, p = permutation_test_score(make_pipeline(est, meta), Xtr, ytr, scoring="roc_auc", cv=cv5,
                                             n_permutations=n_perm, n_jobs=-1, random_state=SEED)
        perm[name] = (sc, null, p)
        print(f"D  {name:14} real AUC {sc:.4f} | shuffled-label AUC {null.mean():.3f} ± {null.std():.3f} "
              f"(max {null.max():.3f}) | p = {p:.4f}")

    # ---- E. feature shortlist inside each fold (removes selection leakage) ------------------------
    Xf, yf, nums, cats = load_full()
    Xf_tr, Xf_te = Xf.loc[Xtr.index], Xf.loc[Xte.index]
    assert (yf.loc[Xtr.index].values == ytr.values).all()
    print(f"\nE  candidate features before shortlisting: {Xf.shape[1]} ({len(nums)} numeric, {len(cats)} categorical)")
    cvr = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=SEED)
    counts, sizes_sel = Counter(), []
    for tr, _ in cvr.split(Xf_tr, ytr):
        sel = FoldShortlist(cat_cols=tuple(cats)).fit(Xf_tr.iloc[tr], ytr.iloc[tr]).selected_
        counts.update(sel); sizes_sel.append(len(sel))
    stab = pd.DataFrame(counts.most_common(), columns=["feature", "folds_selected_of_15"])
    stab["in_original_shortlist"] = stab.feature.isin(meta["numeric"] + meta["categorical"])
    stab.to_csv(RESULTS_DIR / "overfit_feature_stability.csv", index=False)
    print(f"E  features kept per fold: {min(sizes_sel)}–{max(sizes_sel)} (original shortlist: {len(meta['numeric'])+len(meta['categorical'])})")
    print(stab.to_string(index=False))

    e_rows = []
    for label, est in [("Logistic L2", lrcv()), ("Random forest", rf(min_samples_leaf=2)),
                       ("Ensemble RF+Logistic", VotingClassifier([("rf", rf(min_samples_leaf=2)), ("lr", lrcv())],
                                                                 voting="soft"))]:
        r_full = cross_validate_model(label, "", make_pipeline(est, meta), Xtr, ytr)
        r_in = cross_validate_model(label, "", infold_pipeline(est, cats), Xf_tr, ytr)
        ho_full = roc_auc_score(yte, score_of(make_pipeline(est, meta).fit(Xtr, ytr), Xte))
        ho_in = roc_auc_score(yte, score_of(infold_pipeline(est, cats).fit(Xf_tr, ytr), Xf_te))
        e_rows.append({"model": label, "cv_auc_full_data_shortlist": r_full["roc_auc_mean"],
                       "cv_auc_infold_shortlist": r_in["roc_auc_mean"], "cv_std_infold": r_in["roc_auc_std"],
                       "holdout_full_data_shortlist": ho_full, "holdout_infold_shortlist": ho_in})
    e = pd.DataFrame(e_rows)
    e.to_csv(RESULTS_DIR / "overfit_infold_selection.csv", index=False)
    print("\nE  Shortlist on all rows vs inside folds:\n" + e.round(4).to_string(index=False))

    # ---- plots -----------------------------------------------------------------------------------
    fig, ax = plt.subplots(2, 2, figsize=(15, 11))
    g = gap.iloc[::-1]
    ax[0, 0].barh(g.model, g.auc_gap, color=["#c0392b" if v > 0.04 else "#2a6f97" for v in g.auc_gap])
    ax[0, 0].set(title="A. Train AUC − validation AUC (bigger = more overfit)", xlabel="AUC gap")
    for name, (n, ta, ts, vm, vs) in lc.items():
        l, = ax[0, 1].plot(n, vm, "o-", label=f"{name} val")
        ax[0, 1].plot(n, ta, "--", color=l.get_color(), alpha=.6, label=f"{name} train")
        ax[0, 1].fill_between(n, vm - vs, vm + vs, color=l.get_color(), alpha=.12)
    ax[0, 1].set(title="B. Learning curves", xlabel="training rows", ylabel="ROC AUC", ylim=(0.9, 1.01))
    ax[0, 1].legend(fontsize=7)
    ax[1, 0].plot(leaf, t1.mean(1), "o--", label="RF train"); ax[1, 0].plot(leaf, v1.mean(1), "o-", label="RF val")
    ax[1, 0].set(title="C. Random forest: min_samples_leaf (capacity ↓ →)", xscale="log", xlabel="min_samples_leaf",
                 ylabel="ROC AUC"); ax[1, 0].legend()
    for name, (sc, null, p) in perm.items():
        ax[1, 1].hist(null, bins=15, alpha=.6, label=f"{name} shuffled labels")
        ax[1, 1].axvline(sc, color="k", ls="--")
    ax[1, 1].set(title="D. Label-permutation test (dashed = real AUC)", xlabel="CV ROC AUC"); ax[1, 1].legend()
    plt.tight_layout(); plt.savefig(RESULTS_DIR / "overfitting_analysis.png", dpi=140)


if __name__ == "__main__":
    main()
