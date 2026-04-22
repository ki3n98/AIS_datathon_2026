import { promises as fs } from "node:fs";
import path from "node:path";
import Papa from "papaparse";

type CsvRow = Record<string, string>;

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
  industryDivide: {
    chart: SeriesPoint[];
    lines: string[];
    topIndustries: RankedMetric[];
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
    sources: string[];
    caveats: string[];
  };
};

const DATA_DIR = path.join(process.cwd(), "..", "data", "cleaned");
const BASE_YEAR = 2000;
const FINAL_YEAR = 2024;

const CATEGORY_COLORS = {
  "Per-capita income": "#0b7a75",
  "Overall cost of living (PCE)": "#7c8796",
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

export async function getDashboardData(): Promise<DashboardData> {
  const [incomeRows, priceRows, spendingRows, wageRows, constructionRows, residentialRows] = await Promise.all([
    readCsv("cleaned_income_with_state.csv"),
    readCsv("annual_price_indexes_for_PCE.csv"),
    readCsv("annual_Personal_Consumption_Expenditures_by_Function.csv"),
    readCsv("annual_wages_per_FTE_by_industry.csv"),
    readCsv("annual_price_indexes_for_private_fixed_investment_in_structures.csv"),
    readCsv("annual_private_fixed_investment_in_structures.csv"),
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
  const incomeIndex = Object.fromEntries(
    incomeYears.map((year) => [year, (perCapitaIncome[year] / perCapitaIncome[BASE_YEAR]) * 100])
  );

  const pricesByCategory = new Map<string, CsvRow>();
  for (const row of priceRows) {
    pricesByCategory.set(cleanCategory(row.category), row);
  }

  const overviewPicks: Record<string, string> = {
    "Personal consumption expenditures": "Overall cost of living (PCE)",
    Housing: "Housing",
    "Rental of tenant-occupied nonfarm housing": "Rent (tenant)",
    Health: "Healthcare",
    "Higher education": "Higher education",
    "Food and nonalcoholic beverages purchased for off-premises consumption": "Groceries",
  };

  const overviewValues: Record<string, Record<number, number>> = {
    "Per-capita income": incomeIndex,
  };

  for (const [source, label] of Object.entries(overviewPicks)) {
    const row = pricesByCategory.get(source);
    if (!row) continue;
    overviewValues[label] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100])
    );
  }

  const overviewOrder = [
    "Per-capita income",
    "Overall cost of living (PCE)",
    "Housing",
    "Rent (tenant)",
    "Healthcare",
    "Higher education",
    "Groceries",
  ];

  const affordabilityRankings = overviewOrder
    .filter((label) => label !== "Per-capita income")
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

  const wagesByIndustry = new Map<string, CsvRow>();
  for (const row of wageRows) {
    wagesByIndustry.set(cleanCategory(row.industry), row);
  }

  const industryPicks = [
    "Private industries",
    "Information",
    "Finance and insurance",
    "Professional, scientific, and technical services",
    "Educational services",
    "Construction",
    "Retail trade",
    "Accommodation and food services",
  ];

  const wageYears = Array.from({ length: FINAL_YEAR - BASE_YEAR + 1 }, (_, index) => BASE_YEAR + index);
  const industryGrowthValues: Record<string, Record<number, number>> = {};
  for (const industry of industryPicks) {
    const row = wagesByIndustry.get(industry);
    if (!row) continue;
    const baseline = toNumber(row[String(BASE_YEAR)]);
    industryGrowthValues[industry] = Object.fromEntries(
      wageYears.map((year) => [year, (toNumber(row[String(year)]) / baseline) * 100])
    );
  }
  industryGrowthValues["Overall cost of living (PCE)"] = overviewValues["Overall cost of living (PCE)"];

  const industryGrowthLatest = industryPicks
    .map((industry) => {
      const value = industryGrowthValues[industry][FINAL_YEAR];
      return {
        label: industry,
        value,
        formattedValue: `${formatIndex(value)} index`,
        tone: classifyGrowth(value),
        note: value >= overviewValues["Overall cost of living (PCE)"][FINAL_YEAR] ? "Beat broad inflation" : "Lagged broad inflation",
      };
    })
    .sort((a, b) => b.value - a.value);

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

  function meanIndex(members: string[]): Record<number, number> {
    return Object.fromEntries(
      wageYears.map((year) => {
        const mean =
          members.reduce((sum, industry) => {
            const row = wagesByIndustry.get(industry);
            if (!row) return sum;
            return sum + (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100;
          }, 0) / members.length;
        return [year, mean];
      })
    );
  }

  function meanLevel(members: string[]): number {
    return (
      members.reduce((sum, industry) => sum + toNumber(wagesByIndustry.get(industry)?.[String(FINAL_YEAR)]), 0) /
      members.length
    );
  }

  const degreeGrowth = meanIndex(degreeHeavy);
  const nonDegreeGrowth = meanIndex(nonDegreeHeavy);

  const spendingByCategory = new Map<string, CsvRow>();
  for (const row of spendingRows) {
    spendingByCategory.set(cleanCategory(row.category), row);
  }

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
    "Per-capita income": incomeIndex,
    "Overall cost of living (PCE)": overviewValues["Overall cost of living (PCE)"],
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
  const constructionPicks = ["Residential", "Single-family structures", "Multifamily structures", "Manufactured homes"];
  const constructionValues: Record<string, Record<number, number>> = {
    "Per-capita income": incomeIndex,
    "Rent (tenant)": overviewValues["Rent (tenant)"],
  };
  for (const category of constructionPicks) {
    const row = constructionByCategory.get(category);
    if (!row) continue;
    constructionValues[category] = Object.fromEntries(
      incomeYears.map((year) => [year, (toNumber(row[String(year)]) / toNumber(row[String(BASE_YEAR)])) * 100])
    );
  }

  const residentialByCategory = new Map<string, CsvRow>();
  for (const row of residentialRows) {
    residentialByCategory.set(cleanCategory(row.category), row);
  }
  const residential = residentialByCategory.get("Residential");
  const residentialShare = Object.fromEntries(
    incomeYears.map((year) => [year, (toNumber(residential?.[String(year)]) / totalIncomeByYear[year]) * 100])
  );

  const statePerCapita2024 = incomeRows
    .filter((row) => row.Region && row.GeoName && !row.GeoName.includes("United States"))
    .reduce<Record<string, { income?: number; population?: number }>>((acc, row) => {
      const state = row.GeoName;
      const entry = acc[state] ?? {};
      if (toNumber(row.LineCode) === 1) entry.income = toNumber(row[String(FINAL_YEAR)]);
      if (toNumber(row.LineCode) === 2) entry.population = toNumber(row[String(FINAL_YEAR)]);
      acc[state] = entry;
      return acc;
    }, {});

  const statePerCapitaList = Object.entries(statePerCapita2024)
    .map(([label, entry]) => ({
      label,
      value: entry.income && entry.population ? (entry.income * 1_000_000) / entry.population : 0,
    }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  const medianState = statePerCapitaList[Math.floor(statePerCapitaList.length / 2)];
  const topState = statePerCapitaList[0];
  const bottomState = statePerCapitaList[statePerCapitaList.length - 1];

  const pce2024 = overviewValues["Overall cost of living (PCE)"][FINAL_YEAR];
  const singleFamily2024 = constructionValues["Single-family structures"][FINAL_YEAR];
  const affordability2024 = affordabilityRankings.find((item) => item.label === "Housing");

  return {
    title: "Is the American Dream Still Achievable?",
    subtitle:
      "A national analytics view of income growth, cost pressure, wage dispersion, and the widening ownership threshold from 2000 to 2024.",
    sidebar: [
      { id: "overview", label: "Overview", summary: "Macro trend and 2024 affordability snapshot." },
      { id: "cost-of-living", label: "Cost of Living", summary: "Income versus major household cost categories." },
      { id: "industry-divide", label: "Industry Divide", summary: "Wage growth separates degree-heavy and service sectors." },
      { id: "housing-burden", label: "Housing Burden", summary: "Monthly burden stayed tighter than ownership access." },
      { id: "homeownership", label: "Homeownership", summary: "Construction costs outran wages and income." },
      { id: "methodology", label: "Methodology", summary: "Repo-backed sources, transformations, and caveats." },
    ],
    verdict: {
      label: "Mixed",
      summary: "Broad income growth outpaced overall inflation, but ownership access and mobility-linked categories moved against typical workers.",
    },
    overview: {
      summaryCards: [
        {
          label: "Primary signal",
          value: "Income beat broad prices",
          note: `Per-capita income reached ${formatIndex(incomeIndex[FINAL_YEAR])} versus ${formatIndex(pce2024)} for overall PCE.`,
        },
        {
          label: "Pressure point",
          value: "Housing and education pulled away",
          note: "Higher education and the housing-related price indexes were the weakest affordability readings in 2024.",
        },
        {
          label: "Ownership read",
          value: "Buying in is the break",
          note: `Single-family construction costs reached ${formatIndex(singleFamily2024)}, far above income growth.`,
        },
      ],
      kpis: [
        {
          label: "Income index",
          value: formatIndex(incomeIndex[FINAL_YEAR]),
          changeLabel: "2000 = 100",
          note: "National per-capita income",
          tone: "good",
        },
        {
          label: "Overall PCE index",
          value: formatIndex(pce2024),
          changeLabel: "2000 = 100",
          note: "Broad cost of living",
          tone: incomeIndex[FINAL_YEAR] > pce2024 ? "warn" : "bad",
        },
        {
          label: "Single-family cost index",
          value: formatIndex(singleFamily2024),
          changeLabel: "2000 = 100",
          note: "Build-cost pressure",
          tone: classifyGap(singleFamily2024 - incomeIndex[FINAL_YEAR]),
        },
        {
          label: "Dashboard verdict",
          value: "Mixed",
          changeLabel: "2024 conclusion",
          note: "Day-to-day consumption held up better than ownership entry.",
          tone: "warn",
        },
      ],
      comparisonChart: toSeries(incomeYears, overviewValues, overviewOrder),
      comparisonLines: overviewOrder,
      affordabilityRankings,
    },
    costOfLiving: {
      chart: toSeries(incomeYears, overviewValues, overviewOrder),
      lines: overviewOrder,
      insightCards: [
        {
          title: "Aggregate affordability still exists",
          body: "National income outpaced broad PCE growth, so the dashboard should not claim a universal collapse in purchasing power.",
        },
        {
          title: "Mobility-linked categories did worse",
          body: "The weakest affordability readings come from higher education and housing-related price indexes, not groceries or aggregate spending.",
        },
      ],
      stateIncomeContext: {
        nationalPerCapita2024: formatMoney(perCapitaIncome[FINAL_YEAR]),
        spread: `${formatMoney(topState?.value ?? 0)} vs ${formatMoney(bottomState?.value ?? 0)}`,
        medianState: `${medianState?.label ?? "Median state"} at ${formatMoney(medianState?.value ?? 0)}`,
        topStates: statePerCapitaList.slice(0, 5).map((item) => ({
          label: item.label,
          value: item.value,
          formattedValue: formatMoney(item.value),
          tone: "good",
        })),
        bottomStates: statePerCapitaList.slice(-5).reverse().map((item) => ({
          label: item.label,
          value: item.value,
          formattedValue: formatMoney(item.value),
          tone: "warn",
        })),
      },
    },
    industryDivide: {
      chart: toSeries(wageYears, industryGrowthValues, [
        "Private industries",
        "Information",
        "Finance and insurance",
        "Professional, scientific, and technical services",
        "Educational services",
        "Construction",
        "Retail trade",
        "Accommodation and food services",
        "Overall cost of living (PCE)",
      ]),
      lines: [
        "Private industries",
        "Information",
        "Finance and insurance",
        "Professional, scientific, and technical services",
        "Educational services",
        "Construction",
        "Retail trade",
        "Accommodation and food services",
        "Overall cost of living (PCE)",
      ],
      topIndustries: industryGrowthLatest,
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
            label: "Degree-heavy average",
            value: meanLevel(degreeHeavy),
            formattedValue: formatMoney(meanLevel(degreeHeavy)),
            tone: "good",
            note: "2024 mean annual wages per FTE",
          },
          {
            label: "Non-degree-heavy average",
            value: meanLevel(nonDegreeHeavy),
            formattedValue: formatMoney(meanLevel(nonDegreeHeavy)),
            tone: "warn",
            note: "2024 mean annual wages per FTE",
          },
        ],
      },
      summary: [
        {
          title: "Macro averages hide labor-market sorting",
          body: "The strongest indexed wage gains are concentrated in information, finance, and professional services rather than across the full job market.",
        },
        {
          title: "Growth gap is smaller than level gap",
          body: "Degree-heavy and non-degree-heavy buckets both grew, but the 2024 wage-level spread remains much larger than the index spread.",
        },
      ],
    },
    housingBurden: {
      burdenChart: toSeries(incomeYears, housingBurdenValues, [
        "All housing + utilities",
        "Owner-occupied (imputed)",
        "Tenant rent (cash)",
      ]),
      burdenLines: ["All housing + utilities", "Owner-occupied (imputed)", "Tenant rent (cash)"],
      burdenChange: [
        {
          label: "All housing + utilities",
          value: housingBurdenValues["All housing + utilities"][FINAL_YEAR],
          formattedValue: `${formatPercent(housingBurdenValues["All housing + utilities"][BASE_YEAR])} to ${formatPercent(
            housingBurdenValues["All housing + utilities"][FINAL_YEAR]
          )}`,
          tone: "neutral",
        },
        {
          label: "Tenant rent (cash)",
          value: housingBurdenValues["Tenant rent (cash)"][FINAL_YEAR],
          formattedValue: `${formatPercent(housingBurdenValues["Tenant rent (cash)"][BASE_YEAR])} to ${formatPercent(
            housingBurdenValues["Tenant rent (cash)"][FINAL_YEAR]
          )}`,
          tone: "neutral",
        },
        {
          label: "Owner-occupied (imputed)",
          value: housingBurdenValues["Owner-occupied (imputed)"][FINAL_YEAR],
          formattedValue: `${formatPercent(
            housingBurdenValues["Owner-occupied (imputed)"][BASE_YEAR]
          )} to ${formatPercent(housingBurdenValues["Owner-occupied (imputed)"][FINAL_YEAR])}`,
          tone: "neutral",
        },
      ],
      rentVsOwnerChart: toSeries(incomeYears, rentOwnerValues, [
        "Tenant rent",
        "Owner-equivalent rent",
        "Per-capita income",
        "Overall cost of living (PCE)",
      ]),
      rentVsOwnerLines: ["Tenant rent", "Owner-equivalent rent", "Per-capita income", "Overall cost of living (PCE)"],
      summary: [
        {
          title: "Monthly burden stayed narrower than the public narrative",
          body: "Housing and utility spending as a share of personal income stayed within a tighter range than the ownership story would suggest.",
        },
        {
          title: "Renting and buying are different questions",
          body: "Tenant rent tracked income more closely than construction costs did, so entry into ownership is the sharper affordability break.",
        },
      ],
    },
    homeownership: {
      constructionChart: toSeries(incomeYears, constructionValues, [
        "Single-family structures",
        "Multifamily structures",
        "Manufactured homes",
        "Per-capita income",
        "Rent (tenant)",
      ]),
      constructionLines: [
        "Single-family structures",
        "Multifamily structures",
        "Manufactured homes",
        "Per-capita income",
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
          title: "Ownership is where the dream fractures",
          body: `Within the dashboard's broad housing-services affordability measure, 2024 sits at ${affordability2024?.formattedValue ?? "n/a"}, while single-family construction costs rose much faster than income and better capture the ownership-entry squeeze.`,
        },
        {
          title: "Supply context matters",
          body: "Residential investment share shows a boom, collapse, and partial recovery pattern, which helps explain why ownership access feels structurally constrained.",
        },
      ],
    },
    methodology: {
      sources: [
        "All values are drawn from CSVs in `data/cleaned`, using the same BEA-backed repo datasets already prepared for analysis.",
        "Income is constructed as total personal income divided by total population from `cleaned_income_with_state.csv`.",
        "Indexed charts rebase each series to 2000 = 100 so growth rates can be compared directly; several widgets use BEA price indexes rather than market-price series.",
      ],
      caveats: [
        "This is a national and industry-level dashboard. It does not model taxes, debt, household composition, or local housing markets.",
        "The state widget is context only. It shows per-capita income dispersion, not a full state affordability model.",
        "No external APIs, web-fetched figures, home-price data, or mortgage assumptions are introduced in this dashboard.",
      ],
    },
  };
}
