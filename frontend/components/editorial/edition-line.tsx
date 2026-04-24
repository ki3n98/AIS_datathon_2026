type EditionLineProps = {
  editionDate: string;
  issueLabel?: string;
};

export function EditionLine({ editionDate, issueLabel = "Datathon Special Edition" }: EditionLineProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-y border-black/20 py-2 text-[11px] uppercase tracking-[0.16em] text-black/65 font-[var(--font-ui)]">
      <span>{issueLabel}</span>
      <span>{editionDate}</span>
    </div>
  );
}
