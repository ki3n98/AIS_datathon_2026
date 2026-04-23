from __future__ import annotations

import json
from pathlib import Path


NOTEBOOK_PATH = Path("notebooks/ranking_models_analysis.ipynb")


def markdown_cell(text: str) -> dict:
    return {"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)}


def code_cell(text: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": text.splitlines(keepends=True),
    }


def build_notebook() -> dict:
    cells = [
        markdown_cell(
            "# Python Ranking Models + Analysis Notebook\n\n"
            "This notebook implements the active datathon ranking questions with two approaches:\n"
            "- weighted scorecards for transparent composites\n"
            "- predictive models that forecast future composite scores and then rank entities by predicted score\n\n"
            "Questions covered here: `2, 3, 4, 9, 10`.\n"
        ),
        markdown_cell(
            "## 1. Data and Modeling Setup\n\n"
            "This repo has enough cleaned data to build a first-pass Python ranking pipeline for state and industry rankings. "
            "The predictive models use only time-aware splits and forecast future scores rather than ranks directly."
        ),
        code_cell(
            "from __future__ import annotations\n\n"
            "import os\n"
            "import sys\n"
            "from pathlib import Path\n\n"
            "import pandas as pd\n"
            "from IPython.display import Markdown, display\n\n"
            "def find_repo_root(start: Path) -> Path:\n"
            "    for candidate in [start, *start.parents]:\n"
            "        if (candidate / 'src' / 'ranking').exists() and (candidate / 'models').exists():\n"
            "            return candidate\n"
            "    raise RuntimeError('Could not locate repo root containing src/ranking and models.')\n\n"
            "ROOT = find_repo_root(Path.cwd().resolve())\n"
            "if str(ROOT) not in sys.path:\n"
            "    sys.path.insert(0, str(ROOT))\n"
            "os.environ.setdefault('MPLCONFIGDIR', '/tmp/matplotlib')\n\n"
            "from src.ranking.data import panel_coverage_summary\n"
            "from src.ranking.pipeline import run_ranking_problem\n"
            "from models.state_income_momentum import CONFIG as STATE_INCOME_MOMENTUM\n"
            "from models.industry_wage_upside import CONFIG as INDUSTRY_WAGE_UPSIDE\n"
            "from models.industry_wage_stability import CONFIG as INDUSTRY_WAGE_STABILITY\n"
            "from models.industry_household_formation import CONFIG as INDUSTRY_HOUSEHOLD_FORMATION\n"
            "from models.american_dream_state import CONFIG as AMERICAN_DREAM_STATE\n"
            "from models.american_dream_industry import CONFIG as AMERICAN_DREAM_INDUSTRY\n\n"
            "coverage = panel_coverage_summary()\n"
            "pd.DataFrame(coverage).T\n"
        ),
        code_cell(
            "PROBLEMS = [\n"
            "    STATE_INCOME_MOMENTUM,\n"
            "    INDUSTRY_WAGE_UPSIDE,\n"
            "    INDUSTRY_WAGE_STABILITY,\n"
            "    INDUSTRY_HOUSEHOLD_FORMATION,\n"
            "    AMERICAN_DREAM_STATE,\n"
            "    AMERICAN_DREAM_INDUSTRY,\n"
            "]\n"
            "RESULTS = {(cfg.problem_id, cfg.name, horizon): run_ranking_problem(cfg, horizon=horizon) for cfg in PROBLEMS for horizon in (1, 3)}\n\n"
            "performance_rows = []\n"
            "for (_, name, horizon), result in RESULTS.items():\n"
            "    performance_rows.append({\n"
            "        'problem': name,\n"
            "        'horizon_years': horizon,\n"
            "        'best_model': result['best_model_name'],\n"
            "        'predictive_mae': result['predictive_metrics']['mae'],\n"
            "        'naive_mae': result['naive_metrics']['mae'],\n"
            "        'predictive_rank_corr': result['predictive_metrics']['rank_corr'],\n"
            "        'naive_rank_corr': result['naive_metrics']['rank_corr'],\n"
            "        'top10_overlap_scorecard_vs_predictive': result['top_k_overlap'],\n"
            "    })\n"
            "performance = pd.DataFrame(performance_rows).sort_values(['problem', 'horizon_years'])\n"
            "performance\n"
        ),
        markdown_cell(
            "### Feature Engineering Notes\n\n"
            "- State models use per-capita personal income as the core level variable.\n"
            "- Industry models use wages and salaries per full-time equivalent employee.\n"
            "- Shared features include CAGR, rolling volatility, drawdown, downside-year counts, and recovery ratios.\n"
            "- National affordability headwinds come from PCE housing/rent, health, education, and housing/construction price series.\n"
            "- Predictive targets are future weighted-composite scores at 1-year and 3-year horizons."
        ),
        markdown_cell(
            "### Model Features\n\n"
            "Below is the exact feature set used by each predictive model. The predictive models use these current-year inputs to forecast a future composite score.\n\n"
            "**State long-run income momentum**\n"
            "- `cagr_5y`: 5-year compound annual growth rate of per-capita income.\n"
            "- `cagr_10y`: 10-year compound annual growth rate of per-capita income.\n"
            "- `trend_slope`: rolling 5-year slope of annual per-capita income growth.\n"
            "- `recovery_speed`: current per-capita income divided by the rolling 5-year peak income.\n"
            "- `volatility_penalty`: rolling 5-year standard deviation of annual per-capita income growth.\n\n"
            "**Industry wage upside**\n"
            "- `current_wage`: current wage per full-time equivalent worker.\n"
            "- `wage_growth_3y`: 3-year CAGR of wage per FTE.\n"
            "- `wage_growth_5y`: 5-year CAGR of wage per FTE.\n"
            "- `growth_acceleration`: change in annual wage growth versus 3 years earlier.\n\n"
            "**Industry wage stability**\n"
            "- `volatility`: rolling 5-year standard deviation of annual wage growth.\n"
            "- `max_drawdown`: percent below the rolling 5-year wage peak.\n"
            "- `downside_years`: count of negative annual wage-growth years in the rolling 5-year window.\n"
            "- `recovery_speed`: current wage divided by the rolling 5-year wage peak.\n\n"
            "**Industry support for household formation**\n"
            "- `wage_level`: current wage per FTE.\n"
            "- `wage_growth_3y`: 3-year CAGR of wage per FTE.\n"
            "- `wage_stability`: rolling 5-year standard deviation of annual wage growth.\n"
            "- `housing_headwind`: annual change in the national rent price index.\n"
            "- `health_headwind`: annual change in the national health price index.\n"
            "- `education_headwind`: annual change in the national education price index.\n\n"
            "**American Dream Score - state**\n"
            "- `income_level`: current per-capita income.\n"
            "- `income_momentum`: 5-year CAGR of per-capita income.\n"
            "- `stability`: rolling 5-year standard deviation of annual per-capita income growth.\n"
            "- `resilience`: current per-capita income divided by the rolling 5-year peak income.\n\n"
            "**American Dream Score - industry**\n"
            "- `wage_level`: current wage per FTE.\n"
            "- `wage_upside`: 3-year CAGR of wage per FTE.\n"
            "- `wage_stability`: rolling 5-year standard deviation of annual wage growth.\n"
            "- `affordability_headwind`: mean of annual changes in national rent, health, education, and construction price indexes."
        ),
        markdown_cell(
            "### How Derived Features Are Computed\n\n"
            "These are the non-obvious features that appear repeatedly across models.\n\n"
            "- `annual_growth_yoy`: `((value_t / value_t-1) - 1) * 100`\n"
            "- `cagr_3y`: `((value_t / value_t-3) ** (1/3) - 1) * 100`\n"
            "- `cagr_5y`: `((value_t / value_t-5) ** (1/5) - 1) * 100`\n"
            "- `cagr_10y`: `((value_t / value_t-10) ** (1/10) - 1) * 100`\n"
            "- `trend_slope`: fit a straight line to the last 5 annual-growth observations and use the slope coefficient.\n"
            "- `volatility_penalty` or `wage_stability`: rolling 5-year standard deviation of annual growth.\n"
            "- `downside_years`: number of annual-growth values below 0 in the last 5 years.\n"
            "- `max_drawdown`: `(current_value / rolling_5y_max - 1) * 100`\n"
            "- `recovery_speed` or `resilience`: `current_value / rolling_5y_max`\n"
            "- `growth_acceleration`: annual-growth today minus annual-growth from 3 years ago.\n"
            "- `affordability_headwind`: average of yearly changes in the national rent, health, education, and construction price indexes."
        ),
        code_cell(
            "feature_examples = {\n"
            "    'state_income_momentum_example': pd.DataFrame([\n"
            "        {\n"
            "            'feature': 'cagr_5y',\n"
            "            'how_to_get_it': '((per_capita_income_t / per_capita_income_t-5) ** (1/5) - 1) * 100',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'cagr_10y',\n"
            "            'how_to_get_it': '((per_capita_income_t / per_capita_income_t-10) ** (1/10) - 1) * 100',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'trend_slope',\n"
            "            'how_to_get_it': 'slope of the last 5 yearly income-growth values',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'recovery_speed',\n"
            "            'how_to_get_it': 'per_capita_income_t / rolling_max(per_capita_income, 5 years)',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'volatility_penalty',\n"
            "            'how_to_get_it': 'std of the last 5 yearly income-growth values',\n"
            "        },\n"
            "    ]),\n"
            "    'industry_stability_example': pd.DataFrame([\n"
            "        {\n"
            "            'feature': 'max_drawdown',\n"
            "            'how_to_get_it': '(wage_per_fte_t / rolling_max(wage_per_fte, 5 years) - 1) * 100',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'downside_years',\n"
            "            'how_to_get_it': 'count of wage_growth_yoy < 0 over the last 5 years',\n"
            "        },\n"
            "        {\n"
            "            'feature': 'recovery_speed',\n"
            "            'how_to_get_it': 'wage_per_fte_t / rolling_max(wage_per_fte, 5 years)',\n"
            "        },\n"
            "    ]),\n"
            "}\n"
            "for name, frame in feature_examples.items():\n"
            "    display(Markdown(f'#### {name.replace(\"_\", \" \").title()}'))\n"
            "    display(frame)\n"
        ),
        markdown_cell("## 2. State Rankings"),
        code_cell(
            "STATE_KEYS = [\n"
            "    (STATE_INCOME_MOMENTUM.problem_id, STATE_INCOME_MOMENTUM.name, 1),\n"
            "    (STATE_INCOME_MOMENTUM.problem_id, STATE_INCOME_MOMENTUM.name, 3),\n"
            "]\n"
            "for key in STATE_KEYS:\n"
            "    result = RESULTS[key]\n"
            "    display(Markdown(f\"### {result['config'].name} ({result['horizon']}-year forecast)\"))\n"
            "    display(result['predictive_ranking'].head(10))\n"
            "    display(result['predictive_ranking'].tail(10))\n"
            "    display(pd.DataFrame([{\n"
            "        'best_model': result['best_model_name'],\n"
            "        'predictive_mae': result['predictive_metrics']['mae'],\n"
            "        'naive_mae': result['naive_metrics']['mae'],\n"
            "        'predictive_rank_corr': result['predictive_metrics']['rank_corr'],\n"
            "    }]))\n"
            "    display(result['figure'])\n"
        ),
        markdown_cell("## 3. Industry Rankings"),
        code_cell(
            "INDUSTRY_KEYS = [\n"
            "    (INDUSTRY_WAGE_UPSIDE.problem_id, INDUSTRY_WAGE_UPSIDE.name, 1),\n"
            "    (INDUSTRY_WAGE_UPSIDE.problem_id, INDUSTRY_WAGE_UPSIDE.name, 3),\n"
            "    (INDUSTRY_WAGE_STABILITY.problem_id, INDUSTRY_WAGE_STABILITY.name, 1),\n"
            "    (INDUSTRY_WAGE_STABILITY.problem_id, INDUSTRY_WAGE_STABILITY.name, 3),\n"
            "    (INDUSTRY_HOUSEHOLD_FORMATION.problem_id, INDUSTRY_HOUSEHOLD_FORMATION.name, 1),\n"
            "    (INDUSTRY_HOUSEHOLD_FORMATION.problem_id, INDUSTRY_HOUSEHOLD_FORMATION.name, 3),\n"
            "]\n"
            "for key in INDUSTRY_KEYS:\n"
            "    result = RESULTS[key]\n"
            "    display(Markdown(f\"### {result['config'].name} ({result['horizon']}-year forecast)\"))\n"
            "    display(result['predictive_ranking'].head(10))\n"
            "    display(result['predictive_ranking'].tail(10))\n"
            "    display(pd.DataFrame([{\n"
            "        'best_model': result['best_model_name'],\n"
            "        'predictive_mae': result['predictive_metrics']['mae'],\n"
            "        'naive_mae': result['naive_metrics']['mae'],\n"
            "        'predictive_rank_corr': result['predictive_metrics']['rank_corr'],\n"
            "    }]))\n"
            "    display(result['figure'])\n"
        ),
        markdown_cell("## 4. American Dream Composite Rankings"),
        code_cell(
            "for key in [\n"
            "    (AMERICAN_DREAM_STATE.problem_id, AMERICAN_DREAM_STATE.name, 1),\n"
            "    (AMERICAN_DREAM_STATE.problem_id, AMERICAN_DREAM_STATE.name, 3),\n"
            "    (AMERICAN_DREAM_INDUSTRY.problem_id, AMERICAN_DREAM_INDUSTRY.name, 1),\n"
            "    (AMERICAN_DREAM_INDUSTRY.problem_id, AMERICAN_DREAM_INDUSTRY.name, 3),\n"
            "]:\n"
            "    result = RESULTS[key]\n"
            "    display(Markdown(f\"### {result['config'].name} ({result['horizon']}-year forecast)\"))\n"
            "    display(result['predictive_ranking'].head(10))\n"
            "    display(result['predictive_ranking'].tail(10))\n"
            "    display(result['figure'])\n"
        ),
        markdown_cell("## 5. Model Comparison and Limitations"),
        code_cell(
            "comparison = performance.copy()\n"
            "comparison['predictive_beats_naive'] = comparison['predictive_mae'] <= comparison['naive_mae']\n"
            "comparison\n"
        ),
        markdown_cell(
            "Known limitations in this v1:\n\n"
            "- National affordability headwinds affect every state or industry equally within a year, so they shift levels more than cross-sectional spread.\n"
            "- Industry profit data exists in the repo but does not align cleanly enough across all wage industries to use broadly in this first version.\n"
            "- State coverage in the cleaned input is limited to the geographies present in `cleaned_income_with_state.csv`."
        ),
        markdown_cell("## 6. Final Recommendations"),
        code_cell(
            "def summarize_top_entities(result, top_n=5):\n"
            "    top = result['predictive_ranking'].head(top_n)['entity'].tolist()\n"
            "    return ', '.join(top)\n\n"
            "findings = []\n"
            "for key, result in RESULTS.items():\n"
            "    findings.append({\n"
            "        'problem': result['config'].name,\n"
            "        'horizon_years': result['horizon'],\n"
            "        'top_entities': summarize_top_entities(result),\n"
            "        'best_model': result['best_model_name'],\n"
            "        'predictive_mae': result['predictive_metrics']['mae'],\n"
            "        'notes': result['config'].note,\n"
            "    })\n"
            "pd.DataFrame(findings).sort_values(['problem', 'horizon_years'])\n"
        ),
        markdown_cell(
            "Recommended next data improvements:\n\n"
            "1. Add state-level rent, home price, and broad cost-of-living series to replace the state affordability proxies.\n"
            "2. Align industry profit series at the same industry grain as wages before using them as predictive inputs.\n"
            "3. Expand the notebook with narrative interpretation after reviewing the actual top/bottom entities that matter most for the final datathon story."
        ),
    ]

    return {
        "cells": cells,
        "metadata": {
            "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
            "language_info": {"name": "python", "version": "3.x"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }


def main() -> None:
    NOTEBOOK_PATH.write_text(json.dumps(build_notebook(), indent=2), encoding="utf-8")
    print(f"Wrote {NOTEBOOK_PATH}")


if __name__ == "__main__":
    main()
