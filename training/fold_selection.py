"""Statistical feature shortlisting (t-test/MWU + chi-square, Bonferroni) as a sklearn step.

Fitted on the TRAINING fold only, so the shortlist never sees validation/holdout rows. Mirrors
model/ttest_pcos.py and model/chi2_pcos.py (same alpha and rules) but is applied per fold.
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "model"))
from ttest_pcos import CAT_COLS, TARGET, load_data  # noqa: E402


def load_full():
    """All candidate features (before any shortlisting), same row order as the exported CSV."""
    df = load_data()
    cats = [c for c in CAT_COLS if c != TARGET and c in df.columns]
    nums = [c for c in df.select_dtypes("number").columns if c not in CAT_COLS]
    X = df[nums + cats].copy()
    X[cats] = X[cats].astype(float)
    return X, df[TARGET].astype(int), nums, cats


class FoldShortlist(BaseEstimator, TransformerMixin):
    def __init__(self, cat_cols=(), alpha=0.05):
        self.cat_cols = cat_cols
        self.alpha = alpha

    def fit(self, X, y):
        X, y = pd.DataFrame(X), np.asarray(y)
        cats = [c for c in self.cat_cols if c in X.columns]
        nums = [c for c in X.columns if c not in cats]
        keep = []
        for c in nums:
            a, b = X.loc[y == 1, c].dropna(), X.loc[y == 0, c].dropna()
            p_t = np.nan_to_num(stats.ttest_ind(a, b, equal_var=True).pvalue, nan=1.0)
            p_u = np.nan_to_num(stats.mannwhitneyu(a, b, alternative="two-sided").pvalue, nan=1.0)
            if min(p_t, p_u) * len(nums) < self.alpha:  # Bonferroni, either test (same rule as the shortlist)
                keep.append(c)
        for c in cats:
            table = pd.crosstab(X[c].dropna(), pd.Series(y, index=X.index)[X[c].notna()])
            if table.shape[0] < 2 or table.shape[1] < 2:
                continue
            p = stats.chi2_contingency(table, correction=True)[1]
            if p * len(cats) < self.alpha:
                keep.append(c)
        self.selected_ = keep
        return self

    def transform(self, X):
        return pd.DataFrame(X)[self.selected_]

    def set_output(self, *, transform=None):  # keep DataFrame in/out
        return self


def dynamic_preprocessor(cat_cols):
    """Column roles are decided at fit time from whatever the shortlist kept."""
    cats = set(cat_cols)
    num = lambda X: [c for c in X.columns if c not in cats]  # noqa: E731
    multi = lambda X: [c for c in X.columns if c in cats and X[c].nunique() > 2]  # noqa: E731
    binary = lambda X: [c for c in X.columns if c in cats and X[c].nunique() <= 2]  # noqa: E731
    return ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("sc", StandardScaler())]), num),
        ("multi", Pipeline([("imp", SimpleImputer(strategy="most_frequent")),
                            ("oh", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), multi),
        ("bin", SimpleImputer(strategy="most_frequent"), binary),
    ])


def infold_pipeline(estimator, cat_cols):
    return Pipeline([("sel", FoldShortlist(cat_cols=tuple(cat_cols))), ("pre", dynamic_preprocessor(cat_cols)),
                     ("model", estimator)])
