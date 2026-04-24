import type { ReactNode } from "react";

type StorySectionProps = {
  children: ReactNode;
};

export function StorySection({ children }: StorySectionProps) {
  return <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">{children}</section>;
}
