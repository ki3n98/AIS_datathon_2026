"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "@/lib/dashboard-data";

type Props = {
  data: DashboardData;
};

type MetricMode = "affordability" | "income";
type EvidenceMode = "chart" | "table";

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function ResearchDesk({ data }: Props) {
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const stateYears = new Set(data.researchDesk.stateYearMetrics.map((row) => row.year));
  const industryYears = new Set(data.researchDesk.industryYearMetrics.map((row) => row.year));
  const defaultYearWithData =
    data.researchDesk.years.find((year) => stateYears.has(year) && industryYears.has(year)) ??
    data.researchDesk.years.find((year) => stateYears.has(year)) ??
    data.researchDesk.defaultYear;
  const requestedYear = toNumber(urlParams?.get("year") || null, defaultYearWithData);
  const initialYear = stateYears.has(requestedYear) || industryYears.has(requestedYear) ? requestedYear : defaultYearWithData;

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedRegion, setSelectedRegion] = useState<string>(urlParams?.get("region") || "All");
  const [selectedState, setSelectedState] = useState<string>(urlParams?.get("state") || "");
  const [selectedIndustry, setSelectedIndustry] = useState<string>(urlParams?.get("industry") || "");
  const [compareMode, setCompareMode] = useState<boolean>(urlParams?.get("compare") === "1");
  const [stateB, setStateB] = useState<string>(urlParams?.get("stateB") || "");
  const [industryB, setIndustryB] = useState<string>(urlParams?.get("industryB") || "");
  const [metricMode, setMetricMode] = useState<MetricMode>((urlParams?.get("metric") as MetricMode) || "affordability");
  const [evidenceMode, setEvidenceMode] = useState<EvidenceMode>((urlParams?.get("view") as EvidenceMode) || "chart");
  const [quickAnswer, setQuickAnswer] = useState<string>("Select a quick question to add a fact-based answer here.");

  const availableStates = useMemo(() => {
    const rowsForYear = data.researchDesk.stateYearMetrics.filter((row) => row.year === selectedYear);
    const regionFiltered = selectedRegion === "All" ? rowsForYear : rowsForYear.filter((row) => row.region === selectedRegion);
    const preferredRows = regionFiltered.length > 0 ? regionFiltered : rowsForYear;
    const candidates = preferredRows.length > 0 ? preferredRows : data.researchDesk.stateYearMetrics;
    return Array.from(new Set(candidates.map((row) => row.state))).sort((a, b) => a.localeCompare(b));
  }, [data.researchDesk.stateYearMetrics, selectedRegion, selectedYear]);

  const availableIndustries = useMemo(() => {
    const rowsForYear = data.researchDesk.industryYearMetrics.filter((row) => row.year === selectedYear);
    const candidates = rowsForYear.length > 0 ? rowsForYear : data.researchDesk.industryYearMetrics;
    return Array.from(new Set(candidates.map((row) => row.industry))).sort((a, b) => a.localeCompare(b));
  }, [data.researchDesk.industryYearMetrics, selectedYear]);

  const effectiveSelectedState = availableStates.includes(selectedState)
    ? selectedState
    : availableStates[0] || data.researchDesk.states[0];
  const effectiveStateB = availableStates.includes(stateB)
    ? stateB
    : availableStates[1] || availableStates[0] || data.researchDesk.states[0];
  const effectiveSelectedIndustry = availableIndustries.includes(selectedIndustry)
    ? selectedIndustry
    : availableIndustries[0] || data.researchDesk.industries[0] || "";
  const effectiveIndustryB = availableIndustries.includes(industryB)
    ? industryB
    : availableIndustries[1] || availableIndustries[0] || data.researchDesk.industries[0] || "";

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("year", String(selectedYear));
    if (selectedRegion !== "All") params.set("region", selectedRegion);
    params.set("state", effectiveSelectedState);
    params.set("industry", effectiveSelectedIndustry);
    if (compareMode) {
      params.set("compare", "1");
      params.set("stateB", effectiveStateB);
      params.set("industryB", effectiveIndustryB);
    }
    params.set("metric", metricMode);
    params.set("view", evidenceMode);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", nextUrl);
  }, [
    compareMode,
    evidenceMode,
    effectiveIndustryB,
    metricMode,
    effectiveSelectedIndustry,
    selectedRegion,
    effectiveSelectedState,
    selectedYear,
    effectiveStateB,
  ]);

  const stateRowsForYear = useMemo(() => {
    const rows = data.researchDesk.stateYearMetrics.filter((row) => row.year === selectedYear);
    const scoped = selectedRegion === "All" ? rows : rows.filter((row) => row.region === selectedRegion);
    return [...scoped].sort((a, b) =>
      metricMode === "affordability" ? b.affordabilityScore - a.affordabilityScore : b.perCapitaIncome - a.perCapitaIncome
    );
  }, [data.researchDesk.stateYearMetrics, metricMode, selectedRegion, selectedYear]);

  const selectedStateSeries = useMemo(
    () => data.researchDesk.stateYearMetrics.filter((row) => row.state === effectiveSelectedState).sort((a, b) => a.year - b.year),
    [data.researchDesk.stateYearMetrics, effectiveSelectedState]
  );

  const compareStateSeries = useMemo(
    () => data.researchDesk.stateYearMetrics.filter((row) => row.state === effectiveStateB).sort((a, b) => a.year - b.year),
    [data.researchDesk.stateYearMetrics, effectiveStateB]
  );

  const selectedIndustrySeries = useMemo(
    () => data.researchDesk.industryYearMetrics.filter((row) => row.industry === effectiveSelectedIndustry).sort((a, b) => a.year - b.year),
    [data.researchDesk.industryYearMetrics, effectiveSelectedIndustry]
  );

  const compareIndustrySeries = useMemo(
    () => data.researchDesk.industryYearMetrics.filter((row) => row.industry === effectiveIndustryB).sort((a, b) => a.year - b.year),
    [data.researchDesk.industryYearMetrics, effectiveIndustryB]
  );

  const selectedStateNow = stateRowsForYear.find((row) => row.state === effectiveSelectedState);
  const compareStateNow = stateRowsForYear.find((row) => row.state === effectiveStateB);

  const selectedIndustryNow = data.researchDesk.industryYearMetrics.find(
    (row) => row.year === selectedYear && row.industry === effectiveSelectedIndustry
  );
  const compareIndustryNow = data.researchDesk.industryYearMetrics.find(
    (row) => row.year === selectedYear && row.industry === effectiveIndustryB
  );

  const chartRows = useMemo(() => {
    return data.researchDesk.years.map((year) => {
      const stateA = selectedStateSeries.find((row) => row.year === year);
      const stateComp = compareStateSeries.find((row) => row.year === year);
      const industryA = selectedIndustrySeries.find((row) => row.year === year);
      const industryComp = compareIndustrySeries.find((row) => row.year === year);

      return {
        year,
        stateA: metricMode === "affordability" ? stateA?.affordabilityScore : stateA?.perCapitaIncome,
        stateB: metricMode === "affordability" ? stateComp?.affordabilityScore : stateComp?.perCapitaIncome,
        industryA: industryA?.wageIndex,
        industryB: industryComp?.wageIndex,
      };
    });
  }, [
    compareIndustrySeries,
    compareStateSeries,
    metricMode,
    selectedIndustrySeries,
    selectedStateSeries,
    data.researchDesk.years,
  ]);

  const resetAll = () => {
    setSelectedYear(defaultYearWithData);
    setSelectedRegion("All");
    setSelectedState("");
    setSelectedIndustry("");
    setCompareMode(false);
    setStateB("");
    setIndustryB("");
    setMetricMode("affordability");
    setEvidenceMode("chart");
    setQuickAnswer("Select a quick question to add a fact-based answer here.");
  };

  const applyQuickQuestion = (kind: "strongest" | "housing" | "industry" | "income") => {
    if (kind === "strongest") {
      const leader = stateRowsForYear[0];
      const runnerUp = stateRowsForYear[1];
      setMetricMode("affordability");
      setEvidenceMode("chart");
      setCompareMode(false);
      setSelectedState(stateRowsForYear[0]?.state || data.researchDesk.states[0]);
      setQuickAnswer(
        leader
          ? `${selectedYear}${selectedRegion === "All" ? "" : ` (${selectedRegion})`}: ${leader.state} has the highest affordability score at ${leader.affordabilityScore.toFixed(1)}${runnerUp ? `, followed by ${runnerUp.state} at ${runnerUp.affordabilityScore.toFixed(1)}` : ""}.`
          : `No state metrics are available for ${selectedYear}${selectedRegion === "All" ? "" : ` in ${selectedRegion}`}.`
      );
      return;
    }
    if (kind === "housing") {
      const first = data.researchDesk.housingYearMetrics[0];
      const current =
        data.researchDesk.housingYearMetrics.find((row) => row.year === selectedYear) ||
        data.researchDesk.housingYearMetrics[data.researchDesk.housingYearMetrics.length - 1];
      const delta = first && current ? current.housingBurdenPct - first.housingBurdenPct : 0;
      setEvidenceMode("table");
      setMetricMode("affordability");
      setQuickAnswer(
        first && current
          ? `National housing burden is ${current.housingBurdenPct.toFixed(1)}% in ${current.year}, ${delta >= 0 ? "up" : "down"} ${Math.abs(delta).toFixed(1)} points from ${first.year} (${first.housingBurdenPct.toFixed(1)}%).`
          : "Housing-burden trend data is unavailable in this snapshot."
      );
      return;
    }
    if (kind === "industry") {
      const industryRowsForYear = data.researchDesk.industryYearMetrics
        .filter((row) => row.year === selectedYear)
        .sort((a, b) => b.wageLevel - a.wageLevel);
      const top = industryRowsForYear[0];
      const second = industryRowsForYear[1];
      setCompareMode(true);
      setEvidenceMode("chart");
      if (top) setSelectedIndustry(top.industry);
      if (second) setIndustryB(second.industry);
      setQuickAnswer(
        top
          ? `${selectedYear}: ${top.industry} leads with an average wage of $${Math.round(top.wageLevel).toLocaleString()}${second ? `, followed by ${second.industry} at $${Math.round(second.wageLevel).toLocaleString()}` : ""}.`
          : `Industry wage data is unavailable for ${selectedYear}.`
      );
      return;
    }

    const stateSeries = data.researchDesk.stateYearMetrics
      .filter((row) => row.state === effectiveSelectedState)
      .sort((a, b) => a.year - b.year);
    const baseline = stateSeries[0];
    const current = stateSeries.find((row) => row.year === selectedYear) || stateSeries[stateSeries.length - 1];
    const incomeGain = current && baseline ? current.incomeIndex - baseline.incomeIndex : 0;
    const costGain = current && baseline ? current.costOfLivingIndex - baseline.costOfLivingIndex : 0;

    setMetricMode("income");
    setEvidenceMode("chart");
    setQuickAnswer(
      baseline && current
        ? `${effectiveSelectedState}: from ${baseline.year} to ${current.year}, income index changed ${incomeGain >= 0 ? "+" : ""}${incomeGain.toFixed(1)} and cost-of-living index changed ${costGain >= 0 ? "+" : ""}${costGain.toFixed(1)}. ${incomeGain >= costGain ? "Income outpaced costs." : "Costs rose faster than income."}`
        : `Income-versus-cost trend is unavailable for ${effectiveSelectedState}.`
    );
  };

  const deltaState = compareMode && selectedStateNow && compareStateNow ? selectedStateNow.perCapitaIncome - compareStateNow.perCapitaIncome : null;
  const deltaIndustry =
    compareMode && selectedIndustryNow && compareIndustryNow ? selectedIndustryNow.wageLevel - compareIndustryNow.wageLevel : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-4 border border-[#ced4dc] bg-white p-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#607080]">Quick questions</p>
          <div className="mt-2 grid gap-2">
            <button className="dash-btn" onClick={() => applyQuickQuestion("strongest")}>Which states are strongest?</button>
            <button className="dash-btn" onClick={() => applyQuickQuestion("housing")}>Where is housing burden rising?</button>
            <button className="dash-btn" onClick={() => applyQuickQuestion("industry")}>Which industries lead?</button>
            <button className="dash-btn" onClick={() => applyQuickQuestion("income")}>Did income outpace costs?</button>
          </div>
          <div className="mt-3 rounded border border-[#dbe3ea] bg-[#f8fafc] p-3">
            <p className="text-[11px] uppercase tracking-[0.1em] text-[#607080]">Answer</p>
            <p className="mt-2 text-sm text-[#1f2937]">{quickAnswer}</p>
          </div>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="grid gap-3 border border-[#ced4dc] bg-white p-4 xl:grid-cols-9">
          <label className="dash-field xl:col-span-1">
            <span>Year</span>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {data.researchDesk.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="dash-field xl:col-span-1">
            <span>Region</span>
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              <option value="All">All</option>
              {data.researchDesk.regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>

          <label className="dash-field xl:col-span-2">
            <span>State A</span>
            <select value={effectiveSelectedState} onChange={(e) => setSelectedState(e.target.value)}>
              {availableStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>

          <label className="dash-field xl:col-span-2">
            <span>Industry A</span>
            <select value={effectiveSelectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)}>
              {availableIndustries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>

          <label className="dash-field xl:col-span-1">
            <span>Metric</span>
            <select value={metricMode} onChange={(e) => setMetricMode(e.target.value as MetricMode)}>
              <option value="affordability">Affordability</option>
              <option value="income">Income</option>
            </select>
          </label>

          <div className="flex flex-wrap items-end justify-start gap-2 xl:col-span-2 xl:justify-end">
            <button className="dash-btn shrink-0" onClick={() => setCompareMode((prev) => !prev)}>
              {compareMode ? "Compare: On" : "Compare: Off"}
            </button>
            <button className="dash-btn shrink-0" onClick={resetAll}>
              Reset
            </button>
          </div>

          {compareMode ? (
            <>
              <label className="dash-field xl:col-span-2">
                <span>State B</span>
                <select value={effectiveStateB} onChange={(e) => setStateB(e.target.value)}>
                  {availableStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dash-field xl:col-span-2">
                <span>Industry B</span>
                <select value={effectiveIndustryB} onChange={(e) => setIndustryB(e.target.value)}>
                  {availableIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Kpi label="Selected state" value={selectedStateNow?.state || "-"} sub={selectedStateNow?.region || "-"} />
          <Kpi
            label={metricMode === "affordability" ? "Affordability score" : "Per-capita income"}
            value={
              metricMode === "affordability"
                ? `${(selectedStateNow?.affordabilityScore || 0).toFixed(1)}`
                : `$${Math.round(selectedStateNow?.perCapitaIncome || 0).toLocaleString()}`
            }
            sub={`Year ${selectedYear}`}
          />
          <Kpi
            label="Selected industry wage"
            value={`$${Math.round(selectedIndustryNow?.wageLevel || 0).toLocaleString()}`}
            sub={`${effectiveSelectedIndustry || "-"} (${selectedYear})`}
          />
          <Kpi
            label="Compare deltas"
            value={
              compareMode
                ? `${deltaState ? `${deltaState >= 0 ? "+" : ""}$${Math.round(deltaState).toLocaleString()}` : "-"} · ${
                    deltaIndustry ? `${deltaIndustry >= 0 ? "+" : ""}$${Math.round(deltaIndustry).toLocaleString()}` : "-"
                  }`
                : "Enable compare mode"
            }
            sub="State income Δ · Industry wage Δ"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="border border-[#ced4dc] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0f172a]">Main evidence chart</p>
              <div className="flex gap-2">
                <button className={`dash-btn ${evidenceMode === "chart" ? "dash-btn-active" : ""}`} onClick={() => setEvidenceMode("chart")}>Chart</button>
                <button className={`dash-btn ${evidenceMode === "table" ? "dash-btn-active" : ""}`} onClick={() => setEvidenceMode("table")}>Table</button>
              </div>
            </div>

            {evidenceMode === "chart" ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="stateA" stroke="#0f172a" dot={false} name={effectiveSelectedState} />
                    {compareMode ? <Line type="monotone" dataKey="stateB" stroke="#7c3aed" dot={false} name={effectiveStateB} /> : null}
                    <Line type="monotone" dataKey="industryA" stroke="#0f766e" dot={false} name={`${effectiveSelectedIndustry || "Industry A"} wage index`} />
                    {compareMode ? <Line type="monotone" dataKey="industryB" stroke="#ea580c" dot={false} name={`${effectiveIndustryB || "Industry B"} wage index`} /> : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-left text-xs uppercase tracking-[0.08em] text-[#64748b]">
                      <th className="py-2">State</th>
                      <th className="py-2">Region</th>
                      <th className="py-2">Income</th>
                      <th className="py-2">Affordability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateRowsForYear.slice(0, 15).map((row) => (
                      <tr key={row.state} className="border-b border-[#f1f5f9]">
                        <td className="py-2">{row.state}</td>
                        <td className="py-2">{row.region}</td>
                        <td className="py-2">${Math.round(row.perCapitaIncome).toLocaleString()}</td>
                        <td className="py-2">{row.affordabilityScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="border border-[#ced4dc] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#0f172a]">Geography explorer (linked)</p>
              <div className="space-y-2">
                {stateRowsForYear.slice(0, 12).map((row) => (
                  <button
                    key={row.state}
                    className={`w-full text-left rounded border px-2 py-2 text-sm ${effectiveSelectedState === row.state ? "border-[#0f172a] bg-[#f8fafc]" : "border-[#e2e8f0]"}`}
                    onClick={() => setSelectedState(row.state)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{row.state}</span>
                      <span className="font-medium">{metricMode === "affordability" ? row.affordabilityScore.toFixed(1) : `$${Math.round(row.perCapitaIncome).toLocaleString()}`}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded bg-[#e2e8f0]">
                      <div
                        className="h-1.5 rounded bg-[#0f172a]"
                        style={{ width: `${Math.min(100, (row.affordabilityScore / (stateRowsForYear[0]?.affordabilityScore || 1)) * 100)}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-[#ced4dc] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#0f172a]">Drill-down panel</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedStateSeries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={metricMode === "affordability" ? "affordabilityScore" : "perCapitaIncome"} fill="#334155" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-[#64748b]">Selecting a state in the explorer updates this panel, KPI row, and main evidence view.</p>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`
        .dash-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dash-field > span {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          font-family: var(--font-ui);
        }
        .dash-field select {
          border: 1px solid #cbd5e1;
          background: white;
          padding: 8px;
          font-size: 13px;
        }
        .dash-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          padding: 8px 10px;
          font-size: 12px;
          font-family: var(--font-ui);
          white-space: nowrap;
        }
        .dash-btn-active {
          background: #0f172a;
          border-color: #0f172a;
          color: white;
        }
      `}</style>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-[#ced4dc] bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#64748b] font-[var(--font-ui)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[#0f172a]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{sub}</p>
    </div>
  );
}
