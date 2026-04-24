import { AmericanDreamDashboard } from "@/components/american-dream-dashboard";
import { getDashboardData } from "@/lib/dashboard-data";

function withArrow(changeLabel: string) {
  return changeLabel.trim().startsWith("+") ? `▲ ${changeLabel}` : `▼ ${changeLabel}`;
}

export default async function HomePage() {
  const data = await getDashboardData();

  const heroKpis = data.overview.kpis.slice(0, 4);
  const topOpportunity = data.overview.affordabilityRankings.slice(0, 5);
  const fastestIncome = data.costOfLiving.stateIncomeContext.topStates.slice(0, 5);
  const industryLeaders = data.industryDivide.predictedFigure.leaders.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f3f0ea] px-4 py-5 text-[#111] md:px-10">
      <div className="mx-auto max-w-7xl border border-black/20 bg-[#fbf9f4] shadow-sm">
        <header className="border-b border-black/20 px-6 py-5 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-black/70">
            <span>The American Dream Report</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{data.title}</h1>
          <p className="mt-3 max-w-4xl text-base text-black/70 md:text-lg">{data.subtitle}</p>
        </header>

        <section className="grid border-b border-black/20 md:grid-cols-4">
          {heroKpis.map((kpi) => (
            <article key={kpi.label} className="border-r border-black/20 p-5 last:border-r-0">
              <p className="text-xs uppercase tracking-wide text-black/60">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
              <p className="mt-1 text-xs text-black/60">{withArrow(kpi.changeLabel)}</p>
            </article>
          ))}
        </section>

        <section className="grid border-b border-black/20 lg:grid-cols-[2fr_1fr]">
          <article className="border-r border-black/20 p-6 md:p-8">
            <h2 className="text-3xl font-semibold leading-tight">Opportunity is not spread equally</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/75">{data.verdict.summary}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {topOpportunity.map((state, idx) => (
                <div key={state.label} className="flex items-center justify-between border-b border-black/10 py-2 text-sm">
                  <span className="font-medium">
                    {idx + 1}. {state.label}
                  </span>
                  <span>{state.formattedValue}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.14em] text-black/60">Featured finding</p>
            <blockquote className="mt-3 text-xl font-medium leading-relaxed text-black/85">“{data.verdict.label}”</blockquote>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-black/60">Method note</p>
            <p className="mt-2 text-sm text-black/75">{data.methodology.caveats[0]}</p>
          </aside>
        </section>

        <section className="grid border-b border-black/20 lg:grid-cols-3">
          <article className="border-r border-black/20 p-6 md:p-8">
            <h3 className="text-xl font-semibold">Fastest income momentum</h3>
            <div className="mt-4 space-y-2">
              {fastestIncome.map((state) => (
                <div key={state.label} className="flex items-center justify-between border-b border-black/10 py-2 text-sm">
                  <span>{state.label}</span>
                  <span className="font-medium">{state.formattedValue}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="border-r border-black/20 p-6 md:p-8">
            <h3 className="text-xl font-semibold">Predicted industry leaders</h3>
            <div className="mt-4 space-y-2">
              {industryLeaders.map((industry) => (
                <div key={industry.label} className="flex items-center justify-between border-b border-black/10 py-2 text-sm">
                  <span>{industry.label}</span>
                  <span className="font-medium">{industry.formattedValue}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="p-6 md:p-8">
            <h3 className="text-xl font-semibold">Housing burden</h3>
            <p className="mt-3 text-sm leading-7 text-black/75">{data.housingBurden.summary[0]?.body}</p>
          </article>
        </section>

        <section className="border-b border-black/20 px-6 py-6 md:px-10">
          <h2 className="text-2xl font-semibold">Explore the full interactive dashboard</h2>
          <p className="mt-2 text-sm text-black/70">
            This keeps the analytics-dashboard interactions intact and accessible below the editorial front page.
          </p>
        </section>

        <div className="px-3 py-3 md:px-5 md:py-5">
          <AmericanDreamDashboard data={data} />
        </div>
      </div>
    </main>
  );
}
