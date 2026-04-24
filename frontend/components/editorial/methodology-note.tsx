type MethodologyNoteProps = {
  caveats: string[];
  sources: string[];
};

export function MethodologyNote({ caveats, sources }: MethodologyNoteProps) {
  return (
    <section className="space-y-4 border border-black/20 bg-[#fcfaf6] p-5">
      <h3 className="font-[var(--font-heading)] text-2xl text-black">Methodology and caveats</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-black/75">
        {caveats.slice(0, 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/55 font-[var(--font-ui)]">
        Sources: {sources.slice(0, 3).join(" · ")}
      </p>
    </section>
  );
}
