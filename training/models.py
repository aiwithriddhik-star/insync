"""Model zoo for round 1: three families, sensible defaults, regularisation strength tuned inside each fold."""
from sklearn.ensemble import (AdaBoostClassifier, BaggingClassifier, ExtraTreesClassifier,
                              GradientBoostingClassifier, RandomForestClassifier)
from sklearn.linear_model import (ElasticNetCV, LassoCV, LinearRegression, LogisticRegression,
                                  LogisticRegressionCV, RidgeCV)
from sklearn.neural_network import MLPClassifier
from sklearn.tree import DecisionTreeClassifier
from lightgbm import LGBMClassifier
from xgboost import XGBClassifier

from torch_mlp import TorchMLPClassifier

SEED = 42
CS = [0.001, 0.01, 0.1, 1, 10, 100]
SPW = 2.05  # ~ negatives / positives, for boosted trees


def regression_models():
    cv_kw = dict(Cs=CS, cv=5, scoring="roc_auc", max_iter=5000, class_weight="balanced", random_state=SEED)
    return {
        # Classical linear regression on the 0/1 target (linear probability model), scored by ROC AUC
        "OLS linear regression": LinearRegression(),
        "Ridge regression": RidgeCV(alphas=[0.01, 0.1, 1, 10, 100, 1000]),
        "Lasso regression": LassoCV(cv=5, random_state=SEED, max_iter=20000),
        "ElasticNet regression": ElasticNetCV(l1_ratio=[0.2, 0.5, 0.8], cv=5, random_state=SEED, max_iter=20000),
        "Logistic (no penalty)": LogisticRegression(penalty=None, max_iter=5000, class_weight="balanced"),
        "Logistic (L2 / ridge)": LogisticRegressionCV(penalty="l2", solver="lbfgs", **cv_kw),
        "Logistic (L1 / lasso)": LogisticRegressionCV(penalty="l1", solver="saga", **cv_kw),
        "Logistic (ElasticNet)": LogisticRegressionCV(penalty="elasticnet", solver="saga", l1_ratios=[0.5], **cv_kw),
    }


def tree_models():
    return {
        "Decision tree": DecisionTreeClassifier(max_depth=4, class_weight="balanced", random_state=SEED),
        "Bagging (trees)": BaggingClassifier(n_estimators=300, random_state=SEED, n_jobs=1),
        "Random forest": RandomForestClassifier(n_estimators=500, min_samples_leaf=2, class_weight="balanced",
                                                random_state=SEED, n_jobs=1),
        "Extra trees": ExtraTreesClassifier(n_estimators=500, min_samples_leaf=2, class_weight="balanced",
                                            random_state=SEED, n_jobs=1),
        "AdaBoost": AdaBoostClassifier(n_estimators=200, learning_rate=0.5, random_state=SEED),
        "Gradient boosting": GradientBoostingClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,
                                                        subsample=0.8, random_state=SEED),
        "XGBoost": XGBClassifier(n_estimators=300, max_depth=3, learning_rate=0.05, subsample=0.8,
                                 colsample_bytree=0.8, scale_pos_weight=SPW, eval_metric="auc",
                                 tree_method="hist", n_jobs=1, random_state=SEED, verbosity=0),
        "LightGBM": LGBMClassifier(n_estimators=300, num_leaves=8, learning_rate=0.05, subsample=0.8,
                                   subsample_freq=1, colsample_bytree=0.8, class_weight="balanced",
                                   n_jobs=1, random_state=SEED, verbose=-1),
    }


def nn_models():
    # GPU (MPS) models are run sequentially, not in worker processes
    return {
        "MLP torch (32-16) [MPS GPU]": TorchMLPClassifier(hidden=(32, 16), dropout=0.2, random_state=SEED),
        "MLP torch (64-32) drop0.3 [MPS GPU]": TorchMLPClassifier(hidden=(64, 32), dropout=0.3,
                                                                  weight_decay=1e-2, random_state=SEED),
        "MLP torch (64-32-16) BN [MPS GPU]": TorchMLPClassifier(hidden=(64, 32, 16), dropout=0.2, batch_norm=True,
                                                                weight_decay=1e-2, random_state=SEED),
        "MLP sklearn (32-16) [CPU]": MLPClassifier(hidden_layer_sizes=(32, 16), alpha=1e-2, max_iter=1000,
                                                   early_stopping=True, random_state=SEED),
    }
