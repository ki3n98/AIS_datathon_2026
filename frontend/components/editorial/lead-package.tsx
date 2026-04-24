import type { DashboardData } from "@/lib/dashboard-data";
import { PullQuote } from "./pull-quote";
import { StoryRail } from "./story-rail";

type LeadPackageProps = {
  verdict: DashboardData["verdict"];
  railItems: DashboardData["overview"]["affordabilityRankings"];
};

export function LeadPackage({ verdict, railItems }: LeadPackageProps) {
  return (
    <section className="grid gap-5 border-b border-black/20 py-6 lg:grid-cols-[2fr_1fr]">
      <article className="space-y-4">
        <h2 className="font-[var(--font-heading)] text-3xl leading-tight text-black md:text-4xl">Where the American Dream still holds</h2>
        <p className="max-w-3xl text-sm leading-7 text-black/75">{verdict.summary}</p>
        <PullQuote label="Featured finding" quote={verdict.label} />
      </article>
      <StoryRail title="Top affordability leaders" items={railItems} valueLabel="Composite affordability index" />
    </section>
  );
}
