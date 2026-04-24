type SectionDividerProps = {
  kicker: string;
  title: string;
  deck?: string;
};

export function SectionDivider({ kicker, title, deck }: SectionDividerProps) {
  return (
    <header className="space-y-2 border-t border-black/20 pt-6">
      <p className="text-[11px] uppercase tracking-[0.14em] text-black/60 font-[var(--font-ui)]">{kicker}</p>
      <h2 className="font-[var(--font-heading)] text-3xl leading-tight text-black">{title}</h2>
      {deck ? <p className="max-w-3xl text-sm leading-7 text-black/75">{deck}</p> : null}
    </header>
  );
}
