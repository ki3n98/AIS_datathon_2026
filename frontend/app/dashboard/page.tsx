import Link from "next/link";
import data from "@/data/dashboard-data.json";
import type { DashboardData } from "@/lib/dashboard-data";
import { ResearchDesk } from "@/components/dashboard/research-desk";

const dashboardData = data as DashboardData;

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#edf1f5] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-[#ced4dc] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#64748b] font-[var(--font-ui)]">Research desk mode</p>
            <h1 className="text-2xl font-semibold text-[#0f172a]">Interactive evidence dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-[#64748b] font-[var(--font-ui)]">
            <Link href="/" className="hover:text-[#0f172a]">
              Front page
            </Link>
            <Link href="/methodology" className="hover:text-[#0f172a]">
              Methodology
            </Link>
          </div>
        </header>

        <ResearchDesk data={dashboardData} />
      </div>
    </main>
  );
}
