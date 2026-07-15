"use client";

import { useLanguage } from "./i18n/language-context";
import { UrlAnalyzer } from "./url-analyzer";

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <>
      <div
        aria-hidden
        className="glow-secondary pointer-events-none absolute -top-24 left-1/2 h-[30rem] w-[30rem] -translate-x-[70%] opacity-60 blur-3xl"
      />
      <div
        aria-hidden
        className="glow-primary pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 blur-3xl"
      />

      <section className="relative mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
        <span
          className="reveal-eager inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted"
          style={{ animationDelay: "0ms" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {t.hero.badge}
        </span>

        <h1
          className="reveal-eager mt-8 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          {t.hero.title1}
          <br />
          <span className="text-gradient">{t.hero.titleHighlight}</span> {t.hero.title2}
        </h1>

        <p
          className="reveal-eager mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl"
          style={{ animationDelay: "160ms" }}
        >
          {t.hero.subtitle}
        </p>

        <div className="reveal-eager" style={{ animationDelay: "240ms" }}>
          <UrlAnalyzer />
        </div>
      </section>
    </>
  );
}
