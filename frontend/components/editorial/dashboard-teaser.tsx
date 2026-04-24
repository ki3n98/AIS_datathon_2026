import Link from "next/link";

type DashboardTeaserProps = {
  summary: string;
};

export function DashboardTeaser({ summary }: DashboardTeaserProps) {
  return (
    <section className="space-y-3 border border-black/20 bg-[#111] p-6 text-white">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/70 font-[var(--font-ui)]">Research desk</p>
      <h3 className="font-[var(--font-heading)] text-2xl leading-tight">Explore the full dashboard</h3>
      <p className="text-sm leading-7 text-white/80">{summary}</p>
      <Link
        href="/dashboard"
        className="inline-flex items-center border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.12em] font-[var(--font-ui)] hover:bg-white/10"
      >
        Open interactive dashboard
      </Link>
    </section>
  );
}
