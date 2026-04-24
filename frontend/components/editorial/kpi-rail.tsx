import type { DashboardData } from "@/lib/dashboard-data";

type KpiRailProps = {
  items: DashboardData["overview"]["kpis"];
};

function deltaLabel(changeLabel: string) {
  const trimmed = changeLabel.trim();
  if (trimmed.startsWith("+")) return `▲ ${trimmed}`;
  if (trimmed.startsWith("-")) return `▼ ${trimmed}`;
  return trimmed;
}

export function KpiRail({ items }: KpiRailProps) {
  return (
    <section className="grid border-y border-black/20 md:grid-cols-4">
      {items.slice(0, 4).map((kpi) => (
        <article key={kpi.label} className="border-r border-black/20 p-5 last:border-r-0">
          <p className="text-[11px] uppercase tracking-[0.12em] text-black/60 font-[var(--font-ui)]">{kpi.label}</p>
          <p className="mt-2 text-2xl font-semibold text-black">{kpi.value}</p>
          <p className="mt-1 text-xs text-black/60 font-[var(--font-ui)]">{deltaLabel(kpi.changeLabel)}</p>
          <p className="mt-2 text-xs text-black/70">{kpi.note}</p>
        </article>
      ))}
    </section>
  );
}
