import type { RankedMetric } from "@/lib/dashboard-data";

type StoryRailProps = {
  title: string;
  items: RankedMetric[];
  valueLabel: string;
};

export function StoryRail({ title, items, valueLabel }: StoryRailProps) {
  return (
    <aside className="space-y-3 border border-black/20 bg-[#f7f3ec] p-4">
      <h3 className="font-semibold text-black">{title}</h3>
      <div className="space-y-2">
        {items.slice(0, 6).map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between border-b border-black/10 py-2 text-sm">
            <span>
              {idx + 1}. {item.label}
            </span>
            <span className="font-medium">{item.formattedValue}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/55 font-[var(--font-ui)]">{valueLabel}</p>
    </aside>
  );
}
