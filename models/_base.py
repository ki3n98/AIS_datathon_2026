from __future__ import annotations

from src.ranking.pipeline import ProblemConfig, run_ranking_problem


def _build_module_api(config: ProblemConfig):
    def load_data():
        return run_ranking_problem(config, horizon=1)["features"]

    def build_features(horizon: int = 1):
        return run_ranking_problem(config, horizon=horizon)["features"]

    def build_scorecard(horizon: int = 1):
        return run_ranking_problem(config, horizon=horizon)["scorecard_ranking"]

    def build_predictive_model(horizon: int = 1):
        result = run_ranking_problem(config, horizon=horizon)
        return {
            "model_name": result["best_model_name"],
            "feature_columns": result["feature_columns"],
            "train_rows": len(result["train"]),
            "test_rows": len(result["test_predictions"]),
        }

    def evaluate(horizon: int = 1):
        result = run_ranking_problem(config, horizon=horizon)
        return {
            "predictive": result["predictive_metrics"],
            "naive": result["naive_metrics"],
            "top_k_overlap": result["top_k_overlap"],
            "best_model_name": result["best_model_name"],
        }

    def rank_entities(horizon: int = 1):
        result = run_ranking_problem(config, horizon=horizon)
        return {
            "scorecard": result["scorecard_ranking"],
            "predictive": result["predictive_ranking"],
            "latest_year": result["latest_year"],
        }

    def plot_results(horizon: int = 1):
        return run_ranking_problem(config, horizon=horizon)["figure"]

    return load_data, build_features, build_scorecard, build_predictive_model, evaluate, rank_entities, plot_results
