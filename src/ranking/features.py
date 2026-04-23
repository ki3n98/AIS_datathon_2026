from __future__ import annotations

import numpy as np
import pandas as pd


def add_growth_features(df: pd.DataFrame, value_col: str, entity_col: str = "entity") -> pd.DataFrame:
    df = df.sort_values([entity_col, "year"]).copy()
    group = df.groupby(entity_col)[value_col]
    df[f"{value_col}_yoy"] = group.pct_change() * 100.0
    for window in (3, 5, 10):
        shifted = group.shift(window)
        df[f"{value_col}_cagr_{window}y"] = np.where(
            shifted.gt(0),
            ((group.transform(lambda s: s) / shifted) ** (1.0 / window) - 1.0) * 100.0,
            np.nan,
        )
    return df


def _slope(values: pd.Series) -> float:
    clean = values.dropna()
    if len(clean) < 2:
        return np.nan
    x = np.arange(len(clean))
    return float(np.polyfit(x, clean.to_numpy(), 1)[0])


def add_stability_features(
    df: pd.DataFrame,
    value_col: str,
    entity_col: str = "entity",
    growth_col: str | None = None,
    window: int = 5,
) -> pd.DataFrame:
    df = df.sort_values([entity_col, "year"]).copy()
    if growth_col is None:
        growth_col = f"{value_col}_yoy"

    grouped = df.groupby(entity_col, group_keys=False)
    df[f"{growth_col}_vol_{window}y"] = grouped[growth_col].transform(lambda s: s.rolling(window).std())
    df[f"{growth_col}_trend_{window}y"] = grouped[growth_col].transform(lambda s: s.rolling(window).apply(_slope))
    df[f"{growth_col}_accel_3y"] = grouped[growth_col].transform(lambda s: s.diff(3))
    df[f"{growth_col}_downside_years_{window}y"] = grouped[growth_col].transform(
        lambda s: s.lt(0).rolling(window).sum()
    )
    df[f"{growth_col}_positive_share_{window}y"] = grouped[growth_col].transform(
        lambda s: s.gt(0).rolling(window).mean()
    )
    df[f"{value_col}_rolling_max_{window}y"] = grouped[value_col].transform(lambda s: s.rolling(window).max())
    df[f"{value_col}_drawdown_{window}y"] = (
        df[value_col] / df[f"{value_col}_rolling_max_{window}y"] - 1.0
    ) * 100.0
    df[f"{value_col}_recovery_ratio_{window}y"] = (
        df[value_col] / df[f"{value_col}_rolling_max_{window}y"]
    ).clip(upper=1.0)
    return df


def normalize_cross_section(
    df: pd.DataFrame,
    columns: list[str],
    year_col: str = "year",
    invert: set[str] | None = None,
) -> pd.DataFrame:
    invert = invert or set()
    scored = df.copy()
    for column in columns:
        ranked = scored.groupby(year_col)[column].transform(
            lambda s: (s - s.min()) / (s.max() - s.min()) if s.notna().sum() > 1 and s.max() != s.min() else np.nan
        )
        if column in invert:
            ranked = 1.0 - ranked
        scored[f"norm__{column}"] = ranked
    return scored


def build_weighted_score(df: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    weighted_cols = []
    for feature, weight in weights.items():
        weighted_cols.append(df[f"norm__{feature}"] * weight)
    total_weight = sum(weights.values())
    return pd.concat(weighted_cols, axis=1).sum(axis=1) / total_weight
