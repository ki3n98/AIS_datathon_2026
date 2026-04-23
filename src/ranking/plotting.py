from __future__ import annotations

import matplotlib.pyplot as plt
import pandas as pd


def plot_top_bottom(
    ranked: pd.DataFrame,
    score_col: str,
    title: str,
    top_n: int = 10,
) -> plt.Figure:
    subset = pd.concat([ranked.head(top_n), ranked.tail(top_n)]).copy()
    subset = subset.sort_values(score_col, ascending=True)
    fig, ax = plt.subplots(figsize=(10, 8))
    ax.barh(subset["entity"], subset[score_col], color=["#0f766e" if x >= 0 else "#b45309" for x in subset[score_col]])
    ax.set_title(title)
    ax.set_xlabel(score_col)
    ax.grid(axis="x", alpha=0.2)
    fig.tight_layout()
    plt.close(fig)
    return fig
