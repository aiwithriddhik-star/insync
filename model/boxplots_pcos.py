import math
from pathlib import Path

import matplotlib.pyplot as plt
import seaborn as sns

from ttest_pcos import PROJECT_ROOT, TARGET, load_data, significant_numeric_results, ttest_pcos_vs_non_pcos

OUTPUT_PATH = PROJECT_ROOT / "output" / "boxplots_pcos.png"
LABELS = {0: "Non-PCOS", 1: "PCOS"}
PALETTE = {"Non-PCOS": "#4C78A8", "PCOS": "#E45756"}
N_COLS = 3


def plot_boxplots(df, features, output_path: Path):
    data = df.copy()
    data["Class"] = data[TARGET].astype(int).map(LABELS)

    n_rows = math.ceil(len(features) / N_COLS)
    fig, axes = plt.subplots(n_rows, N_COLS, figsize=(5 * N_COLS, 4.2 * n_rows), squeeze=False)
    axes_flat = axes.ravel()

    for ax, row in zip(axes_flat, features.itertuples()):
        sns.boxplot(
            data=data, x="Class", y=row.feature, order=list(LABELS.values()),
            hue="Class", palette=PALETTE, legend=False,
            showmeans=True,
            meanprops={"marker": "D", "markerfacecolor": "white", "markeredgecolor": "black", "markersize": 6},
            flierprops={"marker": "o", "markersize": 3, "alpha": 0.5},
            ax=ax,
        )
        ax.set_title(f"{row.feature}\nMWU p (Bonf.) = {row.u_p_bonferroni:.1e}", fontsize=10)
        ax.set_xlabel("")
        ax.set_ylabel("")

    # Hide unused cells in the grid
    for ax in axes_flat[len(features):]:
        ax.set_visible(False)

    fig.suptitle("Significant features: PCOS vs non-PCOS (diamond = mean, line = median)", fontsize=13, fontweight="bold")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150)
    return fig


def main():
    df = load_data()
    results = ttest_pcos_vs_non_pcos(df)
    features = significant_numeric_results(results)

    print(f"Plotting {len(features)} features significant after Bonferroni correction (t-test or MWU):")
    for name in features["feature"]:
        print(f"  - {name}")

    plot_boxplots(df, features, OUTPUT_PATH)
    print(f"\nSaved: {OUTPUT_PATH}")
    plt.show()


if __name__ == "__main__":
    main()
