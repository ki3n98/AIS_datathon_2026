import Link from "next/link";
import data from "@/data/dashboard-data.json";
import type { DashboardData } from "@/lib/dashboard-data";
import { AmericanDreamDashboard } from "@/components/american-dream-dashboard";

const dashboardData = data as DashboardData;

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#eef1f4] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border border-[#cfd5dd] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#5f6978] font-[var(--font-ui)]">Research desk</p>
            <h1 className="text-2xl font-semibold text-[#1b1c1d]">Interactive dashboard</h1>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] font-[var(--font-ui)] text-[#5f6978]">
            <Link href="/" className="hover:text-[#1b1c1d]">
              Back to front page
            </Link>
            <Link href="/methodology" className="hover:text-[#1b1c1d]">
              Methodology
            </Link>
          </div>
        </header>

        <AmericanDreamDashboard data={dashboardData} />
      </div>
    </main>
  );
}
