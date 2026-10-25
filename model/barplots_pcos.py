import math
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from chi2_pcos import chi2_vs_pcos, significant_categorical_results
from ttest_pcos import PROJECT_ROOT, TARGET, load_data

OUTPUT_PATH = PROJECT_ROOT / "output" / "barplots_pcos.png"
CLASS_LABELS = {0: "Non-PCOS", 1: "PCOS"}
PALETTE = {"Non-PCOS": "#4C78A8", "PCOS": "#E45756"}
N_COLS = 3
BAR_WIDTH = 0.38


def level_labels(col, levels):
    # Y/N columns are coded 0/1; other columns (Cycle(R/I)) keep their raw codes
    if "(Y/N)" in col and set(levels) <= {0, 1}:
        return ["No" if lvl == 0 else "Yes" for lvl in levels]
    return [str(int(lvl)) for lvl in levels]


def plot_barplots(df, features, output_path: Path):
    n_rows = math.ceil(len(features) / N_COLS)
    fig, axes = plt.subplots(n_rows, N_COLS, figsize=(5 * N_COLS, 4.4 * n_rows), squeeze=False)
    axes_flat = axes.ravel()

    for ax, row in zip(axes_flat, features.itertuples()):
        subset = df[[row.feature, TARGET]].dropna()
        counts = pd.crosstab(subset[row.feature], subset[TARGET])
        # Share of each class at each level, so unequal class sizes don't distort the comparison
        percents = counts / counts.sum(axis=0) * 100
        levels = list(counts.index)
        positions = range(len(levels))

        for offset, (code, label) in zip((-BAR_WIDTH / 2, BAR_WIDTH / 2), CLASS_LABELS.items()):
            xs = [p + offset for p in positions]
            bars = ax.bar(xs, percents[code], width=BAR_WIDTH, color=PALETTE[label], label=label)
            for bar, pct, n in zip(bars, percents[code], counts[code]):
                ax.annotate(
                    f"{pct:.0f}%\n(n={n})", (bar.get_x() + bar.get_width() / 2, bar.get_height()),
                    ha="center", va="bottom", fontsize=8, xytext=(0, 2), textcoords="offset points",
                )

        ax.set_xticks(list(positions))
        ax.set_xticklabels(level_labels(row.feature, levels))
        ax.set_ylim(0, 115)
        ax.set_ylabel("% of class")
        ax.set_title(f"{row.feature}\nBonf. p = {row.p_bonferroni:.1e}, Cramér's V = {row.cramers_v:.2f}", fontsize=10)
        ax.spines[["top", "right"]].set_visible(False)

    for ax in axes_flat[len(features):]:
        ax.set_visible(False)

    handles, labels = axes_flat[0].get_legend_handles_labels()
    fig.legend(handles, labels, loc="lower right", bbox_to_anchor=(0.97, 0.06), fontsize=11, frameon=False)
    fig.suptitle("Significant categorical features by PCOS class", fontsize=13, fontweight="bold")
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150)
    return fig


def main():
    df = load_data()
    features = significant_categorical_results(chi2_vs_pcos(df))

    print(f"Plotting {len(features)} categorical features significant after Bonferroni correction:")
    for name in features["feature"]:
        print(f"  - {name}")

    plot_barplots(df, features, OUTPUT_PATH)
    print(f"\nSaved: {OUTPUT_PATH}")
    plt.show()


if __name__ == "__main__":
    main()
