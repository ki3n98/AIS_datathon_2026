import data from "@/data/dashboard-data.json";
import type { DashboardData } from "@/lib/dashboard-data";
import {
  DashboardTeaser,
  EditionLine,
  EditorialLineChart,
  FigureBlock,
  KpiRail,
  LeadPackage,
  Masthead,
  MethodologyNote,
  SectionDivider,
  StoryRail,
  StorySection,
} from "@/components/editorial";

const dashboardData = data as DashboardData;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f3f0ea] px-4 py-5 text-[#111] md:px-10">
      <div className="mx-auto max-w-7xl space-y-6 border border-black/20 bg-[#fbf9f4] p-6 shadow-sm md:p-8">
        <Masthead title={dashboardData.title} subtitle={dashboardData.subtitle} />
        <EditionLine editionDate={dashboardData.edition.editionDateLabel} />

        <LeadPackage verdict={dashboardData.verdict} railItems={dashboardData.overview.affordabilityRankings} />
        <KpiRail items={dashboardData.overview.kpis} />

        <SectionDivider
          kicker="National trend"
          title="Income growth and cost pressure moved together"
          deck="The long-run shape of affordability combines income momentum and cost escalation. This figure frames the core tension behind modern household mobility."
        />
        <StorySection>
          <FigureBlock
            title="Figure 1. Comparative index movement"
            caption="Indexed series comparing per-capita income and major cost tracks."
            source={dashboardData.methodology.sources[0] ?? "BEA/NIPA extracts"}
          >
            <EditorialLineChart data={dashboardData.overview.comparisonChart} lines={dashboardData.overview.comparisonLines} />
          </FigureBlock>
          <StoryRail
            title="Fastest growth since 2020"
            items={dashboardData.costOfLiving.stateIncomeContext.topStates}
            valueLabel="Income growth percentage"
          />
        </StorySection>

        <SectionDivider
          kicker="Cost of living"
          title="Affordability remains highly geography-sensitive"
          deck={dashboardData.costOfLiving.insightCards[0]?.body}
        />
        <StorySection>
          <FigureBlock
            title="Figure 2. Cost-of-living pressure by category"
            caption="Core inflation-related categories and their trajectory over the period."
            source={dashboardData.methodology.sources[1] ?? "BEA price indexes"}
          >
            <EditorialLineChart data={dashboardData.costOfLiving.chart} lines={dashboardData.costOfLiving.lines} />
          </FigureBlock>
          <StoryRail
            title="Most constrained states"
            items={dashboardData.costOfLiving.stateIncomeContext.bottomStates}
            valueLabel="Lower per-capita income"
          />
        </StorySection>

        <SectionDivider
          kicker="Industry divide"
          title="Industry pathways diverge on earnings power"
          deck={dashboardData.industryDivide.summary[0]?.body}
        />
        <StorySection>
          <FigureBlock
            title="Figure 3. Housing burden trajectory"
            caption="Burden metrics show housing cost pressure rising relative to household earning power."
            source={dashboardData.methodology.sources[2] ?? "Housing output indexes"}
          >
            <EditorialLineChart data={dashboardData.housingBurden.burdenChart} lines={dashboardData.housingBurden.burdenLines} percent />
          </FigureBlock>
          <StoryRail
            title="Predicted industry leaders"
            items={dashboardData.industryDivide.predictedFigure.leaders}
            valueLabel={dashboardData.industryDivide.predictedFigure.metricLabel}
          />
        </StorySection>

        <MethodologyNote caveats={dashboardData.methodology.caveats} sources={dashboardData.methodology.sources} />
        <DashboardTeaser summary="Use the research desk to filter, compare, and validate every claim in this feature story." />
      </div>
    </main>
  );
}
