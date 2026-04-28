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
  ChevronLeft,
  ChevronRight,
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
    let ticking = false;

    const updateActiveSection = () => {
      const targetOffset = 140;
      let closestSection = sections[0];
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top - targetOffset);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      }

      if (closestSection?.id) {
        setActiveSection((current) => (current === closestSection.id ? current : closestSection.id));
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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

type WorkflowStep = DashboardData["methodology"]["workflow"][number];

const workflowStageStyles = [
  {
    shell: "border-[#c9d7e6] bg-gradient-to-br from-[#f5f9fd] to-white",
    badge: "bg-[#e7f0f8] text-[#335b86]",
    accent: "bg-[#6d93bb]",
    Icon: ScrollText,
  },
  {
    shell: "border-[#d6dfcf] bg-gradient-to-br from-[#f7fbf3] to-white",
    badge: "bg-[#e8f1dd] text-[#56743a]",
    accent: "bg-[#89a869]",
    Icon: Wrench,
  },
  {
    shell: "border-[#eadfcd] bg-gradient-to-br from-[#fdf8ef] to-white",
    badge: "bg-[#f7ecd6] text-[#8b6320]",
    accent: "bg-[#d0a35a]",
    Icon: BarChart3,
  },
  {
    shell: "border-[#d5d7e8] bg-gradient-to-br from-[#f5f5fc] to-white",
    badge: "bg-[#eaebf8] text-[#4d568f]",
    accent: "bg-[#7f88c3]",
    Icon: Check,
  },
] as const;

function WorkflowBoard({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d9dde3] bg-[#f7f8fa] px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Pipeline overview</div>
          <p className="mt-1 text-sm leading-6 text-[#44474c]">
            The workflow moves from BEA source data to pandas cleaning, then repo analysis, and finally into this dashboard.
          </p>
        </div>
        <div className="rounded-full border border-[#d9dde3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">
          Source {"->"} Clean {"->"} Analyze {"->"} Output
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-4">
        {steps.map((item, index) => {
          const stage = workflowStageStyles[index % workflowStageStyles.length];

          return (
            <div
              key={item.label}
              className={cn(
                "group relative rounded-xl border p-4 transition-all duration-200",
                stage.shell,
                "shadow-[0_8px_24px_rgba(4,22,39,0.06)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(4,22,39,0.09)]"
              )}
            >
              <div className={cn("absolute left-0 top-0 h-full w-1.5 rounded-l-xl", stage.accent)} />
              <div className="pl-3">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", stage.badge)}>
                    <stage.Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a848f]">Step {index + 1}</div>
                </div>
                <div className="mt-3 text-[17px] font-semibold leading-7 text-[#1b1c1d]">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-[#44474c]">{item.body}</p>
                {item.note ? <div className="mt-3 rounded-md border border-white/80 bg-white/75 px-3 py-2 text-xs leading-5 text-[#6b7280]">{item.note}</div> : null}
              </div>
              {index < steps.length - 1 ? (
                <div className="mt-3 flex justify-center xl:absolute xl:-right-[18px] xl:top-1/2 xl:mt-0 xl:-translate-y-1/2">
                  <div className="rounded-full border border-[#d9dde3] bg-white p-1.5 text-[#5f6978] shadow-sm">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
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
                    strokeDasharray={line === "Overall cost of living (weighted basket)" ? "4 4" : undefined}
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
  const overviewSpotlights = useMemo(
    () => ({
      income: {
        label: "Income growth",
        title: "Wages grew most in a few standout industries.",
        teaser: "The national headline still holds up better than many people expect.",
        body: "This is the strongest part of the story. Some broad sectors posted very strong wage growth, which helps explain why the national picture still looks more resilient than people expect.",
        eyebrow: "Broad picture",
        statLabel: "Median industry growth",
        statValue: data.overview.spotlightLists.medianReadout.incomeGrowth,
        listTitle: "Top 5 broad industries",
        listLabel: "Industry",
        items: data.overview.spotlightLists.incomeGrowthIndustries,
        accent: "border-[#b8dbd6] bg-[#f7fcfb] text-[#0a5c63]",
      },
      cost: {
        label: "Everyday costs",
        title: "Routine costs rose, but they did not pull away equally.",
        teaser: "Day-to-day pressure rose, but it tells a milder story than ownership.",
        body: "This is the day-to-day read. Everyday categories got more expensive, but they still tell a less severe story than the costs tied to getting ahead.",
        eyebrow: "Everyday life",
        statLabel: "Median everyday cost growth",
        statValue: data.overview.spotlightLists.medianReadout.costGrowth,
        listTitle: "Top 5 everyday categories",
        listLabel: "Category",
        items: data.overview.spotlightLists.costGrowthCategories,
        accent: "border-[#ebd6a1] bg-[#fffcf3] text-[#7d5b12]",
      },
      home: {
        label: "Home building costs",
        title: "The biggest break shows up in building and buying in.",
        teaser: "This is where the dashboard shifts from manageable to difficult.",
        body: "This is where the dashboard turns tougher. The cost of key housing structure types climbed much faster, which helps explain why ownership feels harder than the broad inflation line suggests.",
        eyebrow: "Getting ahead",
        statLabel: "Median housing investment",
        statValue: data.overview.spotlightLists.medianReadout.homeBuilding,
        listTitle: "Fastest-rising building types",
        listLabel: "Building type",
        items: data.overview.spotlightLists.homeBuildingGrowth,
        accent: "border-[#e3c0b2] bg-[#fdf7f4] text-[#8b4d32]",
      },
    }),
    [
      data.overview.spotlightLists.costGrowthCategories,
      data.overview.spotlightLists.homeBuildingGrowth,
      data.overview.spotlightLists.incomeGrowthIndustries,
      data.overview.spotlightLists.medianReadout.costGrowth,
      data.overview.spotlightLists.medianReadout.homeBuilding,
      data.overview.spotlightLists.medianReadout.incomeGrowth,
    ]
  );
  const [overviewSpotlight, setOverviewSpotlight] = useState<keyof typeof overviewSpotlights>("income");
  const activeOverviewSpotlight = overviewSpotlights[overviewSpotlight];
  const overviewSpotlightKeys = Object.keys(overviewSpotlights) as Array<keyof typeof overviewSpotlights>;
  const overviewSpotlightIndex = overviewSpotlightKeys.indexOf(overviewSpotlight);
  const cycleOverviewSpotlight = (direction: -1 | 1) => {
    const nextIndex = (overviewSpotlightIndex + direction + overviewSpotlightKeys.length) % overviewSpotlightKeys.length;
    setOverviewSpotlight(overviewSpotlightKeys[nextIndex]);
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
                  <div className="mb-4 rounded-md border border-[#d9dde3] bg-[#f7f8fa] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => cycleOverviewSpotlight(-1)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#44505f] transition-colors hover:border-[#b6c4d3] hover:bg-[#eef3f7]"
                        aria-label="Previous story step"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1 text-center">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6978]">
                          Step {overviewSpotlightIndex + 1} of {overviewSpotlightKeys.length}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">{activeOverviewSpotlight.label}</div>
                        <p className="mt-1 text-xs leading-5 text-[#5f6978]">{activeOverviewSpotlight.teaser}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cycleOverviewSpotlight(1)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d9dde3] bg-white text-[#44505f] transition-colors hover:border-[#b6c4d3] hover:bg-[#eef3f7]"
                        aria-label="Next story step"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      {overviewSpotlightKeys.map((key, index) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setOverviewSpotlight(key)}
                          aria-label={`Go to step ${index + 1}`}
                          className={cn(
                            "h-2.5 rounded-full transition-all",
                            overviewSpotlight === key ? "w-8 bg-[#0b7a75]" : "w-2.5 bg-[#c8d0da] hover:bg-[#9fb0c2]"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className={cn("rounded-md border p-5", activeOverviewSpotlight.accent)}>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em]">{activeOverviewSpotlight.eyebrow}</div>
                      <div className="mt-2 text-xl font-semibold leading-8 text-[#1b1c1d]">{activeOverviewSpotlight.title}</div>
                      <p className="mt-4 text-sm leading-6 text-[#44474c]">{activeOverviewSpotlight.body}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="border-b border-[#e4e2e3] pb-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">{activeOverviewSpotlight.label}</div>
                        <div className="mt-1 text-sm font-semibold text-[#1b1c1d]">{activeOverviewSpotlight.listTitle}</div>
                      </div>
                      <RankedList
                        items={activeOverviewSpotlight.items}
                        valueLabel="2000 = 100"
                        itemLabel={activeOverviewSpotlight.listLabel}
                        showBackgroundBars
                      />
                    </div>
                  </div>
                </WidgetCard>
              </SectionBlock>

              <SectionBlock
                id="cost-of-living"
                kicker="Income vs Cost of Living"
                title="The broad national picture held up. The category story is where the squeeze shows up."
                description="This section is meant to read in order: start with the broad line, then look at where categories separate from it, then end with the clearest break in affordability."
              >
                <div className="grid gap-4">
                  <WidgetCard title="Story in one glance" description="The shortest way to read this section.">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="rounded-md border border-[#d9e5e3] bg-[#f4fbfa] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a5c63]">Main takeaway</div>
                        <div className="mt-2 text-lg font-semibold leading-8 text-[#1b1c1d]">
                          The American Dream still looks broadly affordable at the national level, but only to a limited extent. Income stayed ahead of the broad cost-of-living basket, while the categories tied to getting ahead became much less affordable.
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">1. Start broad</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">Overall inflation stayed below per-capita personal income growth.</p>
                        </div>
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">2. Then compare categories</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">Some costs stayed closer to income, while others pulled away from it.</p>
                        </div>
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">3. End on the break</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">Higher education is the clearest example of the affordability gap opening up.</p>
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <WidgetCard
                    title="What 'cost of living' means here"
                    description="A quick grounding before the detailed comparison."
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
                          In this dashboard, overall cost of living is a broad national price measure. It reflects general price pressure across household spending, not just one bill.
                        </div>
                        <div className="rounded-sm border border-[#eadfcd] bg-[#fcf6ec] p-3 text-sm leading-6 text-[#3d3327]">
                          The examples on the left make the idea concrete. The chart below then shows where major categories like housing, rent, healthcare, and higher education move differently from the broad line.
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <div className="min-w-0">
                    <WidgetCard
                      title="Step 1: Per-capita income versus major price indexes"
                      description="Start with the broad line, then look for the categories that pull away. All series are rebased to 2000 = 100."
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
                          Start with the key lines, or use the filter to compare income against a custom set of price indexes.
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
                      title="Step 2: What became easier or harder to afford by 2024"
                      description="A score of 100 means prices kept pace with income since 2000. Above 100 means stronger buying power; below 100 means that category outgrew income."
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
                      <WidgetCard title="What the chart is saying" description="How to read the section without overreading it.">
                        <InsightCards items={data.costOfLiving.insightCards} columns={2} />
                      </WidgetCard>
                      <WidgetCard title="Step 3: The clearest break is higher education" description="The easiest place to see the affordability gap open up.">
                        <div className="rounded-md border border-[#e3c0b2] bg-[#fdf7f4] p-4">
                          <div className="grid gap-3 md:grid-cols-[auto_auto_minmax(0,1fr)] md:items-center">
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b4d32]">Income index</div>
                              <div className="mt-1 text-2xl font-semibold text-[#041627]">239.7</div>
                            </div>
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b4d32]">Higher-ed index</div>
                              <div className="mt-1 text-2xl font-semibold text-[#041627]">282.4</div>
                            </div>
                            <p className="text-sm leading-6 text-[#44474c]">
                              Higher education rose faster than per-capita personal income, which is why this category lands below 100 on the affordability score. It is still a price-growth series, not a measure of enrollment, debt, or total family spending, but the affordability signal is clear.
                            </p>
                          </div>
                        </div>
                      </WidgetCard>
                    </div>
                  </div>
                  <WidgetCard title="Section 2 verdict" description="What this section is saying overall.">
                    <div className="rounded-md border border-[#d9e5e3] bg-[#f4fbfa] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a5c63]">Bottom line</div>
                          <div className="mt-2 inline-flex rounded-full border border-[#b8dbd6] bg-white px-3 py-1 text-sm font-semibold text-[#0a5c63]">
                            Score: Moderately Affordable
                          </div>
                        </div>
                        <div className="rounded-sm border border-[#d9dde3] bg-white px-3 py-2 text-xs leading-5 text-[#5f6978]">
                          Scale: Very unaffordable / Unaffordable / Mixed / Moderately affordable / Very affordable
                        </div>
                      </div>
                      <p className="mt-3 text-base font-semibold leading-7 text-[#1b1c1d]">
                        The American Dream remains affordable in a broad, average sense, but not strongly and not evenly. Day-to-day costs stayed more manageable than many people expect, while the costs most tied to upward mobility, especially higher education, became materially less affordable.
                      </p>
                    </div>
                  </WidgetCard>
                </div>
              </SectionBlock>

              <SectionBlock
                id="housing-homeownership"
                kicker="Housing and Homeownership"
                title="Housing tells a split story: renting stayed strained, but buying became the bigger break."
                description="This section is meant to read in order: first the monthly renting story, then the ownership-entry story, then a clear verdict about what that means for the American Dream."
              >
                <div className="grid gap-4">
                  <WidgetCard title="Story in one glance" description="The housing takeaway before the details.">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="rounded-md border border-[#d9e5e3] bg-[#f4fbfa] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a5c63]">Main takeaway</div>
                        <div className="mt-2 text-lg font-semibold leading-8 text-[#1b1c1d]">
                          Housing did not break in just one way. Monthly rent pressure drifted upward, but the much sharper break showed up in the cost of getting into ownership.
                        </div>
                      </div>
                      <div className="grid gap-3">
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">1. Renting</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">Rent pressure rose, but it did not look like a total collapse at the national level.</p>
                        </div>
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">2. Buying</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">Construction and ownership-entry costs ran much faster than income.</p>
                        </div>
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">3. Why it matters</div>
                          <p className="mt-1 text-sm leading-6 text-[#44474c]">That is why housing feels less like a monthly budget problem and more like a wealth-building barrier.</p>
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <WidgetCard title="Step 1: Renting stayed under pressure" description="The monthly housing story is real, but more gradual than the ownership story.">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div>
                        <MultiLineChart
                          data={data.housingBurden.burdenChart}
                          lines={data.housingBurden.burdenLines}
                          height={320}
                          percentage
                          suffix="%"
                        />
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {data.housingBurden.burdenChange.map((item) => (
                            <div key={item.label} className="rounded-sm border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                              <div className="text-sm font-medium text-[#1b1c1d]">{item.label}</div>
                              <div className="mt-1 text-xs text-[#5f6978]">{item.formattedValue}</div>
                              {item.note ? <div className="mt-1 text-xs leading-5 text-[#7a848f]">{item.note}</div> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <WidgetCard
                          title="Rent prices versus income"
                          description="BEA rent price indexes rebased to 2000 = 100, alongside the income growth line."
                          className="shadow-none"
                        >
                          <MultiLineChart
                            data={data.housingBurden.rentVsOwnerChart}
                            lines={data.housingBurden.rentVsOwnerLines}
                            height={280}
                          />
                        </WidgetCard>
                        <div className="rounded-sm border border-[#d9dde3] bg-[#f7f8fa] p-4 text-sm leading-6 text-[#44474c]">
                          Renting clearly got harder, but the national data suggests a steady squeeze rather than a total break. The bigger affordability fracture shows up when the story shifts from renting to buying.
                        </div>
                      </div>
                    </div>
                  </WidgetCard>
                  <WidgetCard title="Step 2: Buying became the sharper barrier" description="This is where housing stops being just a rent story and becomes an ownership-entry story.">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <WidgetCard
                        title="Construction-cost indexes versus income"
                        description="Structure-cost price indexes compared with per-capita personal income and tenant-rent growth; these are not home sale prices."
                        className="shadow-none"
                      >
                        <MultiLineChart
                          data={data.homeownership.constructionChart}
                          lines={data.homeownership.constructionLines}
                          height={380}
                        />
                      </WidgetCard>
                      <WidgetCard
                        title="Residential investment as a share of income"
                        description="Residential fixed-investment share of total personal income, showing boom, collapse, and partial recovery."
                        className="shadow-none"
                      >
                        <ShareAreaChart data={data.homeownership.residentialShareChart} />
                      </WidgetCard>
                    </div>
                  </WidgetCard>
                  <WidgetCard title="Section 3 verdicts" description="Separate reads for renting and buying.">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="rounded-md border border-[#eadfcd] bg-[#fcf6ec] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7d5b12]">Renting</div>
                            <div className="mt-2 inline-flex rounded-full border border-[#eadfcd] bg-white px-3 py-1 text-sm font-semibold text-[#7d5b12]">
                              Score: Mixed
                            </div>
                          </div>
                          <div className="rounded-sm border border-[#e4e2e3] bg-white px-3 py-2 text-xs leading-5 text-[#5f6978]">
                            Scale: Very unaffordable / Unaffordable / Mixed / Moderately affordable / Very affordable
                          </div>
                        </div>
                        <p className="mt-3 text-base font-semibold leading-7 text-[#1b1c1d]">
                          Renting became more expensive, but the national data still looks more like a steady squeeze than a full affordability break.
                        </p>
                      </div>
                      <div className="rounded-md border border-[#e3c0b2] bg-[#fdf7f4] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8b4d32]">Buying</div>
                            <div className="mt-2 inline-flex rounded-full border border-[#e3c0b2] bg-white px-3 py-1 text-sm font-semibold text-[#8b4d32]">
                              Score: Unaffordable
                            </div>
                          </div>
                          <div className="rounded-sm border border-[#e4e2e3] bg-white px-3 py-2 text-xs leading-5 text-[#5f6978]">
                            Scale: Very unaffordable / Unaffordable / Mixed / Moderately affordable / Very affordable
                          </div>
                        </div>
                        <p className="mt-3 text-base font-semibold leading-7 text-[#1b1c1d]">
                          Buying is where the sharper break shows up: home-building costs ran well ahead of income, making entry into ownership much harder.
                        </p>
                      </div>
                    </div>
                  </WidgetCard>
                </div>
              </SectionBlock>

              <SectionBlock
                id="methodology"
                kicker="Methodology"
                title="This dashboard uses only the data and analysis already in the repo."
                description="The page reuses the cleaned datasets and existing analysis logic, then turns those results into clearer sections. Here, a price index means how prices changed over time, and the national view should be read as a broad signal rather than a stand-in for every local reality."
              >
                <div className="grid gap-4">
                  <WidgetCard title="Workflow" description="How the data moves from BEA into this dashboard.">
                    <WorkflowBoard steps={data.methodology.workflow} />
                  </WidgetCard>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WidgetCard title="Limitations" description="What this dashboard still cannot fully capture." action={<Home className="h-4 w-4 text-[#5f6978]" />}>
                      <div className="space-y-3">
                        {data.methodology.caveats.map((item, index) => (
                          <div key={item} className="rounded-md border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Limitation {index + 1}</div>
                            <div className="mt-1 text-sm leading-6 text-[#44474c]">{item}</div>
                          </div>
                        ))}
                      </div>
                    </WidgetCard>
                    <WidgetCard title="Future Work" description="What would make the next version stronger.">
                      <div className="space-y-3">
                        {data.methodology.futureWork.map((item, index) => (
                          <div key={item} className="rounded-md border border-[#e4e2e3] bg-[#f7f8fa] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5f6978]">Next step {index + 1}</div>
                            <div className="mt-1 text-sm leading-6 text-[#44474c]">{item}</div>
                          </div>
                        ))}
                      </div>
                    </WidgetCard>
                  </div>
                  <WidgetCard title="References" description="Repo-backed data inputs and processing trail." action={<ScrollText className="h-4 w-4 text-[#5f6978]" />}>
                    <div className="rounded-md border border-[#e4e2e3] bg-[#fbfbfa] px-4 py-3">
                      <div className="space-y-3">
                        {data.methodology.sources.map((item, index) => (
                          <div key={item} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-[#ebe8e5] pb-3 last:border-b-0 last:pb-0">
                            <div className="pt-0.5 text-sm font-semibold text-[#5f6978]">[{index + 1}]</div>
                            <div className="text-sm leading-6 text-[#44474c]">{item}</div>
                          </div>
                        ))}
                      </div>
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
