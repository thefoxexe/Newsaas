"use client";

import { useLanguage } from "./i18n/language-context";

export function HowItWorksSection() {
  const { t } = useLanguage();

  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-6 py-28">
      <div className="reveal text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.how.eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{t.how.title}</h2>
      </div>
      <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
        {t.how.steps.map((step, i) => (
          <div key={step.title} className="reveal">
            <p className="font-display text-5xl font-bold text-border-strong">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-4 font-display text-xl font-semibold">{step.title}</h3>
            <p className="mt-2 text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
