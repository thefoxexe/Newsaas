"use client";

import { useLanguage } from "./i18n/language-context";

// See compare-section.tsx for why this doesn't own its own <section>.
export function FeaturesGrid() {
  const { t } = useLanguage();

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {t.features.map((feature) => (
        <div key={feature.title} className="reveal card-hover rounded-card border border-border bg-surface p-6">
          <div className="h-8 w-8 rounded-md bg-primary/15" />
          <h3 className="mt-4 font-display font-semibold">{feature.title}</h3>
          <p className="mt-2 text-sm text-muted">{feature.body}</p>
        </div>
      ))}
    </div>
  );
}
