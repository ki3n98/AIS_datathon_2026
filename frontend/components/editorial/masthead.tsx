import Link from "next/link";

type MastheadProps = {
  title: string;
  subtitle: string;
};

export function Masthead({ title, subtitle }: MastheadProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-black/70 font-[var(--font-ui)]">The American Dream News Desk</p>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-[0.12em] text-black/70 font-[var(--font-ui)]">
          <Link href="/dashboard" className="hover:text-black">
            Dashboard
          </Link>
          <Link href="/methodology" className="hover:text-black">
            Methodology
          </Link>
        </nav>
      </div>

      <div className="space-y-3">
        <h1 className="font-[var(--font-heading)] text-4xl leading-tight text-black md:text-6xl">{title}</h1>
        <p className="max-w-4xl text-base text-black/75 md:text-lg">{subtitle}</p>
      </div>
    </header>
  );
}
