from __future__ import annotations

import math

import numpy as np
import pandas as pd


def time_aware_split(df: pd.DataFrame, horizon: int, min_test_years: int = 5) -> tuple[pd.DataFrame, pd.DataFrame]:
    years = sorted(df["year"].dropna().unique().tolist())
    if len(years) < min_test_years + 5:
        raise ValueError("Not enough years for a time-aware split.")
    test_span = max(min_test_years, horizon + 2)
    cutoff = years[-test_span]
    train = df[df["year"] < cutoff].copy()
    test = df[df["year"] >= cutoff].copy()
    return train, test


def ranking_frame(df: pd.DataFrame, score_col: str, entity_col: str = "entity") -> pd.DataFrame:
    ranked = df.sort_values(score_col, ascending=False).reset_index(drop=True).copy()
    ranked["rank"] = np.arange(1, len(ranked) + 1)
    return ranked[[entity_col, "year", score_col, "rank"]]


def top_k_overlap(actual: pd.Series, predicted: pd.Series, k: int = 10) -> float:
    actual_top = set(actual.sort_values(ascending=False).head(k).index)
    predicted_top = set(predicted.sort_values(ascending=False).head(k).index)
    if not actual_top and not predicted_top:
        return math.nan
    return len(actual_top & predicted_top) / float(k)


def evaluate_predictions(df: pd.DataFrame, actual_col: str, pred_col: str) -> dict[str, float]:
    clean = df[[actual_col, pred_col]].dropna()
    if clean.empty:
        return {"mae": math.nan, "rmse": math.nan, "rank_corr": math.nan}
    diff = clean[actual_col] - clean[pred_col]
    rank_corr = clean[actual_col].rank().corr(clean[pred_col].rank(), method="spearman")
    return {
        "mae": float(diff.abs().mean()),
        "rmse": float(np.sqrt((diff**2).mean())),
        "rank_corr": float(rank_corr) if rank_corr is not None else math.nan,
    }
