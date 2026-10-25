"""Export the preprocessed dataset restricted to the shortlisted features.

Reuses model/ttest_pcos.py (cleaning + engineered features) and the t-test / chi-square
shortlisting, so the feature list always matches the statistical analysis.
Missing values are left as NaN on purpose: imputation and scaling are fitted inside each
cross-validation fold (see train_models.py) to avoid leaking test-fold statistics.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "model"))

from chi2_pcos import chi2_vs_pcos, relevant_categorical_features  # noqa: E402
from ttest_pcos import TARGET, load_data, relevant_numeric_features, ttest_pcos_vs_non_pcos  # noqa: E402

OUT_DIR = Path(__file__).resolve().parent / "preprocessed_data"


def main():
    df = load_data()
    numeric = relevant_numeric_features(ttest_pcos_vs_non_pcos(df))
    categorical = relevant_categorical_features(chi2_vs_pcos(df))

    out = df[numeric + categorical + [TARGET]].copy()
    # Categoricals arrive as pandas 'category'; store as plain numbers
    for col in categorical + [TARGET]:
        out[col] = out[col].astype(float)

    OUT_DIR.mkdir(exist_ok=True)
    out.to_csv(OUT_DIR / "pcos_preprocessed.csv", index=False)
    (OUT_DIR / "features.json").write_text(
        json.dumps({"target": TARGET, "numeric": numeric, "categorical": categorical}, indent=2)
    )

    print(f"Rows: {len(out)}  Numeric: {len(numeric)}  Categorical: {len(categorical)}")
    print(f"Target balance:\n{out[TARGET].value_counts()}")
    print(f"Missing values per column:\n{out.isna().sum()[out.isna().sum() > 0]}")
    for col in categorical:
        print(f"{col}: {sorted(out[col].dropna().unique())}")


if __name__ == "__main__":
    main()
