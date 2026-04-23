from __future__ import annotations

import importlib
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.ranking.pipeline import run_ranking_problem

MODULES = [
    "models.state_income_momentum",
    "models.industry_wage_upside",
    "models.industry_wage_stability",
    "models.industry_household_formation",
    "models.american_dream_state",
    "models.american_dream_industry",
]


def main() -> None:
    summary = {}
    for module_name in MODULES:
        module = importlib.import_module(module_name)
        module_summary = {}
        for horizon in (1, 3):
            result = run_ranking_problem(module.CONFIG, horizon=horizon)
            scorecard = result["scorecard_ranking"]
            predictive = result["predictive_ranking"]
            assert not scorecard.empty, f"{module_name} scorecard empty"
            assert not predictive.empty, f"{module_name} predictive empty"
            assert predictive["rank"].is_monotonic_increasing, f"{module_name} ranks not sorted"
            assert predictive["year"].nunique() == 1, f"{module_name} latest year mismatch"
            module_summary[str(horizon)] = {
                "latest_year": int(result["latest_year"]),
                "entities": int(len(predictive)),
                "best_model_name": result["best_model_name"],
                "predictive_mae": result["predictive_metrics"]["mae"],
                "naive_mae": result["naive_metrics"]["mae"],
                "top_entity": str(predictive.iloc[0]["entity"]),
                "bottom_entity": str(predictive.iloc[-1]["entity"]),
            }
        summary[module_name] = module_summary

    output_path = ROOT / "outputs" / "ranking_smoke_summary.json"
    output_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
