from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=4,
    name="Industry wage stability",
    entity_type="industry",
    value_col="wage_per_fte",
    feature_specs=[
        ("volatility", "vol_5"),
        ("max_drawdown", "drawdown_5"),
        ("downside_years", "downside_5"),
        ("recovery_speed", "recovery_5"),
    ],
    weights={
        "volatility": 0.35,
        "max_drawdown": 0.25,
        "downside_years": 0.20,
        "recovery_speed": 0.20,
    },
    invert_features={"volatility", "downside_years"},
    target_label="future_wage_stability_score",
    note="Inverse-instability score where lower volatility and shallower drawdowns rank higher.",
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
