from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=3,
    name="Industry wage upside",
    entity_type="industry",
    value_col="wage_per_fte",
    feature_specs=[
        ("current_wage", "level"),
        ("wage_growth_3y", "cagr_3"),
        ("wage_growth_5y", "cagr_5"),
        ("growth_acceleration", "accel_3"),
    ],
    weights={
        "current_wage": 0.35,
        "wage_growth_3y": 0.30,
        "wage_growth_5y": 0.20,
        "growth_acceleration": 0.15,
    },
    invert_features=set(),
    target_label="future_wage_upside_score",
    note="Wage-upside ranking from industry wage level, momentum, and acceleration.",
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
