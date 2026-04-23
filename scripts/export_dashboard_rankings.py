from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib")
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from models.american_dream_industry import CONFIG as INDUSTRY_CONFIG
from models.american_dream_state import CONFIG as STATE_CONFIG
from src.ranking.pipeline import run_ranking_problem


def _serialize_frame(frame, score_col: str) -> list[dict[str, object]]:
    return [
        {
            "label": str(row.entity),
            "value": float(getattr(row, score_col)),
            "rank": int(row.rank),
            "year": int(row.year),
        }
        for row in frame.itertuples(index=False)
    ]


def _collapse_duplicate_labels(items: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, dict[str, object]] = {}
    for item in items:
        label = str(item["label"])
        group = grouped.setdefault(label, {"label": label, "value_sum": 0.0, "count": 0, "year": int(item["year"])})
        group["value_sum"] = float(group["value_sum"]) + float(item["value"])
        group["count"] = int(group["count"]) + 1
        group["year"] = max(int(group["year"]), int(item["year"]))

    collapsed = [
        {
            "label": label,
            "value": float(group["value_sum"]) / int(group["count"]),
            "year": int(group["year"]),
        }
        for label, group in grouped.items()
    ]
    collapsed.sort(key=lambda item: (-float(item["value"]), str(item["label"])))

    for index, item in enumerate(collapsed, start=1):
        item["rank"] = index
    return collapsed


def _build_payload(config, horizon: int) -> dict[str, object]:
    result = run_ranking_problem(config, horizon=horizon)
    ranking = result["predictive_ranking"]
    score_col = "predicted_future_score"
    serialized = _collapse_duplicate_labels(_serialize_frame(ranking, score_col))
    return {
        "problem_id": int(config.problem_id),
        "name": config.name,
        "entity_type": config.entity_type,
        "latest_year": int(result["latest_year"]),
        "horizon": horizon,
        "best_model_name": result["best_model_name"],
        "predictive_metrics": result["predictive_metrics"],
        "naive_metrics": result["naive_metrics"],
        "top_k_overlap": float(result["top_k_overlap"]),
        "top_5": serialized[:5],
        "bottom_5": serialized[-5:],
        "full_ranking": serialized,
    }


def main() -> None:
    payload = {
        "generated_at": datetime.now().isoformat(),
        "state": _build_payload(STATE_CONFIG, horizon=1),
        "industry": _build_payload(INDUSTRY_CONFIG, horizon=3),
    }

    output_path = ROOT / "outputs" / "dashboard_rankings.json"
    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
