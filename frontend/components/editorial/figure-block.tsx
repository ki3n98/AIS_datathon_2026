import type { ReactNode } from "react";

type FigureBlockProps = {
  title: string;
  caption: string;
  source: string;
  children: ReactNode;
};

export function FigureBlock({ title, caption, source, children }: FigureBlockProps) {
  return (
    <figure className="space-y-3 border border-black/20 bg-[#fcfaf6] p-4">
      <figcaption className="space-y-1">
        <p className="font-semibold text-black">{title}</p>
        <p className="text-sm text-black/75">{caption}</p>
      </figcaption>
      <div className="h-[300px] w-full">{children}</div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-black/55 font-[var(--font-ui)]">Source: {source}</p>
    </figure>
  );
}
