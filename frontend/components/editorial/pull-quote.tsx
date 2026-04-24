type PullQuoteProps = {
  label: string;
  quote: string;
};

export function PullQuote({ label, quote }: PullQuoteProps) {
  return (
    <aside className="space-y-3 border border-black/20 bg-[#f7f3ec] p-5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/60 font-[var(--font-ui)]">{label}</p>
      <blockquote className="text-xl leading-relaxed text-black/85">“{quote}”</blockquote>
    </aside>
  );
}
