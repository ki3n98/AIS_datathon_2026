from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.pipeline import Pipeline

from .data import load_industry_wage_panel, load_macro_headwinds, load_state_income_panel
from .evaluation import evaluate_predictions, ranking_frame, time_aware_split, top_k_overlap
from .features import add_growth_features, add_stability_features, build_weighted_score, normalize_cross_section
from .plotting import plot_top_bottom


RANDOM_SEED = 42


@dataclass(frozen=True)
class ProblemConfig:
    problem_id: int
    name: str
    entity_type: str
    value_col: str
    feature_specs: list[tuple[str, str]]
    weights: dict[str, float]
    invert_features: set[str]
    target_label: str
    note: str
    include_macro: bool = False
    include_profit: bool = False


def _get_base_panel(entity_type: str) -> pd.DataFrame:
    if entity_type == "state":
        return load_state_income_panel()
    if entity_type == "industry":
        return load_industry_wage_panel()
    raise ValueError(f"Unsupported entity type: {entity_type}")


def _feature_name(value_col: str, feature_key: str) -> str:
    mapping = {
        "level": value_col,
        "yoy": f"{value_col}_yoy",
        "cagr_3": f"{value_col}_cagr_3y",
        "cagr_5": f"{value_col}_cagr_5y",
        "cagr_10": f"{value_col}_cagr_10y",
        "vol_5": f"{value_col}_yoy_vol_5y",
        "trend_5": f"{value_col}_yoy_trend_5y",
        "trend_10": f"{value_col}_yoy_trend_5y",
        "accel_3": f"{value_col}_yoy_accel_3y",
        "drawdown_5": f"{value_col}_drawdown_5y",
        "recovery_5": f"{value_col}_recovery_ratio_5y",
        "downside_5": f"{value_col}_yoy_downside_years_5y",
        "positive_share_5": f"{value_col}_yoy_positive_share_5y",
    }
    return mapping[feature_key]


def _attach_macro_features(df: pd.DataFrame) -> pd.DataFrame:
    macro = load_macro_headwinds()
    return df.merge(macro, on="year", how="left")


def _build_features_for_config(config: ProblemConfig, horizon: int) -> pd.DataFrame:
    df = _get_base_panel(config.entity_type)
    df = add_growth_features(df, config.value_col)
    df = add_stability_features(df, config.value_col)
    if config.include_macro:
        df = _attach_macro_features(df)

    selected = {}
    for label, key in config.feature_specs:
        source = _feature_name(config.value_col, key) if key in {
            "level",
            "yoy",
            "cagr_3",
            "cagr_5",
            "cagr_10",
            "vol_5",
            "trend_5",
            "trend_10",
            "accel_3",
            "drawdown_5",
            "recovery_5",
            "downside_5",
            "positive_share_5",
        } else key
        selected[label] = df[source]

    feature_df = df[["entity", "year", "entity_type"]].copy()
    for label, values in selected.items():
        feature_df[label] = values

    if config.entity_type == "state":
        feature_df["region"] = df["region"]

    score_source = normalize_cross_section(
        feature_df,
        columns=list(config.weights.keys()),
        invert=config.invert_features,
    )
    feature_df["scorecard_score"] = build_weighted_score(score_source, config.weights)
    feature_df["target_score"] = feature_df.groupby("entity")["scorecard_score"].shift(-horizon)
    feature_df["naive_persistence"] = feature_df["scorecard_score"]
    return feature_df


def _candidate_models() -> dict[str, Pipeline]:
    return {
        "linear_regression": Pipeline(
            [("imputer", SimpleImputer(strategy="median")), ("model", LinearRegression())]
        ),
        "ridge": Pipeline(
            [("imputer", SimpleImputer(strategy="median")), ("model", Ridge(alpha=1.0))]
        ),
        "random_forest": Pipeline(
            [
                ("imputer", SimpleImputer(strategy="median")),
                ("model", RandomForestRegressor(n_estimators=300, random_state=RANDOM_SEED, min_samples_leaf=2)),
            ]
        ),
        "gradient_boosting": Pipeline(
            [("imputer", SimpleImputer(strategy="median")), ("model", GradientBoostingRegressor(random_state=RANDOM_SEED))]
        ),
    }


def _fit_best_model(train: pd.DataFrame, test: pd.DataFrame, feature_cols: list[str]) -> tuple[str, Pipeline, pd.DataFrame]:
    best_name = ""
    best_model = None
    best_mae = float("inf")
    scored_test = pd.DataFrame()
    for name, model in _candidate_models().items():
        model.fit(train[feature_cols], train["target_score"])
        preds = model.predict(test[feature_cols])
        candidate = test.copy()
        candidate["predicted_score"] = preds
        metrics = evaluate_predictions(candidate, "target_score", "predicted_score")
        if metrics["mae"] < best_mae:
            best_name = name
            best_model = model
            best_mae = metrics["mae"]
            scored_test = candidate
    if best_model is None:
        raise ValueError("No model could be fit.")
    return best_name, best_model, scored_test


def run_ranking_problem(config: ProblemConfig, horizon: int = 1) -> dict[str, object]:
    features = _build_features_for_config(config, horizon)
    feature_cols = list(config.weights.keys())
    usable = features.dropna(subset=["target_score"]).copy()
    train, test = time_aware_split(usable, horizon=horizon)
    model_name, best_model, scored_test = _fit_best_model(train, test, feature_cols)

    scored_test["naive_score"] = scored_test["naive_persistence"]
    predictive_metrics = evaluate_predictions(scored_test, "target_score", "predicted_score")
    naive_metrics = evaluate_predictions(scored_test, "target_score", "naive_score")

    latest_year = int(features["year"].max())
    latest = features[features["year"] == latest_year].copy()
    latest["predicted_future_score"] = best_model.predict(latest[feature_cols])
    latest_scorecard = ranking_frame(latest, "scorecard_score")
    latest_predictive = ranking_frame(latest, "predicted_future_score")

    overlap = top_k_overlap(
        latest_scorecard.set_index("entity")["scorecard_score"],
        latest_predictive.set_index("entity")["predicted_future_score"],
        k=min(10, len(latest)),
    )

    figure = plot_top_bottom(
        latest_predictive,
        "predicted_future_score",
        title=f"Problem {config.problem_id}: {config.name} ({horizon}-year forecast)",
        top_n=min(10, max(3, len(latest_predictive) // 4)),
    )

    return {
        "config": config,
        "horizon": horizon,
        "features": features,
        "train": train,
        "test_predictions": scored_test,
        "scorecard_ranking": latest_scorecard,
        "predictive_ranking": latest_predictive,
        "best_model_name": model_name,
        "predictive_metrics": predictive_metrics,
        "naive_metrics": naive_metrics,
        "top_k_overlap": overlap,
        "figure": figure,
        "latest_year": latest_year,
        "feature_columns": feature_cols,
    }
