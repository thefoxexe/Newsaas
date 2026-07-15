"use client";

import { useLanguage } from "./i18n/language-context";

// Renders as a fragment, not its own <section> — it shares an outer
// <section> wrapper with FeaturesGrid (see page.tsx) purely for layout
// (shared max-width/padding), not because the two blocks are semantically
// one thing.
export function CompareBlock() {
  const { t } = useLanguage();

  return (
    <div className="reveal rounded-card border border-border bg-surface p-8 sm:p-12">
      <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">{t.compare.title}</h2>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-card border border-border bg-background p-6">
          <p className="font-display font-semibold text-muted">{t.compare.ugcTitle}</p>
          <p className="mt-3 text-foreground">{t.compare.ugcBody}</p>
        </div>
        <div className="relative rounded-card border border-primary bg-background p-6">
          <span className="absolute -top-3 left-6 rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            ReelJolt
          </span>
          <p className="mt-2 font-display font-semibold text-primary">{t.compare.usTitle}</p>
          <p className="mt-3 text-foreground">{t.compare.usBody}</p>
        </div>
      </div>
    </div>
  );
}
