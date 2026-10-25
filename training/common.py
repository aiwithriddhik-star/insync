"""Shared data loading, preprocessing and cross-validated evaluation for all model rounds."""
import json
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from joblib import Parallel, delayed
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (average_precision_score, balanced_accuracy_score, f1_score, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import RepeatedStratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

HERE = Path(__file__).resolve().parent
DATA_DIR = HERE / "preprocessed_data"
RESULTS_DIR = HERE / "results"
SEED = 42
CYCLE = "Cycle(R/I)"  # 3 codes (2/4/5), nominal -> one-hot


def load_xy():
    meta = json.loads((DATA_DIR / "features.json").read_text())
    df = pd.read_csv(DATA_DIR / "pcos_preprocessed.csv")
    X, y = df.drop(columns=[meta["target"]]), df[meta["target"]].astype(int)
    return X, y, meta


def train_holdout_split(X, y):
    """80/20 stratified split. The 20% holdout is only used once, for the final model."""
    return train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)


def make_preprocessor(meta, fixed_levels=False):
    binary = [c for c in meta["categorical"] if c != CYCLE]
    return ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), meta["numeric"]),
        ("cyc", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                          ("oh", OneHotEncoder(handle_unknown="ignore", sparse_output=False,
                                        categories=[[2.0, 4.0, 5.0]] if fixed_levels else "auto"))]), [CYCLE]),
        ("bin", SimpleImputer(strategy="most_frequent"), binary),
    ])


def make_pipeline(estimator, meta):
    return Pipeline([("pre", make_preprocessor(meta)), ("model", estimator)])


def score_of(est, X):
    """Probability of PCOS; regressors (OLS/Ridge/Lasso) just give a continuous score."""
    if hasattr(est, "predict_proba"):
        return est.predict_proba(X)[:, 1]
    return np.ravel(est.predict(X))


def _one_fold(pipe, X, y, tr, va):
    est = clone(pipe).fit(X.iloc[tr], y.iloc[tr])
    s = score_of(est, X.iloc[va])
    yv = y.iloc[va]
    pred = (s >= 0.5).astype(int)
    return {
        "train_auc": roc_auc_score(y.iloc[tr], score_of(est, X.iloc[tr])),
        "f1": f1_score(yv, pred, zero_division=0),
        "bal_acc": balanced_accuracy_score(yv, pred),
        "roc_auc": roc_auc_score(yv, s),
        "avg_precision": average_precision_score(yv, s),
        "precision": precision_score(yv, pred, zero_division=0),
        "recall": recall_score(yv, pred, zero_division=0),
    }


def cross_validate_model(name, family, pipe, X, y, n_splits=5, n_repeats=3, n_jobs=-1, return_folds=False):
    """Repeated stratified k-fold. Returns one summary row; ROC AUC is the headline metric."""
    cv = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=n_repeats, random_state=SEED)
    t0 = time.time()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        folds = Parallel(n_jobs=n_jobs)(
            delayed(_one_fold)(pipe, X, y, tr, va) for tr, va in cv.split(X, y)
        )
    f = pd.DataFrame(folds)
    row = {
        "model": name, "family": family,
        "train_auc": f.train_auc.mean(), "auc_gap": (f.train_auc - f.roc_auc).mean(),
        "f1": f.f1.mean(), "bal_acc": f.bal_acc.mean(),
        "roc_auc_mean": f.roc_auc.mean(), "roc_auc_std": f.roc_auc.std(),
        "avg_precision": f.avg_precision.mean(),
        "precision": f.precision.mean(), "recall": f.recall.mean(),
        "fit_seconds": time.time() - t0,
    }
    return (row, f) if return_folds else row
