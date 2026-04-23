from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=2,
    name="State long-run income momentum",
    entity_type="state",
    value_col="per_capita_income",
    feature_specs=[
        ("cagr_5y", "cagr_5"),
        ("cagr_10y", "cagr_10"),
        ("trend_slope", "trend_5"),
        ("recovery_speed", "recovery_5"),
        ("volatility_penalty", "vol_5"),
    ],
    weights={
        "cagr_5y": 0.25,
        "cagr_10y": 0.30,
        "trend_slope": 0.20,
        "recovery_speed": 0.15,
        "volatility_penalty": 0.10,
    },
    invert_features={"volatility_penalty"},
    target_label="future_income_momentum_score",
    note="Long-run income momentum using only state income history.",
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
