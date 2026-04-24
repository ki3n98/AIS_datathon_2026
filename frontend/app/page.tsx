"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import datathon from "@/data/datathon-summary.json";

type TrendPoint = { year: number; inflationRate?: number; housingPriceIndex?: number };
type IncomePoint = { state: string; income2025?: number; growthPct?: number };

function fmtNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "-";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${suffix}`;
}

export default function Page() {
  const [trendMode, setTrendMode] = useState<"inflation" | "housing">("inflation");
  const [rankMode, setRankMode] = useState<"income" | "growth">("income");

  const trendData = useMemo<TrendPoint[]>(
    () => (trendMode === "inflation" ? datathon.charts.inflationTrend : datathon.charts.housingTrend),
    [trendMode]
  );

  const rankData = useMemo<IncomePoint[]>(
    () => (rankMode === "income" ? datathon.charts.topStateIncome2025 : datathon.charts.fastestGrowingStates),
    [rankMode]
  );

  const trendKey = trendMode === "inflation" ? "inflationRate" : "housingPriceIndex";
  const trendLabel = trendMode === "inflation" ? "PCE inflation (%)" : "Housing index (2017=100)";

  return (
    <main className="min-h-screen bg-[#f5f3ee] px-4 py-6 text-[#1f1f1f] md:px-10">
      <div className="mx-auto max-w-6xl border border-black/20 bg-[#fcfbf8] shadow-sm">
        <header className="border-b border-black/20 px-6 py-5 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-black/70">
            <span>The American Dream Report</span>
            <span>{new Date(datathon.generatedAt).toLocaleDateString()}</span>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Where the American Dream Still Thrives
          </h1>
          <p className="mt-4 max-w-3xl text-base text-black/75">
            Interactive newspaper built with Next.js using metrics transformed from the AIS datathon notebook data.
          </p>
        </header>

        <section className="grid gap-0 border-b border-black/20 md:grid-cols-4">
          <Stat label="Avg. state income (2025)" value={`$${fmtNumber(datathon.heroStats.averageStateIncome2025)}M`} />
          <Stat
            label="Median state in 2025"
            value={datathon.heroStats.medianStateIncome2025?.state ?? "-"}
            sub={`$${fmtNumber(datathon.heroStats.medianStateIncome2025?.income2025)}M`}
          />
          <Stat label="Latest inflation" value={fmtNumber(datathon.heroStats.latestPceInflation, "%")} />
          <Stat label="Latest housing index" value={fmtNumber(datathon.heroStats.latestHousingIndex)} />
        </section>

        <section className="grid border-b border-black/20 lg:grid-cols-[2fr_1fr]">
          <article className="border-r border-black/20 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">Story of the nation</h2>
              <select
                value={trendMode}
                onChange={(e) => setTrendMode(e.target.value as "inflation" | "housing")}
                className="rounded border border-black/30 bg-white px-2 py-1 text-sm"
              >
                <option value="inflation">Inflation trend</option>
                <option value="housing">Housing trend</option>
              </select>
            </div>
            <p className="mb-5 text-sm text-black/70">
              From 2000 onward, affordability pressure appears in both inflation and housing data. Toggle the chart to compare them.
            </p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 8, right: 8, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#c7c0b8" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={50} />
                  <Tooltip />
                  <Line type="monotone" dataKey={trendKey} stroke="#1f1f1f" strokeWidth={2.5} dot={false} name={trendLabel} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <aside className="p-6 md:p-8">
            <h3 className="text-xl font-semibold">Featured finding</h3>
            <p className="mt-3 text-sm leading-6 text-black/75">
              “The American Dream is not gone. It is increasingly geography-sensitive.”
            </p>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-black/80">
              <li>Highest 2025 total incomes cluster in large coastal and southern economies.</li>
              <li>Fastest growth since 2020 is led by Sun Belt and Mountain West states.</li>
              <li>Housing index climbed from 63.9 (2000) to 135.3 (2024).</li>
            </ul>
          </aside>
        </section>

        <section className="grid border-b border-black/20 lg:grid-cols-2">
          <article className="border-r border-black/20 p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold">America by the numbers</h2>
              <select
                value={rankMode}
                onChange={(e) => setRankMode(e.target.value as "income" | "growth")}
                className="rounded border border-black/30 bg-white px-2 py-1 text-sm"
              >
                <option value="income">Top state income (2025)</option>
                <option value="growth">Fastest growth since 2020</option>
              </select>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankData} layout="vertical" margin={{ left: 10, right: 20, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#c7c0b8" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="state" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey={rankMode === "income" ? "income2025" : "growthPct"} fill="#2f3e46" radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Industry snapshot ({datathon.charts.industryProfitSnapshot.latestQuarter})</h2>
            <p className="mt-2 text-sm text-black/70">Top corporate profit categories (billions) in the latest quarter.</p>
            <div className="mt-4 space-y-2">
              {datathon.charts.industryProfitSnapshot.topIndustries.slice(0, 8).map((item) => (
                <div key={item.industry} className="flex items-center justify-between border-b border-black/10 py-2 text-sm">
                  <span>{item.industry}</span>
                  <span className="font-medium">${fmtNumber(item.value)}B</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="px-6 py-5 text-xs text-black/70 md:px-10">
          Sources: {datathon.sourceFiles.join(" · ")}.
        </footer>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-r border-black/20 p-5 last:border-r-0">
      <div className="text-xs uppercase tracking-wide text-black/60">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-sm text-black/65">{sub}</div> : null}
    </div>
  );
}
