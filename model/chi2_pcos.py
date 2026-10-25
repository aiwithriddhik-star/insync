import numpy as np
import pandas as pd
from scipy import stats

from ttest_pcos import (
    ALPHA, CAT_COLS, TARGET, load_data, print_grid, relevant_numeric_features, ttest_pcos_vs_non_pcos,
)

# Expected counts below this make the chi-square approximation unreliable
MIN_EXPECTED = 5


def chi2_vs_pcos(df):
    cat_features = [c for c in CAT_COLS if c != TARGET and c in df.columns]

    rows = []
    for col in cat_features:
        # Fast food (Y/N) has missing values; drop them per column
        subset = df[[col, TARGET]].dropna()
        table = pd.crosstab(subset[col], subset[TARGET])

        chi2, p_value, dof, expected = stats.chi2_contingency(table, correction=False)
        # Yates' continuity correction only applies to 2x2 tables (dof == 1); otherwise scipy leaves it unchanged
        chi2_yates, p_yates, _, _ = stats.chi2_contingency(table, correction=True)
        n = table.to_numpy().sum()
        cramers_v = np.sqrt(chi2 / (n * (min(table.shape) - 1)))

        rows.append({
            "feature": col,
            "n": n,
            "levels": table.shape[0],
            "dof": dof,
            "chi2": chi2,
            "p_value": p_value,
            "chi2_yates": chi2_yates,
            "p_yates": p_yates,
            "cramers_v": cramers_v,
            "min_expected": expected.min(),
        })

    results = pd.DataFrame(rows)
    # Bonferroni across all categorical tests, applied to the continuity-corrected p-value
    results["p_bonferroni"] = (results["p_yates"] * len(results)).clip(upper=1.0)
    results["significant"] = results["p_bonferroni"] < ALPHA
    return results.sort_values("p_yates").reset_index(drop=True)


def significant_categorical_results(results):
    return results[results["significant"]].reset_index(drop=True)


def relevant_categorical_features(results) -> list[str]:
    return significant_categorical_results(results)["feature"].tolist()


def sig_mark(p_value, p_bonferroni):
    return "**" if p_bonferroni < ALPHA else ("*" if p_value < ALPHA else "")


def print_table(results):
    headers = [
        "Feature", "n", "Levels", "dof", "Chi2", "p", "Chi2 (Yates)", "p (Yates)",
        "p (Bonf.)", "Cramer's V", "Min exp.", "Sig",
    ]
    rows = [
        [
            r.feature,
            str(r.n),
            str(r.levels),
            str(r.dof),
            f"{r.chi2:.3f}",
            f"{r.p_value:.2e}",
            f"{r.chi2_yates:.3f}",
            f"{r.p_yates:.2e}",
            f"{r.p_bonferroni:.2e}",
            f"{r.cramers_v:.3f}",
            # '!' flags tables where the chi-square approximation is unreliable
            f"{r.min_expected:.1f}" + ("!" if r.min_expected < MIN_EXPECTED else ""),
            sig_mark(r.p_yates, r.p_bonferroni),
        ]
        for r in results.itertuples()
    ]
    print_grid(headers, rows, left={0, len(headers) - 1})
    print(f"Sig: * p (Yates) < {ALPHA} (uncorrected), ** p < {ALPHA} after Bonferroni correction")
    print(f"'!' = smallest expected cell count < {MIN_EXPECTED}; interpret with caution")
    print("Yates' continuity correction applies to 2x2 tables only; for larger tables (e.g. Blood Group) "
          "'Chi2 (Yates)' equals 'Chi2'")


def main():
    df = load_data()

    numeric_results = ttest_pcos_vs_non_pcos(df)
    numeric_features = relevant_numeric_features(numeric_results)

    cat_results = chi2_vs_pcos(df)
    cat_features = relevant_categorical_features(cat_results)

    print_table(cat_results)
    print(f"\nCategorical features tested: {len(cat_results)}")
    print(f"Significant (uncorrected, Yates): {(cat_results['p_yates'] < ALPHA).sum()}")
    print(f"Significant (Bonferroni):         {len(cat_features)}")

    print(f"\nRelevant numeric features ({len(numeric_features)}):")
    for name in numeric_features:
        print(f"  - {name}")
    print(f"\nRelevant categorical features ({len(cat_features)}):")
    for name in cat_features:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
