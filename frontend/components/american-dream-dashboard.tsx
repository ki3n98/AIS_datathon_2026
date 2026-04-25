"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DropdownMenu } from "radix-ui";
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
import {
  BarChart3,
  Car,
  Check,
  ChevronDown,
  CircleDollarSign,
  Fuel,
  Home,
  KeyRound,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Wrench,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

const toneBarStyles: Record<Tone, string> = {
  good: "bg-[#b9dfd7]/55",
  warn: "bg-[#efd89a]/50",
  bad: "bg-[#e7c0af]/52",
  neutral: "bg-[#d9dde3]/55",
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

  return { activeSection, setActiveSection };
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
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-1 text-[11px] font-medium",
        toneBadgeStyles[tone]
      )}
    >
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
  showBackgroundBars = false,
}: {
  items: RankedMetric[];
  valueLabel?: string;
  itemLabel?: string;
  showBackgroundBars?: boolean;
}) {
  const maxValue = items.reduce((currentMax, item) => Math.max(currentMax, item.value), 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[#e4e2e3] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">
        <div>{itemLabel ?? (valueLabel === "Index" ? "Category" : "Label")}</div>
        <div>{valueLabel}</div>
      </div>
      {items.map((item) => {
        const barWidth = showBackgroundBars && maxValue > 0 ? `${Math.max((item.value / maxValue) * 100, 8)}%` : "0%";

        return (
        <div
          key={item.label}
          className={cn(
            "relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-sm border border-[#e4e2e3] px-3 py-2",
            toneRowStyles[item.tone]
          )}
        >
          {showBackgroundBars ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-y-0 left-0 rounded-r-[0.45rem] border-r border-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
                toneBarStyles[item.tone]
              )}
              style={{ width: barWidth }}
            />
          ) : null}
          <div className="relative min-w-0">
            <div className="truncate text-sm font-medium text-[#1b1c1d]">{item.label}</div>
            {item.note ? <div className="text-xs text-[#5f6978]">{item.note}</div> : null}
          </div>
          <div className="relative text-sm font-semibold text-[#041627]">{item.formattedValue}</div>
        </div>
        );
      })}
    </div>
  );
}

function ChartFrame({
  height = 320,
  children,
}: {
  height?: number;
  children: (state: { mounted: boolean; width: number; height: number }) => React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height });

  useEffect(() => {
    const element = frameRef.current;
    if (!element || !mounted) return;

    const updateSize = () => {
      const nextWidth = Math.max(Math.floor(element.clientWidth), 0);
      const nextHeight = Math.max(Math.floor(element.clientHeight), 0);
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight }
      );
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [height, mounted]);

  return (
    <div ref={frameRef} className="min-w-0 w-full" style={{ height }}>
      {children({ mounted, width: size.width, height: size.height })}
    </div>
  );
}

function MultiLineChart({
  data,
  lines,
  suffix = "",
  percentage = false,
  height = 320,
  highlightLines = [],
  emphasizedLines = [],
  primaryLine,
  visibleLines,
}: {
  data: SeriesPoint[];
  lines: string[];
  suffix?: string;
  percentage?: boolean;
  height?: number;
  highlightLines?: string[];
  emphasizedLines?: string[];
  primaryLine?: string;
  visibleLines?: string[];
}) {
  const displayedLines = visibleLines?.length ? lines.filter((line) => visibleLines.includes(line)) : lines;

  return (
    <ChartFrame height={height}>
      {({ mounted, width, height: frameHeight }) =>
        mounted && width > 0 && frameHeight > 0 ? (
          <ResponsiveContainer width={width} height={frameHeight}>
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
              {displayedLines.map((line) => {
                const isHighlighted = highlightLines.includes(line);
                const isPrimary = line === primaryLine || line === "Private industries";
                const isEmphasized = emphasizedLines.includes(line);

                return (
                  <Line
                    key={line}
                    type="monotone"
                    dataKey={line}
                    stroke={String(data[0]?.[`${line}Color`] ?? "#0b7a75")}
                    strokeWidth={isHighlighted ? 4.8 : isPrimary ? 4.2 : isEmphasized ? 2.8 : 2}
                    dot={false}
                    activeDot={{ r: isHighlighted ? 6 : isPrimary ? 5 : isEmphasized ? 4 : 3 }}
                    strokeOpacity={isHighlighted ? 1 : isPrimary ? 1 : isEmphasized ? 0.88 : 0.42}
                    strokeDasharray={line === "Overall cost of living (PCE)" ? "4 4" : undefined}
                    style={isPrimary ? { filter: "drop-shadow(0 0 8px rgba(11,122,117,0.22))" } : undefined}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-sm bg-[#f5f3f4]" />
        )
      }
    </ChartFrame>
  );
}

function CostOfLivingLineSelector({
  comparisonLines,
  selectedLines,
  allSelected,
  incomeLine,
  onSetAll,
  onClearAll,
  onToggleLine,
}: {
  comparisonLines: string[];
  selectedLines: Set<string>;
  allSelected: boolean;
  incomeLine: string;
  onSetAll: () => void;
  onClearAll: () => void;
  onToggleLine: (line: string) => void;
}) {
  const selectedLabel = allSelected ? "All lines" : selectedLines.size ? `${selectedLines.size} selected` : "Income only";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 min-w-[132px] justify-between border-[#d9dde3] bg-white text-[11px] font-medium normal-case tracking-normal text-[#243447] hover:border-[#b6c4d3] hover:bg-[#f7f8fa]"
        >
          <span>Line filter: {selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[250px] rounded-md border border-[#d9dde3] bg-white p-1.5 shadow-[0_10px_26px_rgba(4,22,39,0.14)]"
        >
          <DropdownMenu.CheckboxItem
            checked={allSelected}
            onCheckedChange={(checked) => (checked ? onSetAll() : onClearAll())}
            className="flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium text-[#243447] outline-none transition-colors data-[highlighted]:bg-[#f4f7fa]"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#b8c4d2] bg-white text-[#0b7a75]">
              <DropdownMenu.ItemIndicator>
                <Check className="h-3 w-3" />
              </DropdownMenu.ItemIndicator>
            </span>
            <span>All lines</span>
          </DropdownMenu.CheckboxItem>
          <DropdownMenu.Separator className="my-1 h-px bg-[#e4e2e3]" />
          <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Visible series</div>
          <div className="rounded-sm border border-[#d9e5e3] bg-[#f4fbfa] px-2.5 py-2 text-xs text-[#35555a]">
            <div className="flex items-center gap-2 font-medium text-[#0a5c63]">
              <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#8dc5bc] bg-white text-[#0b7a75]">
                <Check className="h-3 w-3" />
              </span>
              {incomeLine}
            </div>
            <div className="mt-1 text-[11px] text-[#5f6978]">Always visible and visually emphasized.</div>
          </div>
          {comparisonLines.map((line) => (
            <DropdownMenu.CheckboxItem
              key={line}
              checked={selectedLines.has(line)}
              onCheckedChange={() => onToggleLine(line)}
              className="mt-1 flex cursor-default items-center gap-2 rounded-sm px-2.5 py-2 text-xs text-[#243447] outline-none transition-colors data-[highlighted]:bg-[#f4f7fa]"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-[#b8c4d2] bg-white text-[#0b7a75]">
                <DropdownMenu.ItemIndicator>
                  <Check className="h-3 w-3" />
                </DropdownMenu.ItemIndicator>
              </span>
              <span>{line}</span>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function RankingColumn({
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
      <RankingColumn title="Top 5 industries" items={leaders} fillClassName="bg-[#0b7a75]" metricLabel={metricLabel} maxValue={maxValue} />
      <RankingColumn title="Bottom 5 industries" items={laggards} fillClassName="bg-[#b46a43]" metricLabel={metricLabel} maxValue={maxValue} />
    </div>
  );
}

function ShareAreaChart({ data }: { data: SeriesPoint[] }) {
  return (
    <ChartFrame height={300}>
      {({ mounted, width, height }) =>
        mounted && width > 0 && height > 0 ? (
          <ResponsiveContainer width={width} height={height}>
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
  const { activeSection, setActiveSection } = useActiveSection(sectionIds);
  const incomeLine = "Median industry wage";
  const comparisonLines = useMemo(
    () => data.costOfLiving.lines.filter((line) => line !== incomeLine),
    [data.costOfLiving.lines]
  );
  const [costOfLivingSelection, setCostOfLivingSelection] = useState<{
    mode: "all" | "custom";
    selected: Set<string>;
  }>({
    mode: "all",
    selected: new Set(comparisonLines),
  });
  const selectedCostOfLivingLines =
    costOfLivingSelection.mode === "all"
      ? new Set(comparisonLines)
      : new Set(comparisonLines.filter((line) => costOfLivingSelection.selected.has(line)));
  const costOfLivingAllLines = costOfLivingSelection.mode === "all";
  const costOfLivingVisibleLines = costOfLivingAllLines
    ? data.costOfLiving.lines
    : [incomeLine, ...comparisonLines.filter((line) => selectedCostOfLivingLines.has(line))];
  const costOfLivingEmphasizedLines = costOfLivingAllLines ? [] : [...selectedCostOfLivingLines];

  const handleSetAllCostOfLivingLines = () => {
    setCostOfLivingSelection({
      mode: "all",
      selected: new Set(comparisonLines),
    });
  };

  const handleClearCostOfLivingLines = () => {
    setCostOfLivingSelection({
      mode: "custom",
      selected: new Set(),
    });
  };

  const handleToggleCostOfLivingLine = (line: string) => {
    setCostOfLivingSelection((current) => {
      const next = new Set(current.mode === "all" ? comparisonLines : current.selected);

      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }

      if (next.size === comparisonLines.length) {
        return {
          mode: "all",
          selected: new Set(comparisonLines),
        };
      }

      return {
        mode: "custom",
        selected: next,
      };
    });
  };

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
                    onClick={() => setActiveSection(item.id)}
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
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                <div className="rounded-md border border-[#d9dde3] bg-[#041627] px-5 py-5 text-white shadow-[0_10px_28px_rgba(4,22,39,0.16)]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9db2cc]">Overview</div>
                  <h2 className="mt-3 max-w-3xl text-[28px] font-semibold leading-9 text-white">
                    This dashboard suggests the American Dream did not disappear overall. It became harder to reach in the areas that matter most for long-term stability, especially housing, education, and buying a home.
                  </h2>
                  <p className="mt-3 max-w-3xl text-[14px] leading-6 text-[#d6e3f3]">
                    Income grew faster than overall inflation from 2000 to 2024, but the costs tied to moving up and building security rose faster than many workers&apos; incomes.
                  </p>
                </div>
                <div className="rounded-md border border-[#d9dde3] bg-white px-4 py-4">
                  <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6978]">Readout</div>
                  <div className="mt-2 flex items-start gap-3">
                    <CircleDollarSign className="mt-0.5 h-5 w-5 text-[#0b7a75]" />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold leading-6 text-[#1b1c1d]">{data.verdict.label}</p>
                      <p className="text-sm leading-6 text-[#44474c]">{data.verdict.summary}</p>
                    </div>
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
                title="Everyday costs held up better than the path to ownership."
                description="A quick visual read of the dashboard's core message."
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <WidgetCard title="At a glance" description="The shortest version of the story.">
                    <div className="grid gap-3">
                      <div className="rounded-md border border-[#c9d7e6] bg-[#f2f7fb] p-4 text-sm leading-6 text-[#243447]">
                        Income stayed ahead of broad everyday costs, but ownership, education, and other long-term stepping stones got harder to afford.
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-sm border border-[#b8dbd6] bg-[#f7fcfb] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a5c63]">Broad picture</div>
                          <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">Still reachable</div>
                        </div>
                        <div className="rounded-sm border border-[#ebd6a1] bg-[#fffcf3] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5b12]">Everyday costs</div>
                          <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">More stable</div>
                        </div>
                        <div className="rounded-sm border border-[#e3c0b2] bg-[#fdf7f4] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b4d32]">Ownership</div>
                          <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">Harder</div>
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <WidgetCard title="Quick key" description="All values use 2000 = 100.">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">240</div>
                        <p className="mt-1 text-xs leading-5 text-[#44505f]">About 2.4x the 2000 level.</p>
                      </div>
                      <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Above 100</div>
                        <p className="mt-1 text-xs leading-5 text-[#44505f]">Better buying power than 2000.</p>
                      </div>
                      <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Below 100</div>
                        <p className="mt-1 text-xs leading-5 text-[#44505f]">Worse buying power than 2000.</p>
                      </div>
                    </div>
                  </WidgetCard>
                </div>
                <div className="grid gap-3 xl:grid-cols-4">
                  {data.overview.kpis.map((item) => (
                    <KpiCard key={item.label} {...item} />
                  ))}
                </div>
                <WidgetCard title="What moved fastest since 2000" description="Broad sectors, everyday costs, and building costs at a glance.">
                  <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Median industry growth</div>
                      <div className="mt-1 text-lg font-semibold text-[#041627]">{data.overview.spotlightLists.medianReadout.incomeGrowth}</div>
                    </div>
                    <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Median everyday cost growth</div>
                      <div className="mt-1 text-lg font-semibold text-[#041627]">{data.overview.spotlightLists.medianReadout.costGrowth}</div>
                    </div>
                    <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Median housing investment</div>
                      <div className="mt-1 text-lg font-semibold text-[#041627]">{data.overview.spotlightLists.medianReadout.homeBuilding}</div>
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-3">
                      <div className="border-b border-[#e4e2e3] pb-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Income growth</div>
                        <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">Top 5 broad industries</div>
                      </div>
                      <RankedList items={data.overview.spotlightLists.incomeGrowthIndustries} valueLabel="2000 = 100" itemLabel="Industry" showBackgroundBars />
                    </div>
                    <div className="space-y-3">
                      <div className="border-b border-[#e4e2e3] pb-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Cost of living</div>
                        <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">Top 5 everyday categories</div>
                      </div>
                      <RankedList items={data.overview.spotlightLists.costGrowthCategories} valueLabel="2000 = 100" itemLabel="Category" showBackgroundBars />
                    </div>
                    <div className="space-y-3">
                      <div className="border-b border-[#e4e2e3] pb-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Home building costs</div>
                        <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">Fastest-rising building types</div>
                      </div>
                      <RankedList items={data.overview.spotlightLists.homeBuildingGrowth} valueLabel="2000 = 100" itemLabel="Building type" showBackgroundBars />
                    </div>
                  </div>
                </WidgetCard>
                <div className="grid gap-3 md:grid-cols-3">
                  {data.overview.summaryCards.map((item) => (
                    <SummaryCard key={item.label} {...item} />
                  ))}
                </div>
              </SectionBlock>

              <SectionBlock
                id="cost-of-living"
                kicker="Income vs Cost of Living"
                title="This section shows where income kept pace and where it clearly fell behind."
                description="The median industry wage rose faster than the overall cost of living, but that headline does not hold in every category. Here, higher education is shown as a measure of price growth, not enrollment, student debt, or total spending."
              >
                <div className="grid gap-4">
                  <WidgetCard
                    title="What 'cost of living' means here"
                    description="A plain-English guide to the everyday costs people usually have in mind."
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="rounded-md border border-[#d9dde3] bg-gradient-to-br from-white to-[#f2f5f9] p-5">
                        <div className="flex items-baseline justify-between">
                          <div className="text-sm font-semibold text-[#1b1c1d]">Think of costs like these</div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8892a1]">Everyday spending</div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                          {[
                            { label: "Rent or mortgage", icon: KeyRound },
                            { label: "Utilities", icon: Zap },
                            { label: "Groceries", icon: ShoppingCart },
                            { label: "Healthcare", icon: Stethoscope },
                            { label: "Gas & transport", icon: Fuel },
                            { label: "Car payment", icon: Car },
                            { label: "Insurance", icon: ShieldCheck },
                            { label: "Everyday services", icon: Wrench },
                          ].map(({ label, icon: Icon }) => (
                            <div
                              key={label}
                              className="group flex flex-col items-center gap-2 rounded-md border border-[#e4e7ec] bg-white px-3 py-3 text-center transition-colors hover:border-[#c9d7e6] hover:bg-[#f7fafc]"
                            >
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef3f9] text-[#3a6696] transition-colors group-hover:bg-[#e2ecf6]">
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </span>
                              <span className="text-xs font-medium leading-tight text-[#44505f]">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div className="rounded-sm border border-[#c9d7e6] bg-[#f2f7fb] p-3 text-sm leading-6 text-[#243447]">
                          In this dashboard, overall cost of living is a broad national price measure. It is meant to reflect the general price pressure people feel across everyday spending, not just one bill.
                        </div>
                        <div className="rounded-sm border border-[#eadfcd] bg-[#fcf6ec] p-3 text-sm leading-6 text-[#3d3327]">
                          The examples on the left help make the idea concrete. The detailed charts below then break out a few categories, like housing, rent, healthcare, and higher education, to show where pressure rose the most.
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <div className="min-w-0">
                    <WidgetCard
                      title="Income versus BEA price indexes"
                      description="Median industry wage versus broad and category-level BEA price indexes rebased to 2000 = 100."
                      action={
                        <CostOfLivingLineSelector
                          comparisonLines={comparisonLines}
                          selectedLines={selectedCostOfLivingLines}
                          allSelected={costOfLivingAllLines}
                          incomeLine={incomeLine}
                          onSetAll={handleSetAllCostOfLivingLines}
                          onClearAll={handleClearCostOfLivingLines}
                          onToggleLine={handleToggleCostOfLivingLine}
                        />
                      }
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-sm border border-[#d9e5e3] bg-[#f4fbfa] px-3 py-2 text-xs text-[#35555a]">
                        <span className="inline-flex items-center gap-2 font-medium text-[#0a5c63]">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#0b7a75]" />
                          Income stays emphasized
                        </span>
                        <span className="text-[#5f6978]">
                          Use the dropdown to show all lines or compare income against a custom set of price indexes.
                        </span>
                      </div>
                      <MultiLineChart
                        data={data.costOfLiving.chart}
                        lines={data.costOfLiving.lines}
                        height={360}
                        primaryLine={incomeLine}
                        highlightLines={[incomeLine]}
                        emphasizedLines={costOfLivingEmphasizedLines}
                        visibleLines={costOfLivingVisibleLines}
                      />
                    </WidgetCard>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <WidgetCard
                      title="2024 affordability score by category"
                      description="Calculated as the 2024 median industry wage index divided by each 2024 category price index, then multiplied by 100. A score of 100 means prices kept pace with income since 2000; above 100 means stronger buying power, and below 100 means that category's prices outgrew income."
                      action="2024"
                    >
                      <RankedList
                        items={data.overview.affordabilityRankings}
                        itemLabel="Category"
                        valueLabel="Affordability vs 2000"
                        showBackgroundBars
                      />
                    </WidgetCard>
                    <div className="grid gap-4">
                      <WidgetCard title="Affordability interpretation" description="What the comparison says, and what it does not say.">
                        <InsightCards items={data.costOfLiving.insightCards} columns={2} />
                      </WidgetCard>
                      <WidgetCard title="Higher-education clarification" description="How to read that series correctly.">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                            Higher education costs have outgrown the median industry wage by a meaningful margin since 2000. By 2024, the income index reached 239.7 while the higher-education price index climbed to 282.4, so education costs rose about 18% faster than income.
                          </div>
                          <div className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3 text-sm leading-6 text-[#44474c]">
                            It is still a BEA price index, so the series measures price growth rather than enrollment, borrowing, or total household spending. But the affordability signal is clear: the category scores 84.9 versus 2000, which means a typical dollar of income now buys materially less higher education than it did at the start of the period.
                          </div>
                        </div>
                      </WidgetCard>
                    </div>
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock
                id="housing-homeownership"
                kicker="Housing and Homeownership"
                title="Housing pressure has two parts: the strain of renting and the challenge of buying."
                description="Monthly housing pressure rose, but the path into ownership became much harder. The first part of this section is about renting, and the second is about getting through the door to ownership."
              >
                <div className="grid gap-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WidgetCard
                      title="Housing burden as a share of personal income"
                      description="Cash tenant rent and imputed owner-equivalent rent as shares of national personal income."
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
                    <WidgetCard
                      title="Tenant rent versus owner-equivalent rent"
                      description="BEA rent price indexes rebased to 2000 = 100, alongside the income growth index."
                    >
                      <MultiLineChart
                        data={data.housingBurden.rentVsOwnerChart}
                        lines={data.housingBurden.rentVsOwnerLines}
                        height={340}
                      />
                    </WidgetCard>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WidgetCard title="Construction-cost indexes versus income" description="Structure-cost price indexes compared with the median industry wage and tenant-rent growth; these are not home sale prices.">
                      <MultiLineChart
                        data={data.homeownership.constructionChart}
                        lines={data.homeownership.constructionLines}
                        height={380}
                      />
                    </WidgetCard>
                    <WidgetCard
                      title="Residential investment as a share of income"
                      description="Residential fixed-investment share of total personal income, showing boom, collapse, and partial recovery."
                    >
                      <ShareAreaChart data={data.homeownership.residentialShareChart} />
                    </WidgetCard>
                  </div>
                  <WidgetCard title="Summary read" description="Clarifying the housing claim.">
                    <InsightCards items={data.housingBurden.summary} columns={2} />
                  </WidgetCard>
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
                id="industry-divide"
                kicker="Industry Divide"
                title="Affordability now depends more on the kind of job a person has than the national average suggests."
                description="After looking at rising costs, the next question is who can absorb them. This section compares a clearly labeled 3-year forecast from the 2024 baseline with actual 2024 wage levels, so forecasts and observed outcomes stay separate."
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
                </div>
              </SectionBlock>

              <SectionBlock
                id="methodology"
                kicker="Methodology"
                title="This dashboard uses only the data and analysis already in the repo."
                description="The page reuses the cleaned datasets and existing analysis logic, then turns those results into clearer sections. Here, a price index means how prices changed over time, and the national view should be read as a broad signal rather than a stand-in for every local reality."
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
