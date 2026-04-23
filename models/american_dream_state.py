from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=10,
    name="American Dream Score - state",
    entity_type="state",
    value_col="per_capita_income",
    feature_specs=[
        ("income_level", "level"),
        ("income_momentum", "cagr_5"),
        ("stability", "vol_5"),
        ("resilience", "recovery_5"),
    ],
    weights={
        "income_level": 0.35,
        "income_momentum": 0.30,
        "stability": 0.20,
        "resilience": 0.15,
    },
    invert_features={"stability"},
    target_label="future_american_dream_state_score",
    note="State-side American Dream composite built from income level, momentum, stability, and resilience.",
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
