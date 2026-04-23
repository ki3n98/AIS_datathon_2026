from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=10,
    name="American Dream Score - industry",
    entity_type="industry",
    value_col="wage_per_fte",
    feature_specs=[
        ("wage_level", "level"),
        ("wage_upside", "cagr_3"),
        ("wage_stability", "vol_5"),
        ("affordability_headwind", "shared_affordability_headwind"),
    ],
    weights={
        "wage_level": 0.35,
        "wage_upside": 0.25,
        "wage_stability": 0.20,
        "affordability_headwind": 0.20,
    },
    invert_features={"wage_stability", "affordability_headwind"},
    target_label="future_american_dream_industry_score",
    note="Industry-side American Dream composite built from wages plus shared national affordability headwinds.",
    include_macro=True,
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
