from pathlib import Path

import pandas as pd
from scipy import stats

ALPHA = 0.05
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "dataset" / "PCOS_data_without_infertility.xlsx"
TARGET = "PCOS (Y/N)"

# Same categorical columns as model/psoc.py; everything else numeric is tested
CAT_COLS = [
    "PCOS (Y/N)", "Cycle(R/I)", "Blood Group", "Pregnant(Y/N)", "Weight gain(Y/N)", "hair growth(Y/N)",
    "Skin darkening (Y/N)", "Hair loss(Y/N)", "Pimples(Y/N)", "Fast food (Y/N)", "Reg.Exercise(Y/N)",
]


def load_data():
    df = pd.read_excel(DATA_PATH, sheet_name="Full_new").dropna(how="all")
    df.columns = df.columns.str.strip()
    df = df.drop(columns=[c for c in ["Unnamed: 44", "Sl. No", "Patient File No."] if c in df.columns])
    df['BMI'] = df['Weight (Kg)']/((df['Height(Cm)']/100)**2)
    df['FSH/LH'] = df['FSH(mIU/mL)']/df['LH(mIU/mL)']
    df['Waist:Hip Ratio'] = df['Waist(inch)']/df['Hip(inch)']

    # Same coercion as model/psoc.py: these columns contain stray text, so non-numeric becomes NaN
    for col in ["II    beta-HCG(mIU/mL)", "AMH(ng/mL)"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    for i in CAT_COLS:
        if i in df.columns:
            df[i] = df[i].astype("category")
    
    return df


def ttest_pcos_vs_non_pcos(df):
    pcos = df[df[TARGET] == 1]
    non_pcos = df[df[TARGET] == 0]
    numeric_cols = [c for c in df.select_dtypes("number").columns if c not in CAT_COLS]

    rows = []
    for col in numeric_cols:
        a = pcos[col].dropna()
        b = non_pcos[col].dropna()
        t_stat, p_value = stats.ttest_ind(a, b, equal_var=True)
        # Rank-based robustness check: not affected by outliers or non-normality
        u_stat, u_p_value = stats.mannwhitneyu(a, b, alternative="two-sided")
        rows.append({
            "feature": col,
            "n_pcos": len(a),
            "n_non_pcos": len(b),
            "mean_pcos": a.mean(),
            "mean_non_pcos": b.mean(),
            "median_pcos": a.median(),
            "median_non_pcos": b.median(),
            "t_statistic": t_stat,
            "p_value": p_value,
            "u_statistic": u_stat,
            "u_p_value": u_p_value,
        })

    results = pd.DataFrame(rows)
    results["p_bonferroni"] = (results["p_value"] * len(results)).clip(upper=1.0)
    results["u_p_bonferroni"] = (results["u_p_value"] * len(results)).clip(upper=1.0)
    results["significant_0.05"] = results["p_value"] < ALPHA
    results["u_significant_0.05"] = results["u_p_value"] < ALPHA
    return results.sort_values("p_value").reset_index(drop=True)


def significant_numeric_results(results):
    # Relevant numeric features: Bonferroni-significant in either the t-test or Mann-Whitney U, strongest first
    mask = (results["p_bonferroni"] < ALPHA) | (results["u_p_bonferroni"] < ALPHA)
    return results[mask].sort_values("u_p_value").reset_index(drop=True)


def relevant_numeric_features(results) -> list[str]:
    return significant_numeric_results(results)["feature"].tolist()


def sig_mark(p_value, p_bonferroni):
    return "**" if p_bonferroni < ALPHA else ("*" if p_value < ALPHA else "")


def print_grid(headers, rows, left):
    widths = [max(len(h), *(len(row[i]) for row in rows)) for i, h in enumerate(headers)]

    def fmt(cells):
        return "| " + " | ".join(
            c.ljust(w) if i in left else c.rjust(w) for i, (c, w) in enumerate(zip(cells, widths))
        ) + " |"

    sep = "+-" + "-+-".join("-" * w for w in widths) + "-+"
    print(sep)
    print(fmt(headers))
    print(sep)
    for row in rows:
        print(fmt(row))
    print(sep)


def print_table(results):
    headers = [
        "Feature", "n (P/N)", "Mean P", "Mean N", "Median P", "Median N",
        "t", "t p", "t p (Bonf.)", "U p", "U p (Bonf.)", "t-test", "MWU",
    ]
    rows = [
        [
            r.feature,
            f"{r.n_pcos}/{r.n_non_pcos}",
            f"{r.mean_pcos:.3f}",
            f"{r.mean_non_pcos:.3f}",
            f"{r.median_pcos:.3f}",
            f"{r.median_non_pcos:.3f}",
            f"{r.t_statistic:.3f}",
            f"{r.p_value:.2e}",
            f"{r.p_bonferroni:.2e}",
            f"{r.u_p_value:.2e}",
            f"{r.u_p_bonferroni:.2e}",
            sig_mark(r.p_value, r.p_bonferroni),
            sig_mark(r.u_p_value, r.u_p_bonferroni),
        ]
        for r in results.itertuples()
    ]
    # Feature name and the two Sig columns are left-aligned, numeric columns right-aligned
    print_grid(headers, rows, left={0, len(headers) - 2, len(headers) - 1})
    print(f"Sig: * p < {ALPHA} (uncorrected), ** p < {ALPHA} after Bonferroni correction")


def main():
    df = load_data()
    results = ttest_pcos_vs_non_pcos(df)

    print_table(results)

    t_bonf = results["p_bonferroni"] < ALPHA
    u_bonf = results["u_p_bonferroni"] < ALPHA
    print(f"\nFeatures tested: {len(results)}")
    print(f"{'':32}{'t-test':>8}{'MWU':>6}")
    print(f"{f'Significant at p < {ALPHA} (uncorrected)':32}"
          f"{results['significant_0.05'].sum():>8}{results['u_significant_0.05'].sum():>6}")
    print(f"{f'Significant at p < {ALPHA} (Bonferroni)':32}{t_bonf.sum():>8}{u_bonf.sum():>6}")

    # Features where the two tests disagree on Bonferroni-corrected significance
    disagree = results[t_bonf != u_bonf]
    if disagree.empty:
        print("\nBoth tests agree on every Bonferroni-corrected result.")
    else:
        print("\nDisagreement after Bonferroni correction:")
        for r in disagree.itertuples():
            winner = "t-test only" if r.p_bonferroni < ALPHA else "MWU only"
            print(f"  {r.feature}: significant in {winner}")


if __name__ == "__main__":
    main()
