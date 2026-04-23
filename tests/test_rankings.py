from __future__ import annotations

import importlib
import os
import sys
import unittest
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

MODULES = [
    "models.state_income_momentum",
    "models.industry_wage_upside",
    "models.industry_wage_stability",
    "models.industry_household_formation",
    "models.american_dream_state",
    "models.american_dream_industry",
]


class RankingModuleTests(unittest.TestCase):
    def test_modules_expose_uniform_interface(self):
        required = {
            "load_data",
            "build_features",
            "build_scorecard",
            "build_predictive_model",
            "evaluate",
            "rank_entities",
            "plot_results",
        }
        for module_name in MODULES:
            module = importlib.import_module(module_name)
            self.assertTrue(required.issubset(set(dir(module))), module_name)

    def test_rankings_are_sorted_for_one_year_horizon(self):
        for module_name in MODULES:
            module = importlib.import_module(module_name)
            rankings = module.rank_entities(horizon=1)
            predictive = rankings["predictive"]
            self.assertGreater(len(predictive), 0, module_name)
            self.assertTrue(predictive["rank"].is_monotonic_increasing, module_name)
            self.assertEqual(int(predictive["rank"].iloc[0]), 1, module_name)
            self.assertEqual(predictive["year"].nunique(), 1, module_name)


if __name__ == "__main__":
    unittest.main()
