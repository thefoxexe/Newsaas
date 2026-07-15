"use client";

import { useLanguage } from "./i18n/language-context";

export function StatsSection() {
  const { t } = useLanguage();

  const stats = [
    { k: t.stats.time, v: t.stats.timeLabel },
    { k: t.stats.concepts, v: t.stats.conceptsLabel },
    { k: t.stats.formats, v: t.stats.formatsLabel },
    { k: t.stats.deterministic, v: t.stats.deterministicLabel },
  ];

  return (
    <section className="border-y border-border bg-surface/50">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 py-10 text-center sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={stat.v} className="reveal-eager" style={{ animationDelay: `${i * 80}ms` }}>
            <p className="font-display text-3xl font-bold text-primary">{stat.k}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted">{stat.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
