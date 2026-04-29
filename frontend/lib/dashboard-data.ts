import { promises as fs } from "node:fs";
import path from "node:path";
import Papa from "papaparse";

type CsvRow = Record<string, string>;

type RankingExportItem = {
  label: string;
  value: number;
  rank: number;
  year: number;
};

type RankingExportSection = {
  problem_id: number;
  name: string;
  entity_type: string;
  latest_year: number;
  horizon: number;
  best_model_name: string;
  predictive_metrics: {
    mae: number;
    rmse: number;
    rank_corr: number;
  };
  naive_metrics: {
    mae: number;
    rmse: number;
    rank_corr: number;
  };
  top_k_overlap: number;
  top_5: RankingExportItem[];
  bottom_5: RankingExportItem[];
  full_ranking: RankingExportItem[];
};

type RankingExport = {
  generated_at: string;
  state: RankingExportSection;
  industry: RankingExportSection;
};

export type SeriesPoint = {
  year: number;
  [key: string]: number | string;
};

export type Tone = "good" | "warn" | "bad" | "neutral";

export type RankedMetric = {
  label: string;
  value: number;
  formattedValue: string;
  tone: Tone;
  note?: string;
};

export type SectionLink = {
  id: string;
  label: string;
  summary: string;
};

export type KpiWidget = {
  label: string;
  value: string;
  changeLabel: string;
  note: string;
  tone: Tone;
};

export type SummaryCard = {
  label: string;
  value: string;
  note: string;
};

export type InsightCard = {
  title: string;
  body: string;
};

export type BudgetSlice = {
  label: string;
  value: string;
};

export type StateDreamProfile = {
  state: string;
  actualIncome: string;
  actualIncomeValue: number;
  comfortableIncome: string;
  comfortableIncomeValue: number;
  tone: Tone;
  tierLabel: string;
  message: string;
  monthlyBudget: BudgetSlice[];
};

export type DashboardData = {
  title: string;
  subtitle: string;
  sidebar: SectionLink[];
  verdict: {
    label: string;
    summary: string;
  };
  overview: {
    summaryCards: SummaryCard[];
    kpis: KpiWidget[];
    comparisonChart: SeriesPoint[];
    comparisonLines: string[];
    affordabilityRankings: RankedMetric[];
    spotlightLists: {
      incomeGrowthIndustries: RankedMetric[];
      costGrowthCategories: RankedMetric[];
      homeBuildingGrowth: RankedMetric[];
      homeBuildingNote: string;
    medianReadout: {
      incomeGrowth: string;
      costGrowth: string;
      homeBuilding: string;
    };
  };
  };
  costOfLiving: {
    chart: SeriesPoint[];
    lines: string[];
    insightCards: InsightCard[];
    stateIncomeContext: {
      nationalPerCapita2024: string;
      spread: string;
      medianState: string;
      topStates: RankedMetric[];
      bottomStates: RankedMetric[];
    };
  };
  stateLens: {
    yearLabel: string;
    metricLabel: string;
    explainer: string;
    profiles: StateDreamProfile[];
    leaders: RankedMetric[];
    laggards: RankedMetric[];
  };
  industryDivide: {
    predictedFigure: {
      leaders: RankedMetric[];
      laggards: RankedMetric[];
      metricLabel: string;
      benchmarkLabel: string;
    };
    historicalFigure: {
      leaders: RankedMetric[];
      laggards: RankedMetric[];
      metricLabel: string;
      benchmarkLabel: string;
    };
    degreeComparison: {
      growth2024: RankedMetric[];
      wageLevels2024: RankedMetric[];
    };
    summary: InsightCard[];
  };
  housingBurden: {
    burdenChart: SeriesPoint[];
    burdenLines: string[];
    burdenChange: RankedMetric[];
    rentVsOwnerChart: SeriesPoint[];
    rentVsOwnerLines: string[];
    summary: InsightCard[];
  };
  homeownership: {
    constructionChart: SeriesPoint[];
    constructionLines: string[];
    residentialShareChart: SeriesPoint[];
    keyMoments: SummaryCard[];
    summary: InsightCard[];
  };
  methodology: {
    workflow: {
      label: string;
      title: string;
      body: string;
      note?: string;
    }[];
    sources: string[];
    caveats: string[];
    futureWork: string[];
  };
};

const DATA_DIR = path.join(process.cwd(), "..", "data", "cleaned");
const BASE_YEAR = 2000;
const FINAL_YEAR = 2024;

const CATEGORY_COLORS = {
  "Median industry wage": "#0b7a75",
  "Overall cost of living (weighted basket)": "#7c8796",
  Housing: "#c6922d",
  "Rent (tenant)": "#d2a84c",
  Healthcare: "#2a95a0",
  "Higher education": "#9b4a26",
  Groceries: "#55725f",
  "Private industries": "#0b7a75",
  Information: "#1f4f8d",
  "Finance and insurance": "#2a95a0",
  "Professional, scientific, and technical services": "#0a5c63",
  "Educational services": "#c6922d",
  Construction: "#7f8ea3",
  "Retail trade": "#915235",
  "Accommodation and food services": "#ba7d44",
  "Higher-education-heavy industries": "#1f4f8d",
  "Non-higher-education-heavy industries": "#ba7d44",
  "Degree-heavy industries": "#0b7a75",
  "Non-degree-heavy industries": "#c6922d",
  "All housing + utilities": "#0b7a75",
  "Owner-occupied (imputed)": "#1f4f8d",
  "Tenant rent (cash)": "#c6922d",
  "Tenant rent": "#c6922d",
  "Owner-equivalent rent": "#1f4f8d",
  Residential: "#7f8ea3",
  "Single-family structures": "#9b4a26",
  "Multifamily structures": "#c6922d",
  "Manufactured homes": "#5f7187",
  share: "#0b7a75",
};

function cleanCategory(value: string | undefined): string {
  return String(value ?? "")
    .replace(/\\\d+\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readCsv(fileName: string): Promise<CsvRow[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, fileName), "utf8");
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse ${fileName}: ${parsed.errors[0]?.message ?? "Unknown error"}`);
  }

  return parsed.data as CsvRow[];
}

function formatIndex(value: number): string {
  return `${value.toFixed(1)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatScore(value: number): string {
  return value.toFixed(3);
}

async function readRankingExport(): Promise<RankingExport | null> {
  const filePath = path.join(process.cwd(), "..", "outputs", "dashboard_rankings.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as RankingExport;
  } catch {
    return null;
  }
}

function toRankingMetric(item: RankingExportItem, tone: Tone, label: string): RankedMetric {
  return {
    label: item.label,
    value: item.value,
    formattedValue: formatScore(item.value),
    tone,
    note: `${label} rank #${item.rank} for ${item.year}`,
  };
}

function buildIndustryRankingMetric(
  label: string,
  value: number,
  tone: Tone,
  note: string,
  formatter: (value: number) => string = formatScore
): RankedMetric {
  return {
    label,
    value,
    formattedValue: formatter(value),
    tone,
    note,
  };
}

function collapseIndustryRows(rows: CsvRow[]): Array<{ label: string; values: Record<number, number> }> {
  const grouped = new Map<string, { totals: Record<number, number>; counts: Record<number, number> }>();

  for (const row of rows) {
    const label = cleanCategory(row.industry);
    const group = grouped.get(label) ?? { totals: {}, counts: {} };

    for (const [key, rawValue] of Object.entries(row)) {
      if (!/^\d{4}$/.test(key)) continue;
      const year = Number(key);
      const value = toNumber(rawValue);
      if (!Number.isFinite(value) || value <= 0) continue;
      group.totals[year] = (group.totals[year] ?? 0) + value;
      group.counts[year] = (group.counts[year] ?? 0) + 1;
    }

    grouped.set(label, group);
  }

  return Array.from(grouped.entries()).map(([label, group]) => ({
    label,
    values: Object.fromEntries(
      Object.keys(group.totals).map((yearKey) => {
        const year = Number(yearKey);
        return [year, group.totals[year] / group.counts[year]];
      })
    ),
  }));
}

function yearsInRange(rows: CsvRow[]): number[] {
  return Object.keys(rows[0] ?? {})
    .filter((key) => /^\d{4}$/.test(key))
    .map(Number)
    .filter((year) => year >= BASE_YEAR && year <= FINAL_YEAR)
    .sort((a, b) => a - b);
}

function toSeries(
  years: number[],
  valuesByLabel: Record<string, Record<number, number>>,
  order: string[]
): SeriesPoint[] {
  return years.map((year) => {
    const point: SeriesPoint = { year };
    for (const label of order) {
      point[label] = valuesByLabel[label]?.[year] ?? 0;
      point[`${label}Color`] = CATEGORY_COLORS[label as keyof typeof CATEGORY_COLORS] ?? "#0b7a75";
    }
    return point;
  });
}

function classifyAffordability(value: number): Tone {
  if (value < 95) return "bad";
  if (value < 115) return "warn";
  return "good";
}

function classifyGrowth(value: number, baseline = 200): Tone {
  if (value >= baseline + 20) return "good";
  if (value >= baseline - 10) return "warn";
  return "bad";
}

function classifyGap(value: number): Tone {
  if (value >= 150) return "bad";
  if (value >= 110) return "warn";
  return "good";
}

function median(values: number[]): number {
  const sorted = [...values].filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function weightedAverage(items: Array<{ value: number; weight: number }>): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return 0;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

function toIndexMetric(label: string, value: number, tone: Tone, note: string): RankedMetric {
  return {
    label,
    value,
    formattedValue: `${formatIndex(value)} index`,
    tone,
    note,
  };
}

function buildStateDreamProfile(
  state: string,
  actualIncomeValue: number,
  maxIncomeValue: number
): StateDreamProfile {
  const ratio = maxIncomeValue > 0 ? actualIncomeValue / maxIncomeValue : 0.5;
  const comfortableIncomeValue = 80_000 + ratio * 90_000;
  const tone: Tone =
    ratio >= 0.8 ? "good" : ratio >= 0.55 ? "neutral" : ratio >= 0.3 ? "warn" : "bad";
  const tierLabel =
    ratio >= 0.8
      ? "Thriving"
      : ratio >= 0.55
        ? "Steady"
        : ratio >= 0.3
          ? "Hustling"
          : "Strained";
  const message =
    ratio >= 0.8
      ? `${state} looks like a stronger launch point for stability, savings, and long-term planning.`
      : ratio >= 0.55
        ? `${state} still looks workable, but the path forward depends more on careful budgeting and steady income.`
        : ratio >= 0.3
          ? `${state} still leaves room for progress, but the American Dream starts to look more effort-heavy than automatic.`
          : `${state} looks like the kind of place where keeping up can crowd out the classic Dream milestones.`;
  const monthlyBudget = [
    { label: "Housing", value: formatMoney((comfortableIncomeValue / 12) * 0.3) },
    { label: "Transport", value: formatMoney((comfortableIncomeValue / 12) * 0.15) },
    { label: "Essentials", value: formatMoney((comfortableIncomeValue / 12) * 0.3) },
    { label: "Savings", value: formatMoney((comfortableIncomeValue / 12) * 0.15) },
    { label: "Flex", value: formatMoney((comfortableIncomeValue / 12) * 0.1) },
  ];

  return {
    state,
    actualIncome: formatMoney(actualIncomeValue),
    actualIncomeValue,
    comfortableIncome: formatMoney(comfortableIncomeValue),
    comfortableIncomeValue,
    tone,
    tierLabel,
    message,
    monthlyBudget,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const [incomeRows, regionalIncomeRows, priceRows, spendingRows, wageRows, constructionRows, residentialRows, rankingExport] = await Promise.all([
    readCsv("cleaned_income_with_state.csv"),
    readCsv("cleaned_income_with_region.csv"),
    readCsv("annual_price_indexes_for_PCE.csv"),
    readCsv("annual_Personal_Consumption_Expenditures_by_Function.csv"),
    readCsv("annual_wages_per_FTE_by_industry.csv"),
    readCsv("annual_price_indexes_for_private_fixed_investment_in_structures.csv"),
    readCsv("annual_private_fixed_investment_in_structures.csv"),
    readRankingExport(),
  ]);

  const incomeYears = yearsInRange(incomeRows);
  const totalIncomeByYear = Object.fromEntries(incomeYears.map((year) => [year, 0]));
  const totalPopulationByYear = Object.fromEntries(incomeYears.map((year) => [year, 0]));

  for (const row of incomeRows) {
    const lineCode = toNumber(row.LineCode);
    for (const year of incomeYears) {
      if (lineCode === 1) totalIncomeByYear[year] += toNumber(row[String(year)]);
      if (lineCode === 2) totalPopulationByYear[year] += toNumber(row[String(year)]);
    }
  }

  const perCapitaIncome = Object.fromEntries(
    incomeYears.map((year) => [year, (totalIncomeByYear[year] * 1_000_000) / totalPopulationByYear[year]])
  );

  const excludedIndustryLabels = new Set([
    "Wages and salaries per full-time equivalent employee",
    "Domestic industries",
    "Private industries",
    "Government and government enterprises",
    "Federal civilian",
    "Military",
    "State and local",
  ]);
  const collapsedIndustryRows = collapseIndustryRows(wageRows).filter(({ label, values }) => {
    const baseline = values[BASE_YEAR] ?? 0;
    return !excludedIndustryLabels.has(label) && baseline > 0;
  });
  const wagesByIndustry = new Map(collapsedIndustryRows.map((row) => [row.label, row.values]));
  const wageYears = Array.from({ length: FINAL_YEAR - BASE_YEAR + 1 }, (_, index) => BASE_YEAR + index);
  const incomeIndex = Object.fromEntries(
    wageYears.map((year) => [
      year,
      median(
        collapsedIndustryRows.map(({ values }) => {
          const baseline = values[BASE_YEAR] ?? 0;
          const current = values[year] ?? 0;
          return baseline > 0 && current > 0 ? (current / baseline) * 100 : Number.NaN;
        })
      ),
    ])
  );

  const pricesByCategory = new Map<string, CsvRow>();
  for (const row of priceRows) {
    pricesByCategory.set(cleanCategory(row.category), row);
  }
  const spendingByCategory = new Map<string, CsvRow>();
  for (const row of spendingRows) {
    spendingByCategory.set(cleanCategory(row.category), row);
  }

  const excludedWeightedCategories = new Set(["Personal consumption expenditures", "Household consumption expenditures"]);
  const weightedOverallCostSeries = Object.fromEntries(
    incomeYears.map((year) => {
      const items = Array.from(pricesByCategory.entries())
        .filter(([label]) => !excludedWeightedCategories.has(label))
        .map(([label, row]) => {
          const spendingRow = spendingByCategory.get(label);
          const baseValue = toNumber(row[String(BASE_YEAR)]);
          const currentValue = toNumber(row[String(year)]);
          const weight = toNumber(spendingRow?.[String(year)]);

          return {
            value: baseValue > 0 ? (currentValue / baseValue) * 100 : 0,
            weight,
          };
        })
        .filter((item) => item.weight > 0 && item.value > 0);

      return [year, weightedAverage(items)];
    })
  );

  const overviewPicks: Record<string, string> = {
    Housing: "Housing",
    "Rental of tenant-occupied nonfarm housing": "Rent (tenant)",
    Health: "Healthcare",
    "Higher education": "Higher education",
    "Food and nonalcoholic beverages purchased for off-premises consumption": "Groceries",
  };

  const overviewValues: Record<string, Record<number, number>> = {
    "Median industry wage": incomeIndex,
    "Overall cost of living (weighted basket)": weightedOverallCostSeries,
  };

  for (const [source, label] of Object.entries(overviewPicks)) {
    const row = pricesByCategory.get(source);
    if (!row) continue;
    overviewValues[label] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100])
    );
  }

  const overviewOrder = [
    "Median industry wage",
    "Overall cost of living (weighted basket)",
    "Housing",
    "Rent (tenant)",
    "Healthcare",
    "Higher education",
    "Groceries",
  ];

  const affordabilityRankings = overviewOrder
    .filter((label) => label !== "Median industry wage")
    .map((label) => {
      const affordability = (incomeIndex[FINAL_YEAR] / Number(overviewValues[label][FINAL_YEAR])) * 100;
      return {
        label,
        value: affordability,
        formattedValue: formatIndex(affordability),
        tone: classifyAffordability(affordability),
        note: affordability >= 100 ? "More income coverage than 2000" : "Less income coverage than 2000",
      };
    })
    .sort((a, b) => a.value - b.value);

  const featuredIndustryLabels = new Set([
    "Information",
    "Construction",
    "Retail trade",
    "Accommodation and food services",
    "Transportation and warehousing",
    "Health care and social assistance",
    "Educational services",
    "Professional, scientific, and technical services",
    "Finance and insurance",
    "Manufacturing",
  ]);

  const allIndustryGrowthLatest = Array.from(wagesByIndustry.entries())
    .map(([industry, values]) => {
      const baseline = values[BASE_YEAR] ?? 0;
      const latestValue = baseline > 0 ? ((values[FINAL_YEAR] ?? 0) / baseline) * 100 : 0;
      return buildIndustryRankingMetric(
        industry,
        latestValue,
        classifyGrowth(latestValue),
        latestValue >= overviewValues["Overall cost of living (weighted basket)"][FINAL_YEAR] ? "Beat broad inflation" : "Lagged broad inflation",
        (currentValue) => `${formatIndex(currentValue)} index`
      );
    })
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value);

  const incomeGrowthIndustries = allIndustryGrowthLatest
    .filter((item) => featuredIndustryLabels.has(item.label))
    .slice(0, 5)
    .map((item) => ({
      ...item,
      note: "Industry wage growth since 2000",
    }));

  const industryForecastLeaders = rankingExport?.industry
    ? rankingExport.industry.full_ranking.slice(0, 5).map((item) => ({
        ...toRankingMetric(item, "good", "Predicted"),
        note: `3-year forecast from ${item.year} to ${item.year + rankingExport.industry.horizon}`,
      }))
    : allIndustryGrowthLatest.slice(0, 5);

  const industryForecastLaggards = rankingExport?.industry
    ? [...rankingExport.industry.full_ranking]
        .slice(-5)
        .reverse()
        .map((item) => ({
          ...toRankingMetric(item, "bad", "Predicted"),
          note: `3-year forecast from ${item.year} to ${item.year + rankingExport.industry.horizon}`,
        }))
    : [...allIndustryGrowthLatest].slice(-5).reverse().map((item) => ({ ...item, tone: "bad" as Tone }));

  const actualIndustryWageLevels = Array.from(wagesByIndustry.entries())
    .map(([industry, values]) =>
      buildIndustryRankingMetric(
        industry,
        values[FINAL_YEAR] ?? 0,
        "neutral",
        `Actual ${FINAL_YEAR} wage per FTE`,
        formatMoney
      )
    )
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value);

  const historicalIndustryLeaders = actualIndustryWageLevels.slice(0, 5).map((item) => ({ ...item, tone: "good" as Tone }));
  const historicalIndustryLaggards = [...actualIndustryWageLevels]
    .slice(-5)
    .reverse()
    .map((item) => ({ ...item, tone: "warn" as Tone }));

  const degreeHeavy = [
    "Information",
    "Finance and insurance",
    "Professional, scientific, and technical services",
    "Educational services",
    "Health care and social assistance",
    "Management of companies and enterprises",
  ];
  const nonDegreeHeavy = [
    "Construction",
    "Retail trade",
    "Accommodation and food services",
    "Transportation and warehousing",
    "Agriculture, forestry, fishing, and hunting",
  ];

  function medianIndex(members: string[]): Record<number, number> {
    return Object.fromEntries(
      wageYears.map((year) => [
        year,
        median(
          members.map((industry) => {
            const values = wagesByIndustry.get(industry);
            const baseline = values?.[BASE_YEAR] ?? 0;
            if (!values || baseline <= 0) return Number.NaN;
            return ((values[year] ?? 0) / baseline) * 100;
          })
        ),
      ])
    );
  }

  function medianLevel(members: string[]): number {
    return median(members.map((industry) => wagesByIndustry.get(industry)?.[FINAL_YEAR] ?? Number.NaN));
  }

  const degreeGrowth = medianIndex(degreeHeavy);
  const nonDegreeGrowth = medianIndex(nonDegreeHeavy);
  const costOfLivingValues: Record<string, Record<number, number>> = {
    ...overviewValues,
    "Higher-education-heavy industries": degreeGrowth,
    "Non-higher-education-heavy industries": nonDegreeGrowth,
  };
  const costOfLivingOrder = [
    "Median industry wage",
    "Higher-education-heavy industries",
    "Non-higher-education-heavy industries",
    "Overall cost of living (weighted basket)",
    "Housing",
    "Rent (tenant)",
    "Healthcare",
    "Higher education",
    "Groceries",
  ];

  const housingLabels: Record<string, string> = {
    "Housing, utilities, and fuels": "All housing + utilities",
    "Rental of tenant-occupied nonfarm housing": "Tenant rent (cash)",
    "Imputed rental of owner-occupied nonfarm housing": "Owner-occupied (imputed)",
  };

  const housingBurdenValues: Record<string, Record<number, number>> = {};
  for (const [source, label] of Object.entries(housingLabels)) {
    const row = spendingByCategory.get(source);
    if (!row) continue;
    housingBurdenValues[label] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / totalIncomeByYear[year]) * 100])
    );
  }

  const rentOwnerLabels: Record<string, string> = {
    "Rental of tenant-occupied nonfarm housing": "Tenant rent",
    "Imputed rental of owner-occupied nonfarm housing": "Owner-equivalent rent",
  };
  const rentOwnerValues: Record<string, Record<number, number>> = {
    "Median industry wage": incomeIndex,
  };

  for (const [source, label] of Object.entries(rentOwnerLabels)) {
    const row = pricesByCategory.get(source);
    if (!row) continue;
    rentOwnerValues[label] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100])
    );
  }

  const constructionByCategory = new Map<string, CsvRow>();
  for (const row of constructionRows) {
    constructionByCategory.set(cleanCategory(row.category), row);
  }
  const constructionPicks = ["Single-family structures", "Multifamily structures", "Manufactured homes"];
  const constructionValues: Record<string, Record<number, number>> = {
    "Median industry wage": incomeIndex,
    "Rent (tenant)": overviewValues["Rent (tenant)"],
  };
  for (const category of constructionPicks) {
    const row = constructionByCategory.get(category);
    if (!row) continue;
    constructionValues[category] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100])
    );
  }

  const featuredCostCategoryLabels = new Set([
    "Housing",
    "Rental of tenant-occupied nonfarm housing",
    "Health",
    "Food and nonalcoholic beverages purchased for off-premises consumption",
    "Household utilities and fuels",
    "Ground transportation",
    "Net household insurance",
  ]);

  const costLabelMap: Record<string, string> = {
    Housing: "Housing",
    "Rental of tenant-occupied nonfarm housing": "Rent",
    Health: "Healthcare",
    "Food and nonalcoholic beverages purchased for off-premises consumption": "Groceries",
    "Household utilities and fuels": "Utilities",
    "Ground transportation": "Transportation",
    "Net household insurance": "Household insurance",
  };

  const relevantCostMetrics = Array.from(pricesByCategory.entries())
    .filter(([label]) => featuredCostCategoryLabels.has(label))
    .map(([label, row]) => {
      const baseValue = toNumber(row[String(BASE_YEAR)]);
      const latestValue = toNumber(row[String(FINAL_YEAR)]);
      const growthIndex = baseValue > 0 ? (latestValue / baseValue) * 100 : 0;
      return toIndexMetric(
        costLabelMap[label] ?? label,
        growthIndex,
        classifyGap(growthIndex - incomeIndex[FINAL_YEAR]),
        "Price growth since 2000"
      );
    });

  const spendingWeightsByLabel: Record<string, number> = {
    Housing: toNumber(spendingByCategory.get("Housing")?.[String(FINAL_YEAR)]),
    Rent: toNumber(spendingByCategory.get("Rental of tenant-occupied nonfarm housing")?.[String(FINAL_YEAR)]),
    Healthcare: toNumber(spendingByCategory.get("Health")?.[String(FINAL_YEAR)]),
    Groceries: toNumber(
      spendingByCategory.get("Food and nonalcoholic beverages purchased for off-premises consumption")?.[String(FINAL_YEAR)]
    ),
    Utilities: toNumber(spendingByCategory.get("Household utilities and fuels")?.[String(FINAL_YEAR)]),
    Transportation: toNumber(spendingByCategory.get("Ground transportation")?.[String(FINAL_YEAR)]),
    "Household insurance": toNumber(spendingByCategory.get("Net household insurance")?.[String(FINAL_YEAR)]),
  };

  const weightedRelevantCostGrowth = weightedAverage(
    relevantCostMetrics.map((item) => ({
      value: item.value,
      weight: spendingWeightsByLabel[item.label] ?? 0,
    }))
  );

  const costGrowthCategories = relevantCostMetrics
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const homeBuildingGrowth = [
    { label: "Manufactured homes", value: constructionValues["Manufactured homes"][FINAL_YEAR] ?? 0 },
    { label: "Multifamily structures", value: constructionValues["Multifamily structures"][FINAL_YEAR] ?? 0 },
    { label: "Single-family structures", value: constructionValues["Single-family structures"][FINAL_YEAR] ?? 0 },
  ]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((item) => toIndexMetric(item.label, item.value, classifyGap(item.value - incomeIndex[FINAL_YEAR]), "National building-cost growth"));

  const medianIndustryGrowth = median(
    allIndustryGrowthLatest.filter((item) => featuredIndustryLabels.has(item.label)).map((item) => item.value)
  );
  const medianRelevantCostGrowth = median(relevantCostMetrics.map((item) => item.value));
  const medianHomeBuildingGrowth = median(homeBuildingGrowth.map((item) => item.value));
  const meanHomeBuildingGrowth =
    homeBuildingGrowth.reduce((sum, item) => sum + item.value, 0) / Math.max(homeBuildingGrowth.length, 1);
  const residentialByCategory = new Map<string, CsvRow>();
  for (const row of residentialRows) {
    residentialByCategory.set(cleanCategory(row.category), row);
  }
  const residential = residentialByCategory.get("Residential");
  const residentialShare = Object.fromEntries(
    incomeYears.map((year) => [year, (toNumber(residential?.[String(year)]) / totalIncomeByYear[year]) * 100])
  );

  const statePerCapitaList = regionalIncomeRows
    .filter((row) => toNumber(row.year) === FINAL_YEAR)
    .map((row) => ({
      label: cleanCategory(row.state),
      value: toNumber(row["Personal Income (dollar)"] ?? row.value),
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const medianState = statePerCapitaList[Math.floor(statePerCapitaList.length / 2)];
  const topState = statePerCapitaList[0];
  const bottomState = statePerCapitaList[statePerCapitaList.length - 1];
  const maxStateIncomeValue = topState?.value ?? 0;
  const stateDreamProfiles = statePerCapitaList.map((item) =>
    buildStateDreamProfile(item.label, item.value, maxStateIncomeValue)
  );

  const weightedOverall2024 = overviewValues["Overall cost of living (weighted basket)"][FINAL_YEAR];
  const singleFamily2024 = constructionValues["Single-family structures"][FINAL_YEAR];
  const affordability2024 = affordabilityRankings.find((item) => item.label === "Housing");
  const stateRanking = rankingExport?.state ?? null;
  const industryRanking = rankingExport?.industry ?? null;
  const stateRankingYear = stateRanking?.latest_year ?? FINAL_YEAR;
  const industryRankingYear = industryRanking?.latest_year ?? FINAL_YEAR;

  return {
    title: "Is the American Dream Still Achievable?",
    subtitle:
      "A national view of income growth, rising costs, wage gaps, and why buying into stability became harder from 2000 to 2024.",
    sidebar: [
      { id: "overview", label: "Overview", summary: "The core claim and the broad affordability read." },
      { id: "cost-of-living", label: "Income vs Cost of Living", summary: "The first evidence section: income against major price indexes and category affordability." },
      { id: "housing-homeownership", label: "Housing and Homeownership", summary: "Renter strain and the ownership-entry barrier in one continuous housing story." },
      { id: "state-lens", label: "State Lens", summary: "A state-by-state read on how comfortable the Dream still looks across the country." },
      { id: "methodology", label: "Methodology", summary: "Workflow, limitations, future work, and references." },
    ],
    verdict: {
      label: "Mixed",
      summary: "Income kept up with broad everyday costs, but the parts of the American Dream tied to ownership and long-term mobility became harder to reach.",
    },
    overview: {
      summaryCards: [
        {
          label: "Primary signal",
          value: "Income beat broad prices",
          note: `The median industry wage index reached ${formatIndex(incomeIndex[FINAL_YEAR])} versus ${formatIndex(weightedOverall2024)} for the weighted overall cost-of-living basket.`,
        },
        {
          label: "Pressure point",
          value: "Housing and education pulled away",
          note: "Education and housing-related costs had the weakest affordability readings in 2024.",
        },
        {
          label: stateRanking ? "Model read" : "Ownership read",
          value: stateRanking ? `${stateRanking.top_5[0]?.label} leads states` : "Buying in is the break",
          note: stateRanking
            ? `One-year state forecast uses ${stateRanking.best_model_name} and points to ${stateRanking.top_5[0]?.label} at the top in ${stateRankingYear}.`
            : `Single-family building costs reached ${formatIndex(singleFamily2024)}, far above income growth.`,
        },
      ],
      kpis: [
        {
          label: "Income growth since 2000",
          value: formatIndex(incomeIndex[FINAL_YEAR]),
          changeLabel: "2000 = 100",
          note: "Median across industry wage indexes",
          tone: "good",
        },
        {
          label: "Everyday cost basket",
          value: formatIndex(weightedRelevantCostGrowth),
          changeLabel: "2000 = 100",
          note: "Weighted everyday household categories",
          tone: incomeIndex[FINAL_YEAR] > weightedRelevantCostGrowth ? "warn" : "bad",
        },
        {
          label: "Home building costs",
          value: formatIndex(meanHomeBuildingGrowth),
          changeLabel: "2000 = 100",
          note: "Average across key housing structure types",
          tone: classifyGap(meanHomeBuildingGrowth - incomeIndex[FINAL_YEAR]),
        },
        {
          label: "What this means",
          value: "Mixed",
          changeLabel: "2024 conclusion",
          note: "Everyday costs held up better than housing access and long-term advancement.",
          tone: "warn",
        },
      ],
      comparisonChart: toSeries(incomeYears, overviewValues, overviewOrder),
      comparisonLines: overviewOrder,
      affordabilityRankings,
      spotlightLists: {
        incomeGrowthIndustries,
        costGrowthCategories,
        homeBuildingGrowth,
        homeBuildingNote: "The repo does not include state-level home-building cost growth. This panel uses national building-type cost indexes instead.",
        medianReadout: {
          incomeGrowth: `${formatIndex(medianIndustryGrowth)} index`,
          costGrowth: `${formatIndex(medianRelevantCostGrowth)} index`,
          homeBuilding: `${formatIndex(medianHomeBuildingGrowth)} index`,
        },
      },
    },
    costOfLiving: {
      chart: toSeries(incomeYears, costOfLivingValues, costOfLivingOrder),
      lines: costOfLivingOrder,
      insightCards: [
        {
          title: "Aggregate affordability still exists",
          body: "At the national level, income grew faster than the overall cost of living, so the dashboard is not saying affordability collapsed everywhere.",
        },
        {
          title: "The break is category-specific",
          body: "The weakest results show up in higher education and housing-related costs, not in groceries or the overall average.",
        },
      ],
      stateIncomeContext: {
        nationalPerCapita2024: formatMoney(perCapitaIncome[FINAL_YEAR]),
        spread: `${formatMoney(topState?.value ?? 0)} vs ${formatMoney(bottomState?.value ?? 0)}`,
        medianState: `${medianState?.label ?? "Median state"} at ${formatMoney(medianState?.value ?? 0)}`,
        topStates: stateRanking
          ? stateRanking.top_5.map((item) => toRankingMetric(item, "good", "Predicted"))
          : statePerCapitaList.slice(0, 5).map((item) => ({
              label: item.label,
              value: item.value,
              formattedValue: formatMoney(item.value),
              tone: "good",
            })),
        bottomStates: stateRanking
          ? stateRanking.bottom_5.map((item) => toRankingMetric(item, "warn", "Predicted"))
          : statePerCapitaList.slice(-5).reverse().map((item) => ({
              label: item.label,
              value: item.value,
              formattedValue: formatMoney(item.value),
              tone: "warn",
        })),
      },
    },
    stateLens: {
      yearLabel: String(FINAL_YEAR),
      metricLabel: "2024 per-capita personal income",
      explainer:
        "This section adapts the map-style state view into a dashboard lens: pick a state, compare its income position, and read an estimated comfort budget for the American Dream in that environment.",
      profiles: stateDreamProfiles,
      leaders: statePerCapitaList.slice(0, 5).map((item) => ({
        label: item.label,
        value: item.value,
        formattedValue: formatMoney(item.value),
        tone: "good",
        note: "2024 per-capita personal income",
      })),
      laggards: statePerCapitaList
        .slice(-5)
        .reverse()
        .map((item) => ({
          label: item.label,
          value: item.value,
          formattedValue: formatMoney(item.value),
          tone: "warn",
          note: "2024 per-capita personal income",
        })),
    },
    industryDivide: {
      predictedFigure: {
        leaders: industryForecastLeaders,
        laggards: industryForecastLaggards,
        metricLabel: rankingExport ? "3-year predicted American Dream score" : "2024 wage growth index",
        benchmarkLabel: rankingExport
          ? `Uses ${industryRankingYear} and older data; forecast target ${industryRankingYear + (industryRanking?.horizon ?? 3)}`
          : "Indexed to 2000 = 100",
      },
      historicalFigure: {
        leaders: historicalIndustryLeaders,
        laggards: historicalIndustryLaggards,
        metricLabel: `Actual ${FINAL_YEAR} wage per FTE`,
        benchmarkLabel: `${FINAL_YEAR} observed data`,
      },
      degreeComparison: {
        growth2024: [
          {
            label: "Degree-heavy industries",
            value: degreeGrowth[FINAL_YEAR],
            formattedValue: `${formatIndex(degreeGrowth[FINAL_YEAR])} index`,
            tone: classifyGrowth(degreeGrowth[FINAL_YEAR], 220),
            note: "Average wage growth index",
          },
          {
            label: "Non-degree-heavy industries",
            value: nonDegreeGrowth[FINAL_YEAR],
            formattedValue: `${formatIndex(nonDegreeGrowth[FINAL_YEAR])} index`,
            tone: classifyGrowth(nonDegreeGrowth[FINAL_YEAR], 220),
            note: "Average wage growth index",
          },
        ],
        wageLevels2024: [
          {
            label: "Higher-education-heavy median",
            value: medianLevel(degreeHeavy),
            formattedValue: formatMoney(medianLevel(degreeHeavy)),
            tone: "good",
            note: "2024 median annual wages per FTE",
          },
          {
            label: "Non-higher-education-heavy median",
            value: medianLevel(nonDegreeHeavy),
            formattedValue: formatMoney(medianLevel(nonDegreeHeavy)),
            tone: "warn",
            note: "2024 median annual wages per FTE",
          },
        ],
      },
      summary: [
        {
          title: industryRanking ? "The forecast makes the job gap clearer" : "National averages hide job-based differences",
          body: industryRanking
            ? `The forecast figure now uses a 3-year model built from ${industryRankingYear} and older data, projecting forward to ${industryRankingYear + industryRanking.horizon}.`
            : "The strongest wage growth is concentrated in fields like information, finance, and professional services rather than spread evenly across the job market.",
        },
        {
          title: industryRanking ? "Forecasts and real results are shown separately" : "The pay-level gap is bigger than the growth gap",
          body: industryRanking
            ? `The dashboard now pairs the saved ${industryRanking.best_model_name} forecast with an actual ${FINAL_YEAR} wage-level ranking, so prediction and observed data are not mixed into one figure.`
            : "Both degree-heavy and non-degree-heavy groups saw wage growth, but the actual 2024 pay gap between them is still much larger.",
        },
      ],
    },
    housingBurden: {
      burdenChart: toSeries(incomeYears, housingBurdenValues, [
        "Owner-occupied (imputed)",
        "Tenant rent (cash)",
      ]),
      burdenLines: ["Owner-occupied (imputed)", "Tenant rent (cash)"],
      burdenChange: [
        {
          label: "Tenant rent (cash, w.r.t. income)",
          value: housingBurdenValues["Tenant rent (cash)"][FINAL_YEAR],
          formattedValue: `${formatPercent(housingBurdenValues["Tenant rent (cash)"][BASE_YEAR])} to ${formatPercent(
            housingBurdenValues["Tenant rent (cash)"][FINAL_YEAR]
          )}`,
          note: "On $100k income: about $2,700/year to $3,000/year",
          tone: "neutral",
        },
        {
          label: "Owner-occupied (imputed, w.r.t. income)",
          value: housingBurdenValues["Owner-occupied (imputed)"][FINAL_YEAR],
          formattedValue: `${formatPercent(
            housingBurdenValues["Owner-occupied (imputed)"][BASE_YEAR]
          )} to ${formatPercent(housingBurdenValues["Owner-occupied (imputed)"][FINAL_YEAR])}`,
          note: "On $100k income: about $9,000/year to $9,600/year",
          tone: "neutral",
        },
      ],
      rentVsOwnerChart: toSeries(incomeYears, rentOwnerValues, [
        "Tenant rent",
        "Owner-equivalent rent",
        "Median industry wage",
      ]),
      rentVsOwnerLines: ["Tenant rent", "Owner-equivalent rent", "Median industry wage"],
      summary: [
        {
          title: "Monthly rent burden drifted up, it did not break",
          body: "Owner-equivalent rent rose from 9.0% to 9.6% of personal income and cash tenant rent from 2.7% to 3.0% — meaningful drift, but far from a sudden crisis.",
        },
        {
          title: "Rent prices and wages moved in step",
          body: "At 2000 = 100, tenant rent reached ~228, owner-equivalent rent ~207, and the median industry wage ~215. Rent inflation sits on both sides of the income line, not ahead of it.",
        },
        {
          title: "Building costs ran away from income",
          body: "Structure-cost indexes for single-family, multifamily, and manufactured homes rose much faster than the ~215 wage index. That is where entry-to-ownership became harder, not in ongoing rent.",
        },
        {
          title: "Residential investment never regained its 2005 share",
          body: "Residential fixed investment went from 5.6% of personal income (2000) to 8.1% at the 2005 peak, collapsed to 2.8% by 2011, and recovered only to 4.7% in 2024 — supply is still well below the bubble peak.",
        },
      ],
    },
    homeownership: {
      constructionChart: toSeries(incomeYears, constructionValues, [
        "Single-family structures",
        "Multifamily structures",
        "Manufactured homes",
        "Median industry wage",
        "Rent (tenant)",
      ]),
      constructionLines: [
        "Single-family structures",
        "Multifamily structures",
        "Manufactured homes",
        "Median industry wage",
        "Rent (tenant)",
      ],
      residentialShareChart: incomeYears.map((year) => ({
        year,
        share: residentialShare[year],
        shareColor: CATEGORY_COLORS.share,
      })),
      keyMoments: [
        { label: "Starting point", value: formatPercent(residentialShare[BASE_YEAR]), note: String(BASE_YEAR) },
        { label: "Bubble peak", value: formatPercent(residentialShare[2005]), note: "2005" },
        { label: "Post-GFC trough", value: formatPercent(residentialShare[2011]), note: "2011" },
        { label: "2024 level", value: formatPercent(residentialShare[FINAL_YEAR]), note: String(FINAL_YEAR) },
      ],
      summary: [
        {
          title: "Buying a home is where the dream becomes hardest to reach",
          body: `The broader housing affordability reading for 2024 sits at ${affordability2024?.formattedValue ?? "n/a"}, but single-family building costs rose much faster than income and better capture why buying in feels out of reach.`,
        },
        {
          title: "Housing supply still matters",
          body: "Residential investment shows a boom, a collapse, and only a partial recovery, which helps explain why access to ownership still feels constrained.",
        },
      ],
    },
    methodology: {
      workflow: [
        {
          label: "1. Source",
          title: "BEA Interactive Data and downloadable annual tables",
          body: "The project starts from Bureau of Economic Analysis tables downloaded from the BEA Interactive Data application, then stored in `data/original(do not modify)` as Excel workbooks.",
          note: "BEA source: apps.bea.gov/iTable",
        },
        {
          label: "2. Clean",
          title: "Pandas cleaning notebook standardizes the raw tables",
          body: "The repo's `notebooks/Kien/clean.ipynb` uses pandas to read Excel sheets, skip BEA header rows, clean labels, strip footnote markers, and export normalized files into `data/cleaned/*.csv`.",
          note: "Core pattern: `pd.read_excel(...)` -> tidy columns/labels -> `to_csv(...)`",
        },
        {
          label: "3. Analyze",
          title: "Cleaned CSVs are transformed into affordability metrics",
          body: "The analysis layer rebases series to `2000 = 100`, builds weighted cost baskets, computes housing burden shares, and compares income, prices, rent, and home-building costs.",
          note: "Implemented in the repo notebooks plus `frontend/lib/dashboard-data.ts` and `src/ranking/*`",
        },
        {
          label: "4. Output",
          title: "The frontend turns those metrics into the dashboard story",
          body: "The output is this dashboard: KPI cards, line charts, affordability rankings, housing verdicts, and methodology notes. When generated, `outputs/dashboard_rankings.json` adds optional predictive ranking panels.",
          note: "Main frontend assembly: `frontend/lib/dashboard-data.ts` -> `components/american-dream-dashboard.tsx`",
        },
      ],
      sources: [
        "Bureau of Economic Analysis (BEA) Interactive Data portal: `https://apps.bea.gov/`, the original source used to access the national income, consumption, and fixed-investment tables behind this project.",
        "The main cleaned inputs used here are `cleaned_income_with_state.csv`, `cleaned_income_with_region.csv`, `annual_price_indexes_for_PCE.csv`, `annual_Personal_Consumption_Expenditures_by_Function.csv`, `annual_price_indexes_for_private_fixed_investment_in_structures.csv`, `annual_private_fixed_investment_in_structures.csv`, and `annual_wages_per_FTE_by_industry.csv`.",
        "The cleaning trail visible in the repo comes from `notebooks/Kien/clean.ipynb`, which reads BEA Excel workbooks with pandas and writes cleaned outputs into `data/cleaned`.",
        "The exploratory analysis trail is visible in `notebooks/Kien/EDA.ipynb`, where the repo computes income indexes, category affordability, housing burden, renter-versus-owner comparisons, and construction-cost comparisons.",
        "Indexed charts reset each series to `2000 = 100` so growth can be compared directly; a price index tracks how prices changed over time rather than one family's actual bills.",
        rankingExport
          ? "Optional ranking output is loaded from `outputs/dashboard_rankings.json`, generated locally from the repo's American Dream state and industry models."
          : "Optional predictive ranking export can be generated locally with `scripts/export_dashboard_rankings.py`.",
        `This dashboard's final output is a repo-backed frontend built from those cleaned tables and transformations, not a separate external data pull at runtime.`,
      ],
      caveats: [
        "National and industry-level only; not a household budget model.",
        "Does not include taxes, debt, mortgage rates, or local housing markets.",
        "Broad patterns can still hide renter, owner, and regional differences.",
        rankingExport
          ? `Ranking horizons differ: states stay 1-year, industries use a ${industryRanking?.horizon ?? 3}-year forecast.`
          : "Predictive rankings require a separate local export step.",
      ],
      futureWork: [
        "Automate the notebook cleaning flow into a reproducible pipeline.",
        "Add stronger household-reality inputs like taxes, mortgage rates, and home sale prices.",
        "Expand to regional or metro-level affordability differences.",
        "Use more direct mobility measures, such as median household income or education-specific earnings.",
      ],
    },
  };
}
