from src.ranking.pipeline import ProblemConfig

from ._base import _build_module_api

CONFIG = ProblemConfig(
    problem_id=9,
    name="Industry support for middle-class household formation",
    entity_type="industry",
    value_col="wage_per_fte",
    feature_specs=[
        ("wage_level", "level"),
        ("wage_growth_3y", "cagr_3"),
        ("wage_stability", "vol_5"),
        ("housing_headwind", "rent_price_index_yoy"),
        ("health_headwind", "health_price_index_yoy"),
        ("education_headwind", "education_price_index_yoy"),
    ],
    weights={
        "wage_level": 0.30,
        "wage_growth_3y": 0.20,
        "wage_stability": 0.20,
        "housing_headwind": 0.15,
        "health_headwind": 0.10,
        "education_headwind": 0.05,
    },
    invert_features={"wage_stability", "housing_headwind", "health_headwind", "education_headwind"},
    target_label="future_household_formation_support_score",
    note="Industry ranking combining wage capacity with shared national affordability headwinds.",
    include_macro=True,
)

load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results = _build_module_api(CONFIG)
