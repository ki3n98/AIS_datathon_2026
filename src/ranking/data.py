from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data" / "cleaned"

STATE_DESCRIPTION_MAP = {
    "Personal income (millions of dollars)": "personal_income_millions",
    "Population (persons) 1": "population",
    "Per capita personal income (dollars) 2": "per_capita_income",
}

INDUSTRY_EXCLUDE = {
    "Wages and salaries per full-time equivalent employee",
    "Domestic industries",
    "Private industries",
    "Government",
    "Federal",
    "General government",
    "Civilian",
    "Military",
    "Government enterprises",
    "State and local",
    "Rest of the world",
}


def _year_columns(columns: list[str]) -> list[str]:
    return [column for column in columns if column.isdigit()]


def wide_to_long(df: pd.DataFrame, id_cols: list[str], value_name: str) -> pd.DataFrame:
    year_cols = _year_columns(df.columns.tolist())
    long_df = df.melt(
        id_vars=id_cols,
        value_vars=year_cols,
        var_name="year",
        value_name=value_name,
    )
    long_df["year"] = long_df["year"].astype(int)
    long_df[value_name] = pd.to_numeric(long_df[value_name], errors="coerce")
    return long_df


@lru_cache(maxsize=1)
def load_state_income_panel() -> pd.DataFrame:
    raw = pd.read_csv(DATA_DIR / "cleaned_income_with_state.csv")
    long_df = wide_to_long(
        raw,
        id_cols=["GeoFIPS", "GeoName", "LineCode", "Description", "Region"],
        value_name="value",
    )
    long_df["Description"] = long_df["Description"].map(STATE_DESCRIPTION_MAP)
    panel = (
        long_df.pivot_table(
            index=["GeoName", "Region", "year"],
            columns="Description",
            values="value",
            aggfunc="first",
        )
        .reset_index()
        .rename(columns={"GeoName": "entity", "Region": "region"})
        .sort_values(["entity", "year"])
    )
    panel["entity_type"] = "state"
    return panel


@lru_cache(maxsize=1)
def load_industry_wage_panel() -> pd.DataFrame:
    raw = pd.read_csv(DATA_DIR / "annual_wages_per_FTE_by_industry.csv")
    raw = raw[~raw["industry"].isin(INDUSTRY_EXCLUDE)].copy()
    long_df = wide_to_long(raw, id_cols=["line", "industry", "code"], value_name="wage_per_fte")
    long_df = long_df.rename(columns={"industry": "entity"}).sort_values(["entity", "year"])
    long_df["entity_type"] = "industry"
    return long_df.reset_index(drop=True)


def _extract_series(path: Path, category_col: str, category: str, value_name: str) -> pd.DataFrame:
    raw = pd.read_csv(path)
    raw[category_col] = raw[category_col].astype(str).str.strip()
    match = raw[raw[category_col] == category.strip()].head(1).copy()
    if match.empty:
        raise ValueError(f"Category {category!r} not found in {path.name}")
    return wide_to_long(match, id_cols=[category_col], value_name=value_name)[["year", value_name]]


@lru_cache(maxsize=1)
def load_macro_headwinds() -> pd.DataFrame:
    inflation = _extract_series(
        DATA_DIR / "annual_inflation_rate_YOY.csv",
        "category",
        "Personal consumption expenditures (PCE)",
        "pce_inflation_yoy",
    )
    pce_housing = _extract_series(
        DATA_DIR / "Price_Indexes_for_Personal_Consumption_Expenditures_by_Function.csv",
        "category",
        "Rental of tenant-occupied nonfarm housing",
        "rent_price_index",
    )
    pce_health = _extract_series(
        DATA_DIR / "Price_Indexes_for_Personal_Consumption_Expenditures_by_Function.csv",
        "category",
        "Health",
        "health_price_index",
    )
    pce_education = _extract_series(
        DATA_DIR / "Price_Indexes_for_Personal_Consumption_Expenditures_by_Function.csv",
        "category",
        "Education",
        "education_price_index",
    )
    housing_output = _extract_series(
        DATA_DIR / "annual_price_indexes_for_housing_sector_output.csv",
        "category",
        "Owner-occupied",
        "owner_housing_price_index",
    )
    structures_price = _extract_series(
        DATA_DIR / "annual_price_indexes_for_private_fixed_investment_in_structures.csv",
        "category",
        "Private fixed investment in structures",
        "construction_price_index",
    )
    structures_volume = _extract_series(
        DATA_DIR / "annual_private_fixed_investment_in_structures.csv",
        "category",
        "Private fixed investment in structures",
        "construction_investment",
    )

    macro = inflation
    for series in [
        pce_housing,
        pce_health,
        pce_education,
        housing_output,
        structures_price,
        structures_volume,
    ]:
        macro = macro.merge(series, on="year", how="outer")

    for column in [
        "rent_price_index",
        "health_price_index",
        "education_price_index",
        "owner_housing_price_index",
        "construction_price_index",
        "construction_investment",
    ]:
        macro[f"{column}_yoy"] = macro[column].pct_change(fill_method=None) * 100.0

    macro["shared_affordability_headwind"] = macro[
        [
            "rent_price_index_yoy",
            "health_price_index_yoy",
            "education_price_index_yoy",
            "construction_price_index_yoy",
        ]
    ].mean(axis=1)
    return macro.sort_values("year").reset_index(drop=True)


def panel_coverage_summary() -> dict[str, dict[str, int]]:
    state_panel = load_state_income_panel()
    industry_panel = load_industry_wage_panel()
    return {
        "state": {
            "entities": int(state_panel["entity"].nunique()),
            "min_year": int(state_panel["year"].min()),
            "max_year": int(state_panel["year"].max()),
        },
        "industry": {
            "entities": int(industry_panel["entity"].nunique()),
            "min_year": int(industry_panel["year"].min()),
            "max_year": int(industry_panel["year"].max()),
        },
    }
