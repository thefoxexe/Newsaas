"use client";

import { useLanguage } from "./i18n/language-context";
import { DemoCarousel } from "./demo-carousel";

export function DemosSection() {
  const { t } = useLanguage();

  return (
    <section id="demos" className="py-4">
      <div className="reveal mx-auto max-w-3xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.demos.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.demos.title}</h2>
        <p className="mt-4 text-muted">{t.demos.subtitle}</p>
      </div>
      <div className="mt-4">
        <DemoCarousel />
      </div>
    </section>
  );
}
