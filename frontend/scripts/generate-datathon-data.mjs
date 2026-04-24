import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "..");
const CLEANED_DIR = path.join(ROOT, "data", "cleaned");
const OUT_DIR = path.join(process.cwd(), "data");
const OUT_FILE = path.join(OUT_DIR, "datathon-summary.json");

const YEAR_START = 2000;
const YEAR_END = 2025;

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? "";
    });
    return row;
  });
}

function toNumber(value) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function yearsInRange(row, start, end) {
  return Object.keys(row)
    .map((k) => Number(k))
    .filter((y) => Number.isFinite(y) && y >= start && y <= end)
    .sort((a, b) => a - b);
}

function pickInflationSeries(rows) {
  const pceRow = rows.find((row) => String(row.category ?? "").includes("Personal consumption expenditures"));
  if (!pceRow) return [];
  const years = yearsInRange(pceRow, YEAR_START, YEAR_END);
  return years
    .map((year) => ({ year, inflationRate: toNumber(pceRow[String(year)]) }))
    .filter((row) => row.inflationRate !== null);
}

function pickHousingSeries(rows) {
  const row = rows.find((item) => String(item.category ?? "").trim().startsWith("Housing output"));
  if (!row) return [];
  const years = yearsInRange(row, YEAR_START, 2024);
  return years
    .map((year) => ({ year, housingPriceIndex: toNumber(row[String(year)]) }))
    .filter((item) => item.housingPriceIndex !== null);
}

function incomeSummaries(rows) {
  const stateRows = rows.filter((row) => String(row.LineCode) === "1");

  const stateIncome2025 = stateRows
    .map((row) => ({
      state: String(row.GeoName ?? "").trim(),
      region: String(row.Region ?? "").trim(),
      income2025: toNumber(row["2025"]),
      income2020: toNumber(row["2020"]),
    }))
    .filter((row) => row.state && row.income2025 !== null && row.income2020 !== null)
    .map((row) => ({
      ...row,
      growthPct: row.income2020 ? ((row.income2025 - row.income2020) / row.income2020) * 100 : 0,
    }));

  const topIncomeStates = [...stateIncome2025]
    .sort((a, b) => (b.income2025 ?? 0) - (a.income2025 ?? 0))
    .slice(0, 10)
    .map((row) => ({ state: row.state, income2025: row.income2025 }));

  const topGrowthStates = [...stateIncome2025]
    .sort((a, b) => (b.growthPct ?? 0) - (a.growthPct ?? 0))
    .slice(0, 10)
    .map((row) => ({ state: row.state, growthPct: Number(row.growthPct.toFixed(1)) }));

  const ranked = [...stateIncome2025]
    .filter((row) => row.income2025 !== null)
    .sort((a, b) => (b.income2025 ?? 0) - (a.income2025 ?? 0));

  const median = ranked.length ? ranked[Math.floor(ranked.length / 2)] : null;

  const regions = new Map();
  for (const row of stateIncome2025) {
    const key = row.region || "Unknown";
    if (!regions.has(key)) {
      regions.set(key, { region: key, total2025: 0, states: 0 });
    }
    const item = regions.get(key);
    item.total2025 += row.income2025;
    item.states += 1;
  }

  const regionAverages = Array.from(regions.values())
    .map((row) => ({
      region: row.region,
      avgIncome2025: Number((row.total2025 / row.states).toFixed(1)),
    }))
    .sort((a, b) => b.avgIncome2025 - a.avgIncome2025);

  return {
    stateIncome2025: topIncomeStates,
    stateGrowthSince2020: topGrowthStates,
    regionAverages,
    medianStateIncome2025: median
      ? {
          state: median.state,
          income2025: median.income2025,
        }
      : null,
    nationalAvgIncome2025: Number(
      (ranked.reduce((sum, row) => sum + (row.income2025 ?? 0), 0) / Math.max(1, ranked.length)).toFixed(1)
    ),
  };
}

function cleanIndustryName(value) {
  return String(value ?? "")
    .trim()
    .replace(/\d+$/g, "")
    .replace(/\\\d+\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function profitByIndustry(rows) {
  const quarterColumns = Object.keys(rows[0] ?? {}).filter((key) => /^\d{4}-Q[1-4]$/.test(key));
  const latestQuarter = quarterColumns.sort().at(-1);
  if (!latestQuarter) return { latestQuarter: null, topIndustries: [] };

  const ignored = new Set([
    "Corporate profits with inventory valuation and capital consumption adjustments",
    "Domestic industries",
    "Rest of the world",
    "Receipts from the rest of the world",
    "Less: Payments to the rest of the world",
    "Corporate profits with inventory valuation adjustment",
    "Financial",
    "Nonfinancial",
    "Other nonfinancial",
    "Federal Reserve banks",
    "Other financial",
  ]);

  const bestValueByIndustry = new Map();

  for (const row of rows) {
    const industry = cleanIndustryName(row.Description);
    const value = toNumber(row[latestQuarter]);
    if (!industry || value === null || ignored.has(industry)) continue;

    if (!bestValueByIndustry.has(industry) || value > bestValueByIndustry.get(industry)) {
      bestValueByIndustry.set(industry, value);
    }
  }

  const rowsWithValues = Array.from(bestValueByIndustry.entries())
    .map(([industry, value]) => ({ industry, value }))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 10);

  return { latestQuarter, topIndustries: rowsWithValues };
}

function main() {
  const income = readCsv(path.join(CLEANED_DIR, "cleaned_income_with_state.csv"));
  const inflation = readCsv(path.join(CLEANED_DIR, "annual_inflation.csv"));
  const housing = readCsv(path.join(CLEANED_DIR, "annual_price_indexes_for_housing_sector_output.csv"));
  const profits = readCsv(path.join(CLEANED_DIR, "corporate_profit_by_industry.csv"));

  const incomeData = incomeSummaries(income);

  const output = {
    generatedAt: new Date().toISOString(),
    sourceFiles: [
      "data/cleaned/cleaned_income_with_state.csv",
      "data/cleaned/annual_inflation.csv",
      "data/cleaned/annual_price_indexes_for_housing_sector_output.csv",
      "data/cleaned/corporate_profit_by_industry.csv",
    ],
    notes: [
      "Data transformed from the AIS datathon notebook source files.",
      "Income values are in millions of dollars.",
      "Inflation values are annual percent change for PCE.",
    ],
    heroStats: {
      averageStateIncome2025: incomeData.nationalAvgIncome2025,
      medianStateIncome2025: incomeData.medianStateIncome2025,
      latestPceInflation: pickInflationSeries(inflation).at(-1)?.inflationRate ?? null,
      latestHousingIndex: pickHousingSeries(housing).at(-1)?.housingPriceIndex ?? null,
      improvingStatesCount: incomeData.stateGrowthSince2020.length,
    },
    charts: {
      inflationTrend: pickInflationSeries(inflation),
      housingTrend: pickHousingSeries(housing),
      topStateIncome2025: incomeData.stateIncome2025,
      fastestGrowingStates: incomeData.stateGrowthSince2020,
      regionIncomeAverages: incomeData.regionAverages,
      industryProfitSnapshot: profitByIndustry(profits),
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();
