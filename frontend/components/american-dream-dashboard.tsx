"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CircleDollarSign, Home, ScrollText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardData, RankedMetric, SeriesPoint, Tone } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type DashboardProps = {
  data: DashboardData;
};

const toneBadgeStyles: Record<Tone, string> = {
  good: "border-[#b8dbd6] bg-[#eaf7f5] text-[#0a5c63]",
  warn: "border-[#ebd6a1] bg-[#fbf6e6] text-[#7d5b12]",
  bad: "border-[#e3c0b2] bg-[#f8ede8] text-[#8b4d32]",
  neutral: "border-[#d9dde3] bg-[#f4f6f8] text-[#4a5565]",
};

const toneRowStyles: Record<Tone, string> = {
  good: "bg-[#f7fcfb]",
  warn: "bg-[#fffcf3]",
  bad: "bg-[#fdf7f4]",
  neutral: "bg-[#f7f8fa]",
};

const sidebarStyles = {
  shell: "border-b border-[#c4c6cd] bg-[#041627] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r",
  inner: "flex h-full flex-col gap-5 px-4 py-5 lg:px-5 lg:py-6",
  eyebrow: "inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-[#9db2cc]",
  titleBlock: "space-y-2 border-b border-white/8 pb-4",
  subtitle: "max-w-[22rem] text-[13px] leading-5 text-[#b7c8de]",
  verdict: "rounded-md bg-white/[0.06] px-3.5 py-3 text-[#e6eef8]",
  verdictLabel: "text-[10px] font-medium uppercase tracking-[0.14em] text-[#9db2cc]",
  nav: "grid gap-0.5",
  navItem: "block min-w-0 overflow-hidden border-l-2 px-3 py-2.5 transition-colors",
  navItemActive: "border-[#7ca6d6] bg-white/[0.07] text-white",
  navItemIdle: "border-transparent text-[#b7c8de] hover:bg-white/[0.04] hover:text-white",
  navMeta: "text-[10px] font-medium uppercase tracking-[0.14em] text-current/65",
  navLabel: "mt-1 text-[13px] font-semibold leading-5 text-current",
  navSummary: "mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] leading-4 text-current/70",
};

function formatAxisValue(value: number) {
  return value.toLocaleString("en-US");
}

function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.6],
      }
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [sectionIds]);

  return activeSection;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-[#d9dde3] bg-white px-3 py-2 shadow-[0_6px_16px_rgba(4,22,39,0.08)]">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6978]">{label}</div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#44505f]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </div>
            <div className="font-medium text-[#1b1c1d]">
              {entry.value.toFixed(1)}
              {suffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBlock({
  id,
  kicker,
  title,
  description,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6978]">{kicker}</div>
        <div className="space-y-1">
          <h2 className="text-[24px] font-semibold leading-8 text-[#1b1c1d]">{title}</h2>
          <p className="max-w-4xl text-sm leading-6 text-[#44474c]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function WidgetCard({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "rounded-md border border-[#d9dde3] bg-white py-0 shadow-[0_4px_12px_rgba(4,22,39,0.05)]",
        className
      )}
    >
      <CardHeader className="gap-1 border-b border-[#e4e2e3] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="font-sans text-[15px] font-semibold text-[#1b1c1d]">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-[12px] leading-5 text-[#5f6978]">{description}</CardDescription>
            ) : null}
          </div>
          {action ? <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#5f6978]">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-2 py-1 text-[11px] font-medium", toneBadgeStyles[tone])}>
      {children}
    </span>
  );
}

function KpiCard({ label, value, changeLabel, note, tone }: DashboardData["overview"]["kpis"][number]) {
  return (
    <WidgetCard title={label} action={<StatusPill tone={tone}>{changeLabel}</StatusPill>}>
      <div className="space-y-1">
        <div className="text-[30px] font-semibold leading-none text-[#041627]">{value}</div>
        <p className="text-xs leading-5 text-[#5f6978]">{note}</p>
      </div>
    </WidgetCard>
  );
}

function SummaryCard({ label, value, note }: DashboardData["overview"]["summaryCards"][number]) {
  return (
    <div className="rounded-md border border-[#d9dde3] bg-[#f5f3f4] p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6978]">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[#1b1c1d]">{value}</div>
      <p className="mt-1 text-xs leading-5 text-[#5f6978]">{note}</p>
    </div>
  );
}

function InsightCards({
  items,
  columns = 1,
}: {
  items: DashboardData["industryDivide"]["summary"];
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-3", columns === 2 && "md:grid-cols-2")}>
      {items.map((item) => (
        <div key={item.title} className="rounded-md border border-[#d9dde3] bg-[#f5f3f4] p-4">
          <div className="text-sm font-semibold text-[#1b1c1d]">{item.title}</div>
          <p className="mt-2 text-xs leading-5 text-[#44474c]">{item.body}</p>
        </div>
      ))}
    </div>
  );
}

function RankedList({
  items,
  valueLabel = "Index",
  itemLabel,
}: {
  items: RankedMetric[];
  valueLabel?: string;
  itemLabel?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[#e4e2e3] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">
        <div>{itemLabel ?? (valueLabel === "Index" ? "Category" : "Label")}</div>
        <div>{valueLabel}</div>
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-[#e4e2e3] px-3 py-2",
            toneRowStyles[item.tone]
          )}
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[#1b1c1d]">{item.label}</div>
            {item.note ? <div className="text-xs text-[#5f6978]">{item.note}</div> : null}
          </div>
          <div className="text-sm font-semibold text-[#041627]">{item.formattedValue}</div>
        </div>
      ))}
    </div>
  );
}

function ChartFrame({
  height = 320,
  children,
}: {
  height?: number;
  children: (mounted: boolean) => React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  return <div className="min-w-0 w-full" style={{ height }}>{children(mounted)}</div>;
}

function MultiLineChart({
  data,
  lines,
  suffix = "",
  percentage = false,
  height = 320,
}: {
  data: SeriesPoint[];
  lines: string[];
  suffix?: string;
  percentage?: boolean;
  height?: number;
}) {
  return (
    <ChartFrame height={height}>
      {(mounted) =>
        mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#e4e2e3" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#5f6978", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fill: "#5f6978", fontSize: 12 }}
                tickFormatter={(value: number) => (percentage ? `${value.toFixed(0)}%` : formatAxisValue(value))}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip suffix={suffix} />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#5f6978" }} />
              {lines.map((line) => (
                <Line
                  key={line}
                  type="monotone"
                  dataKey={line}
                  stroke={String(data[0]?.[`${line}Color`] ?? "#0b7a75")}
                  strokeWidth={line === "Per-capita income" || line === "Private industries" ? 2.6 : 2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  strokeDasharray={line === "Overall cost of living (PCE)" ? "4 4" : undefined}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-sm bg-[#f5f3f4]" />
        )
      }
    </ChartFrame>
  );
}

function IndustryRankingColumn({
  title,
  items,
  fillClassName,
  metricLabel,
  maxValue,
}: {
  title: string;
  items: RankedMetric[];
  fillClassName: string;
  metricLabel: string;
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-[#e4e2e3] pb-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">{title}</div>
        <div className="text-[11px] font-medium text-[#5f6978]">{metricLabel}</div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={`${title}-${item.label}`} className="space-y-1.5 rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] px-3 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#1b1c1d]">{item.label}</div>
                {item.note ? <div className="text-xs text-[#5f6978]">{item.note}</div> : null}
              </div>
              <div className="text-sm font-semibold text-[#041627]">{item.formattedValue}</div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className={cn("h-full rounded-full", fillClassName)}
                style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndustryRankingBars({
  leaders,
  laggards,
  metricLabel,
}: {
  leaders: RankedMetric[];
  laggards: RankedMetric[];
  metricLabel: string;
}) {
  const allItems = [...leaders, ...laggards];
  const maxValue = Math.max(...allItems.map((item) => item.value), 1);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <IndustryRankingColumn
        title="Top 5 industries"
        items={leaders}
        fillClassName="bg-[#0b7a75]"
        metricLabel={metricLabel}
        maxValue={maxValue}
      />
      <IndustryRankingColumn
        title="Bottom 5 industries"
        items={laggards}
        fillClassName="bg-[#b46a43]"
        metricLabel={metricLabel}
        maxValue={maxValue}
      />
    </div>
  );
}

function ShareAreaChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartFrame height={300}>
      {(mounted) =>
        mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="shareFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b7a75" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0b7a75" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e2e3" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#5f6978", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fill: "#5f6978", fontSize: 12 }}
                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip suffix="%" />} />
              <ReferenceLine x={2005} stroke="#7c8796" strokeDasharray="4 4" />
              <ReferenceLine x={2011} stroke="#7c8796" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="share" stroke="#0b7a75" strokeWidth={2.4} fill="url(#shareFill)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-sm bg-[#f5f3f4]" />
        )
      }
    </ChartFrame>
  );
}

export function AmericanDreamDashboard({ data }: DashboardProps) {
  const sectionIds = useMemo(() => data.sidebar.map((section) => section.id), [data.sidebar]);
  const activeSection = useActiveSection(sectionIds);

  return (
    <main className="min-h-screen bg-[#fbf9fa] text-[#1b1c1d]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className={sidebarStyles.shell}>
          <div className={sidebarStyles.inner}>
            <div className={sidebarStyles.titleBlock}>
              <div className={sidebarStyles.eyebrow}>
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics dashboard
              </div>
              <div className="space-y-1.5">
                <h1 className="text-[21px] font-semibold leading-7">{data.title}</h1>
                <p className={sidebarStyles.subtitle}>{data.subtitle}</p>
              </div>
            </div>

            <div className={sidebarStyles.verdict}>
              <div className={sidebarStyles.verdictLabel}>Verdict</div>
              <div className="mt-1.5 text-lg font-semibold leading-6 text-white">{data.verdict.label}</div>
              <p className="mt-1.5 text-[13px] leading-5 text-[#cfe0f4]">{data.verdict.summary}</p>
            </div>

            <nav className={sidebarStyles.nav}>
              {data.sidebar.map((item, index) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      sidebarStyles.navItem,
                      isActive ? sidebarStyles.navItemActive : sidebarStyles.navItemIdle
                    )}
                  >
                    <div className={sidebarStyles.navMeta}>Section {index + 1}</div>
                    <div className={sidebarStyles.navLabel}>{item.label}</div>
                    <div className={sidebarStyles.navSummary}>{item.summary}</div>
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-[#d9dde3] bg-[#efedef]">
            <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="grid gap-3 md:grid-cols-3">
                  {data.overview.summaryCards.map((item) => (
                    <SummaryCard key={item.label} {...item} />
                  ))}
                </div>
                <div className="rounded-md border border-[#d9dde3] bg-white px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6978]">Readout</div>
                  <div className="mt-2 flex items-start gap-3">
                    <CircleDollarSign className="mt-0.5 h-5 w-5 text-[#0b7a75]" />
                    <p className="text-sm leading-6 text-[#44474c]">{data.verdict.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <SectionBlock
                id="overview"
                kicker="Overview"
                title="Macro affordability improved in aggregate, but the important categories did not."
                description="The national read is not a collapse story. Per-capita income beat broad inflation. The split shows up once the dashboard narrows from total consumption to housing, education, and ownership access."
              >
                <div className="grid gap-3 xl:grid-cols-4">
                  {data.overview.kpis.map((item) => (
                    <KpiCard key={item.label} {...item} />
                  ))}
                </div>
                <div className="grid gap-4">
                  <div className="min-w-0">
                    <WidgetCard
                      title="Income versus major price indexes"
                      description="Per-capita income and BEA price indexes, each rebased to 2000 = 100."
                    >
                      <MultiLineChart data={data.overview.comparisonChart} lines={data.overview.comparisonLines} height={360} />
                    </WidgetCard>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WidgetCard
                      title="2024 affordability score by category"
                      description="Income-growth index divided by each 2024 price index. Values above 100 mean more buying power than in 2000."
                      action="2024"
                    >
                      <RankedList items={data.overview.affordabilityRankings} itemLabel="Category" valueLabel="Affordability vs 2000" />
                    </WidgetCard>
                    <WidgetCard title="Overview read" description="Supporting snapshot from the aggregate dashboard view.">
                      <div className="grid gap-3 md:grid-cols-3">
                        {data.overview.summaryCards.map((item) => (
                          <SummaryCard key={`overview-read-${item.label}`} {...item} />
                        ))}
                      </div>
                    </WidgetCard>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock
                id="cost-of-living"
                kicker="Cost of Living"
                title="Broad inflation was manageable. Specific categories were not."
                description="This section keeps the repo-backed indexed comparison intact, but adds context for what the national average hides and what it still supports."
              >
                <div className="grid gap-4">
                  <div className="min-w-0">
                    <WidgetCard
                      title="Income versus BEA price indexes"
                      description="Per-capita income versus broad and category-level BEA price indexes rebased to 2000 = 100."
                    >
                      <MultiLineChart data={data.costOfLiving.chart} lines={data.costOfLiving.lines} height={360} />
                    </WidgetCard>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WidgetCard title="Affordability interpretation" description="What the chart does and does not say.">
                      <InsightCards items={data.costOfLiving.insightCards} columns={2} />
                    </WidgetCard>
                    <WidgetCard
                      title="State income context"
                      description="Per-capita income context plus the saved one-year American Dream state ranking."
                      action="Latest"
                    >
                      <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                            <div className="text-[11px] uppercase tracking-[0.12em] text-[#5f6978]">National per capita</div>
                            <div className="mt-1 text-lg font-semibold text-[#041627]">
                              {data.costOfLiving.stateIncomeContext.nationalPerCapita2024}
                            </div>
                          </div>
                          <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                            <div className="text-[11px] uppercase tracking-[0.12em] text-[#5f6978]">Top vs bottom</div>
                            <div className="mt-1 text-sm font-semibold text-[#041627]">
                              {data.costOfLiving.stateIncomeContext.spread}
                            </div>
                          </div>
                          <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                            <div className="text-[11px] uppercase tracking-[0.12em] text-[#5f6978]">Median state</div>
                            <div className="mt-1 text-sm font-semibold text-[#041627]">
                              {data.costOfLiving.stateIncomeContext.medianState}
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Top predicted states</div>
                            <RankedList items={data.costOfLiving.stateIncomeContext.topStates} itemLabel="State" valueLabel="Score" />
                          </div>
                          <div>
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Bottom predicted states</div>
                            <RankedList items={data.costOfLiving.stateIncomeContext.bottomStates} itemLabel="State" valueLabel="Score" />
                          </div>
                        </div>
                      </div>
                    </WidgetCard>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock
                id="industry-divide"
                kicker="Industry Divide"
                title="The dream increasingly depends on which labor market you are in."
                description="This section now separates forecasted and observed industry results: a labeled 3-year prediction built from 2024 and older data, plus actual 2024 wage leaders and laggards."
              >
              <div className="grid gap-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <WidgetCard
                    title="Predicted industry ranking"
                    description="Three-year forecast using 2024 and older data to rank industries on future American Dream score."
                    action={data.industryDivide.predictedFigure.benchmarkLabel}
                  >
                    <IndustryRankingBars
                      leaders={data.industryDivide.predictedFigure.leaders}
                      laggards={data.industryDivide.predictedFigure.laggards}
                      metricLabel={data.industryDivide.predictedFigure.metricLabel}
                    />
                  </WidgetCard>
                  <WidgetCard
                    title="Actual 2024 wage ranking"
                    description="Observed wage-per-FTE leaders and laggards from the cleaned industry wage data."
                    action={data.industryDivide.historicalFigure.benchmarkLabel}
                  >
                    <IndustryRankingBars
                      leaders={data.industryDivide.historicalFigure.leaders}
                      laggards={data.industryDivide.historicalFigure.laggards}
                      metricLabel={data.industryDivide.historicalFigure.metricLabel}
                    />
                  </WidgetCard>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="grid gap-4">
                    <WidgetCard title="Degree-heavy versus non-degree-heavy" description="Growth indexes and 2024 wage levels tell different parts of the story.">
                      <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {data.industryDivide.degreeComparison.growth2024.map((item) => (
                            <div key={item.label} className={cn("rounded-sm border border-[#e4e2e3] p-3", toneRowStyles[item.tone])}>
                              <div className="text-sm font-medium text-[#1b1c1d]">{item.label}</div>
                              <div className="mt-2 text-2xl font-semibold text-[#041627]">{item.formattedValue}</div>
                              <div className="mt-1 text-xs text-[#5f6978]">{item.note}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid gap-2">
                          {data.industryDivide.degreeComparison.wageLevels2024.map((item) => (
                            <div
                              key={item.label}
                              className={cn(
                                "flex items-center justify-between rounded-sm border border-[#e4e2e3] px-3 py-2",
                                toneRowStyles[item.tone]
                              )}
                            >
                              <div>
                                <div className="text-sm font-medium text-[#1b1c1d]">{item.label}</div>
                                <div className="text-xs text-[#5f6978]">{item.note}</div>
                              </div>
                              <div className="text-sm font-semibold text-[#041627]">{item.formattedValue}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </WidgetCard>
                    <WidgetCard title="Interpretation" description="What the labor split implies for the dashboard story.">
                      <InsightCards items={data.industryDivide.summary} columns={2} />
                    </WidgetCard>
                  </div>
                  <WidgetCard title="Why these figures changed" description="The dashboard now separates forecast output from observed wage data.">
                    <div className="grid gap-3">
                      <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                        The forecast panel is explicitly labeled as a 3-year prediction from the 2024 baseline, rather than reading like observed current-year data.
                      </div>
                      <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                        The second panel shows actual 2024 wage levels, so observed and predicted industry outcomes can be compared without mixing the two concepts.
                      </div>
                    </div>
                  </WidgetCard>
                </div>
              </div>
              </SectionBlock>

              <SectionBlock
                id="housing-burden"
                kicker="Housing Burden"
                title="Monthly housing burden and ownership access diverged."
                description="The burden share stayed comparatively stable. The ownership path is the sharper affordability break, which is why both views need to sit side by side."
              >
              <div className="grid gap-4">
                <div className="min-w-0">
                  <WidgetCard
                    title="Housing burden as a share of personal income"
                    description="Housing and utility spending shares rather than index growth."
                  >
                    <MultiLineChart
                      data={data.housingBurden.burdenChart}
                      lines={data.housingBurden.burdenLines}
                      height={320}
                      percentage
                      suffix="%"
                    />
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      {data.housingBurden.burdenChange.map((item) => (
                        <div key={item.label} className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                          <div className="text-sm font-medium text-[#1b1c1d]">{item.label}</div>
                          <div className="mt-1 text-xs text-[#5f6978]">{item.formattedValue}</div>
                        </div>
                      ))}
                    </div>
                  </WidgetCard>
                </div>
                <div className="min-w-0">
                  <WidgetCard
                    title="Tenant rent versus owner-equivalent rent"
                    description="BEA rent price indexes rebased to 2000 = 100, alongside income and broad PCE."
                  >
                    <MultiLineChart
                      data={data.housingBurden.rentVsOwnerChart}
                      lines={data.housingBurden.rentVsOwnerLines}
                      height={340}
                    />
                  </WidgetCard>
                </div>
                <WidgetCard title="Summary read" description="Clarifying the housing claim.">
                  <InsightCards items={data.housingBurden.summary} columns={2} />
                </WidgetCard>
              </div>
              </SectionBlock>

              <SectionBlock
                id="homeownership"
                kicker="Homeownership"
                title="Ownership entry is the cleanest break in the dashboard."
                description="Construction-cost indices ran much faster than per-capita income. This section keeps the ownership story dominant and uses residential investment share as supporting context."
              >
              <div className="grid gap-4">
                <div className="min-w-0">
                  <WidgetCard title="Construction-cost indexes versus income" description="Structure-cost price indexes compared with per-capita income and tenant-rent growth; these are not home sale prices.">
                    <MultiLineChart
                      data={data.homeownership.constructionChart}
                      lines={data.homeownership.constructionLines}
                      height={380}
                    />
                  </WidgetCard>
                </div>
                <div className="min-w-0">
                  <WidgetCard
                    title="Residential investment as a share of income"
                    description="Residential fixed-investment share of total personal income, showing boom, collapse, and partial recovery."
                  >
                    <ShareAreaChart data={data.homeownership.residentialShareChart} />
                  </WidgetCard>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <WidgetCard title="Ownership conclusion" description="Bottom-line dashboard read.">
                    <InsightCards items={data.homeownership.summary} columns={2} />
                  </WidgetCard>
                  <WidgetCard title="Key moments" description="Residential investment share milestones.">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {data.homeownership.keyMoments.map((item) => (
                        <div key={item.label} className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] uppercase tracking-[0.12em] text-[#5f6978]">{item.label}</div>
                          <div className="mt-1 text-xl font-semibold text-[#041627]">{item.value}</div>
                          <div className="text-xs text-[#5f6978]">{item.note}</div>
                        </div>
                      ))}
                    </div>
                  </WidgetCard>
                </div>
              </div>
              </SectionBlock>

              <SectionBlock
                id="methodology"
                kicker="Methodology"
                title="Only repo data and existing analysis logic are used."
                description="The dashboard stays within the existing cleaned datasets and notebook logic, then repackages those outputs into section-oriented widgets."
              >
                <div className="grid gap-4 xl:grid-cols-2">
                  <WidgetCard title="Sources" description="Repo-backed data inputs and transformations." action={<ScrollText className="h-4 w-4 text-[#5f6978]" />}>
                    <div className="grid gap-2">
                      {data.methodology.sources.map((item) => (
                        <div key={item} className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </WidgetCard>
                  <WidgetCard title="Caveats" description="What is intentionally excluded from the dashboard." action={<Home className="h-4 w-4 text-[#5f6978]" />}>
                    <div className="grid gap-2">
                      {data.methodology.caveats.map((item) => (
                        <div key={item} className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </WidgetCard>
                </div>
              </SectionBlock>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
