import Link from "next/link";
import data from "@/data/dashboard-data.json";
import type { DashboardData } from "@/lib/dashboard-data";

const dashboardData = data as DashboardData;

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[#f3f0ea] px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl space-y-6 border border-black/20 bg-[#fbf9f4] p-6 md:p-8">
        <header className="space-y-3 border-b border-black/20 pb-4">
          <p className="text-xs uppercase tracking-[0.14em] text-black/60 font-[var(--font-ui)]">Methodology</p>
          <h1 className="font-[var(--font-heading)] text-4xl leading-tight">How this analysis was built</h1>
          <p className="text-sm text-black/70">
            A concise reference for data sources, assumptions, and caveats behind the editorial front page and dashboard.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Data sources</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-black/75">
            {dashboardData.methodology.sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Caveats</h2>
          <ul className="list-disc space-y-2 pl-6 text-sm leading-7 text-black/75">
            {dashboardData.methodology.caveats.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="flex items-center gap-4 border-t border-black/20 pt-4 text-xs uppercase tracking-[0.12em] text-black/60 font-[var(--font-ui)]">
          <Link href="/" className="hover:text-black">
            Front page
          </Link>
          <Link href="/dashboard" className="hover:text-black">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
