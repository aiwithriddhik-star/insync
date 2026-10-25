"""Class-imbalance study: weighting vs resampling, all done inside CV training folds only.

Strategies: none | class weights | random oversampling | SMOTENC | random undersampling | SMOTENC + undersampling.
Resampling never touches validation folds (imblearn Pipeline applies samplers at fit time only).
"""
import warnings

import matplotlib
import pandas as pd
from imblearn.over_sampling import RandomOverSampler, SMOTENC
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.under_sampling import RandomUnderSampler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier

from common import RESULTS_DIR, SEED, cross_validate_model, load_xy, make_preprocessor, train_holdout_split

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

warnings.filterwarnings("ignore")
NEG_POS = 2.05


def estimator(kind, weighted):
    if kind == "Logistic L2":
        return LogisticRegression(C=0.3, max_iter=5000, class_weight="balanced" if weighted else None)
    if kind == "Random forest":
        return RandomForestClassifier(n_estimators=400, min_samples_leaf=2, random_state=SEED, n_jobs=1,
                                      class_weight="balanced" if weighted else None)
    return XGBClassifier(n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8,
                         scale_pos_weight=NEG_POS if weighted else 1.0, tree_method="hist", n_jobs=1,
                         random_state=SEED, verbosity=0)


def main():
    X, y, meta = load_xy()
    Xtr, _, ytr, _ = train_holdout_split(X, y)
    n_num = len(meta["numeric"])
    cat_idx = list(range(n_num, n_num + 3 + len(meta["categorical"]) - 1))  # one-hot cycle(3) + binary cols
    smote = lambda: SMOTENC(categorical_features=cat_idx, random_state=SEED, k_neighbors=5)  # noqa: E731

    strategies = {
        "1 none (no weights)": (None, False),
        "2 class weights": (None, True),
        "3 random oversample": (RandomOverSampler(random_state=SEED), False),
        "4 SMOTENC": (smote(), False),
        "5 random undersample": (RandomUnderSampler(random_state=SEED), False),
        "6 SMOTENC + undersample": (None, False),  # built below (needs two steps)
    }
    rows = []
    for kind in ["Logistic L2", "Random forest", "XGBoost"]:
        for sname, (sampler, weighted) in strategies.items():
            steps = [("pre", make_preprocessor(meta, fixed_levels=True))]
            if sname.startswith("6"):
                steps += [("over", SMOTENC(categorical_features=cat_idx, sampling_strategy=0.7,
                                           random_state=SEED)),
                          ("under", RandomUnderSampler(sampling_strategy=0.9, random_state=SEED))]
            elif sampler is not None:
                steps.append(("sampler", sampler))
            pipe = ImbPipeline(steps + [("model", estimator(kind, weighted))])
            r = cross_validate_model(f"{kind} | {sname}", kind, pipe, Xtr, ytr)
            r.update(strategy=sname, kind=kind)
            rows.append(r)
            print(f"{kind:14} {sname:26} AUC {r['roc_auc_mean']:.4f}±{r['roc_auc_std']:.3f} AP {r['avg_precision']:.3f} "
                  f"P {r['precision']:.3f} R {r['recall']:.3f} F1 {r['f1']:.3f} BalAcc {r['bal_acc']:.3f}", flush=True)

    res = pd.DataFrame(rows)
    res.to_csv(RESULTS_DIR / "resampling_cv.csv", index=False)
    cols = ["roc_auc_mean", "avg_precision", "precision", "recall", "f1", "bal_acc"]
    print("\nMean over the 3 models, by strategy:")
    print(res.groupby("strategy")[cols].mean().round(4).to_string())

    fig, ax = plt.subplots(1, 2, figsize=(14, 5))
    for k, g in res.groupby("kind"):
        ax[0].plot(g.strategy.str[:1], g.roc_auc_mean, "o-", label=k)
        ax[1].plot(g.strategy.str[:1], g.recall, "o-", label=f"{k} recall")
        ax[1].plot(g.strategy.str[:1], g.precision, "s--", label=f"{k} precision")
    ax[0].set(title="ROC AUC by imbalance strategy", xlabel="strategy # (see legend in CSV)", ylabel="AUC")
    ax[1].set(title="Precision / recall @0.5 threshold", xlabel="strategy #")
    ax[0].legend(); ax[1].legend(fontsize=7)
    plt.tight_layout(); plt.savefig(RESULTS_DIR / "resampling_comparison.png", dpi=150)


if __name__ == "__main__":
    main()
